'use strict';

import colors from 'colors';
import assign from 'object-assign';
import kongState from './kongState';
import {getSchema as getConsumerCredentialSchema} from './consumerCredentials';
import {normalize as normalizeAttributes} from './utils';
import { migrateApiDefinition } from './migrate';
import diff from './diff';
import {
    noop,
    createApi,
    removeApi,
    updateApi,
    addApiPlugin,
    removeApiPlugin,
    updateApiPlugin,
    addGlobalPlugin,
    removeGlobalPlugin,
    updateGlobalPlugin,
    createConsumer,
    updateConsumer,
    removeConsumer,
    addConsumerCredentials,
    updateConsumerCredentials,
    removeConsumerCredentials,
    addConsumerAcls,
    removeConsumerAcls
} from './actions';

export const consumerAclSchema = {
    id: 'group'
};


export function getAclSchema() {
    return consumerAclSchema;
}

export default async function execute(config, adminApi, logger = () => {}) {
    const actions = [
        ...consumers(config.consumers),
        ...apis(config.apis),
        ...globalPlugins(config.plugins)
    ];

    return actions
        .map(_bindWorldState(adminApi))
        .reduce((promise, action) => promise.then(_executeActionOnApi(action, adminApi, logger)), Promise.resolve(''));
}

export function apis(apis = []) {
    return apis.reduce((actions, api) => [...actions, _api(api), ..._apiPlugins(api)], []);
};

export function globalPlugins(globalPlugins = []) {
    return globalPlugins.reduce((actions, plugin) => [...actions, _globalPlugin(plugin)], []);
}

export function plugins(apiName, plugins) {
    return plugins.reduce((actions, plugin) => [...actions, _plugin(apiName, plugin)], []);
}

export function consumers(consumers = []) {
    return consumers.reduce((calls, consumer) => [...calls, _consumer(consumer), ..._consumerCredentials(consumer), ..._consumerAcls(consumer)], []);
}

export function credentials(username, credentials) {
    return credentials.reduce((actions, credential) => [...actions, _consumerCredential(username, credential)], []);
}

export function acls(username, acls) {
    return acls.reduce((actions, acl) => [...actions, _consumerAcl(username, acl)], []);
}

function parseResponseContent(content) {
    try {
        return JSON.parse(content);
    } catch (e) {}

    return content;
}

function _executeActionOnApi(action, adminApi, logger) {
    return async () => {
        const params = await action();

        logger({ type: 'action', params });

        if (params.noop) {
            return Promise.resolve('No-op');
        }

        logger({ type: 'request', params, uri: adminApi.router(params.endpoint) });

        return adminApi
            .requestEndpoint(params.endpoint, params)
            .then(response => {
                logger({
                    type: 'response',
                    ok: response.ok,
                    uri: adminApi.router(params.endpoint),
                    status: response.status,
                    statusText: response.statusText,
                    params,
                });

                if (!response.ok) {
                    if (params.endpoint.name == 'consumer' && params.method == 'DELETE') {
                        logger({ type: 'debug', message: 'Bug in Kong throws error, Consumer has still been removed will continue'});

                        return response;
                    }

                    return response.text()
                        .then(content => {
                            logger({ type: 'response-error', statusText: response.statusText, content: parseResponseContent(content) });

                            throw new Error(`${response.statusText}\n${content}`);
                        });
                } else {
                    response.text()
                        .then(content => {
                            logger({ type: 'response-content', content: parseResponseContent(content) });
                        });
                }

                return response;
            });
        }
}

function _bindWorldState(adminApi) {
    return f => async () => {
        const state = await kongState(adminApi);
        return f(_createWorld(state));
    }
}

function _createWorld({apis, consumers, plugins, version}) {
    const world = {
        getVersion: () => version,

        hasApi: apiName => Array.isArray(apis) && apis.some(api => api.name === apiName),
        getApi: apiName => {
            const api = apis.find(api => api.name === apiName);

            if (!api) {
                throw new Error(`Unable to find api ${apiName}`);
            }

            return api;
        },
        getApiId: apiName => {
            const id = world.getApi(apiName).id;

            if (!id) {
                throw new Error(`API ${apiName} doesn't have an Id`);
            }

            return id;
        },
        getGlobalPlugin: (pluginName, pluginConsumerID) => {
            const plugin = plugins.find(plugin => plugin.api_id === undefined && plugin.name === pluginName && plugin.consumer_id == pluginConsumerID);

            if (!plugin) {
                throw new Error(`Unable to find global plugin ${pluginName}`);
            }

            return plugin;
        },
        getPlugin: (apiName, pluginName, pluginConsumerID) => {
            const plugin = world.getApi(apiName).plugins.find(plugin => plugin.name == pluginName && plugin.consumer_id == pluginConsumerID);

            if (!plugin) {
                throw new Error(`Unable to find plugin ${pluginName}`);
            }

            return plugin;
        },
        getPluginId: (apiName, pluginName, pluginConsumerID) => {
            return world.getPlugin(apiName, pluginName, pluginConsumerID).id;
        },
        getGlobalPluginId: (pluginName, pluginConsumerID) => {
            return world.getGlobalPlugin(pluginName, pluginConsumerID).id;
        },
        getPluginAttributes: (apiName, pluginName) => {
            return world.getPlugin(apiName, pluginName).config;
        },
        getGlobalPluginAttributes: (pluginName, pluginConsumerID) => {
            return world.getGlobalPlugin(pluginName, pluginConsumerID).config;
        },
        hasPlugin: (apiName, pluginName, pluginConsumerID) => {
            return Array.isArray(apis) && apis.some(api => api.name === apiName && Array.isArray(api.plugins) && api.plugins.some(plugin => plugin.name == pluginName && plugin.consumer_id == pluginConsumerID));
        },
        hasGlobalPlugin: (pluginName, pluginConsumerID) => {
            return Array.isArray(plugins) && plugins.some(plugin => plugin.api_id === undefined && plugin.name === pluginName && plugin.consumer_id === pluginConsumerID);
        },
        hasConsumer: (username) => {
            return Array.isArray(consumers) && consumers.some(consumer => consumer.username === username);
        },
        hasConsumerCredential: (username, name, attributes) => {
            const schema = getConsumerCredentialSchema(name);

            return Array.isArray(consumers) && consumers.some(
                c => c.username === username
                && Array.isArray(c.credentials[name])
                && c.credentials[name].some(oa => oa[schema.id] == attributes[schema.id]));
        },
        hasConsumerAcl: (username, groupName) => {
            const schema = getAclSchema();

            return Array.isArray(consumers) && consumers.some(function (consumer) {
                return Array.isArray(consumer.acls) && consumer.acls.some(function (acl) {
                    return consumer.username === username && acl[schema.id] == groupName;
                });
            });
        },

        getConsumer: username => {
            const consumer = consumers.find(c => c.username === username);

            if (!consumer) {
                throw new Error(`Unable to find consumer ${username}`);
            }

            return consumer;
        },

        getConsumerId: username => {
            return world.getConsumer(username).id;
        },

        getConsumerByCustomId: custom_id => {
            const consumer = consumers.find(c => c.custom_id === custom_id);

            if (!consumer) {
                throw new Error(`Unable to find consumer ${custom_id}`);
            }

            return consumer;
        },

        getConsumerIdByCustomId: custom_id => {
            return world.getConsumerByCustomId(custom_id).id;
        },

        getConsumerCredential: (username, name, attributes) => {
            const consumer = consumers.find(c => c.username === username);

            if (!consumer) {
                throw new Error(`Unable to find consumer ${username}`);
            }

            const credential = extractCredentialId(consumer.credentials, name, attributes);

            if (!credential) {
                throw new Error(`Unable to find credential`);
            }

            return credential;
        },

        getConsumerAcl: (username, groupName) => {
            const consumer = consumers.find(c => c.username === username);

            if (!consumer) {
                throw new Error(`Unable to find consumer ${username}`);
            }

            const acl = extractAclId(consumer.acls, groupName);

            if (!acl) {
                throw new Error(`Unable to find acl`);
            }

            return acl;
        },

        getConsumerCredentialId: (username, name, attributes) => {
            return world.getConsumerCredential(username, name, attributes).id;
        },

        getConsumerAclId: (username, groupName) => {
            return world.getConsumerAcl(username, groupName).id;
        },

        isConsumerUpToDate: (username, custom_id) => {
            const consumer = consumers.find(c => c.username === username);

            return consumer.custom_id == custom_id;
        },

        isApiUpToDate: (api) => diff(api.attributes, world.getApi(api.name)).length == 0,

        isApiPluginUpToDate: (apiName, plugin) => {
            if (false == plugin.hasOwnProperty('attributes')) {
                // of a plugin has no attributes, and its been added then it is up to date
                return true;
            }

            let current = world.getPlugin(apiName, plugin.name, plugin.attributes.consumer_id);
            let {config, ...rest} = normalizeAttributes(plugin.attributes);

            return diff(config, current.config).length === 0 && diff(rest, current).length === 0;
        },

        isGlobalPluginUpToDate: (plugin) => {
            if (false == plugin.hasOwnProperty('attributes')) {
                // of a plugin has no attributes, and its been added then it is up to date
                return true;
            }

            let current = world.getGlobalPlugin(plugin.name, plugin.attributes.consumer_id);
            let {config, ...rest} = normalizeAttributes(plugin.attributes);

            return diff(config, current.config).length === 0 && diff(rest, current).length === 0;
        },

        isConsumerCredentialUpToDate: (username, credential) => {
            const current = world.getConsumerCredential(username, credential.name, credential.attributes);

            return diff(credential.attributes, current).length === 0;
        },
    };

    return world;
}

function extractCredentialId(credentials, name, attributes) {
    const idName = getConsumerCredentialSchema(name).id;

    return credentials[name].find(x => x[idName] == attributes[idName]);
}

function extractAclId(acls, groupName) {
    const idName = getAclSchema().id;
    return acls.find(x => x[idName] == groupName);
}

function _api(api) {
    validateEnsure(api.ensure);
    validateApiRequiredAttributes(api);

    return migrateApiDefinition(api, (api, world) => {
        if (api.ensure == 'removed') {
            return world.hasApi(api.name) ? removeApi(api.name) : noop({ type: 'noop-api', api });
        }

        if (world.hasApi(api.name)) {
            if (world.isApiUpToDate(api)) {
                return noop({ type: 'noop-api', api });
            }

            return updateApi(api.name, api.attributes);
        }

        return createApi(api.name, api.attributes);
    });
}

function _apiPlugins(api) {
    return api.plugins && api.ensure != 'removed' ? plugins(api.name, api.plugins) : [];
}

function validateEnsure(ensure) {
    if (!ensure) {
        return;
    }

    if (['removed', 'present'].indexOf(ensure) === -1) {
        throw new Error(`Invalid ensure "${ensure}"`);
    }
}

function validateApiRequiredAttributes(api) {
    if (false == api.hasOwnProperty('name')) {
        throw Error(`"Api name is required: ${JSON.stringify(api, null, '  ')}`);
    }

    if (false == api.hasOwnProperty('attributes')) {
        throw Error(`"${api.name}" api has to declare "upstream_url" attribute`);
    }

    if (false == api.attributes.hasOwnProperty('upstream_url')) {
        throw Error(`"${api.name}" api has to declare "upstream_url" attribute`);
    }

}

//Determain the consumerID from a given config
function pluginConsumerId(world, plugin) {
        let consumerID = undefined;
        if (plugin.username) {
            consumerID = world.getConsumerId(plugin.username);
            console.log("  - Found consumer_id", `${consumerID}`.bold, "for username", `${plugin.username}`.bold, ". Substituting consumer_id");
        }
        else if (plugin.custom_id) {
            consumerID = world.getConsumerIdByCustomId(plugin.custom_id);
            console.log("  - Found consumer_id", `${consumerID}`.bold, "for custom_id", `${plugin.custom_id}`.bold, ". Substituting consumer_id");
        }
        else if (plugin.hasOwnProperty('attributes') && plugin.attributes.consumer_id) {
            consumerID = plugin.attributes.consumer_id;
        }
        if (consumerID) {
            if (!plugin.attributes) {
                plugin.attributes = {};
            }
            plugin.attributes.consumer_id = consumerID;
        }
        return consumerID
}

function _plugin(apiName, plugin) {
    validateEnsure(plugin.ensure);

    return world => {
        var consumerID = pluginConsumerId(world, plugin);
        if (plugin.ensure == 'removed') {
            if (world.hasPlugin(apiName, plugin.name, consumerID)) {
                return removeApiPlugin(world.getApiId(apiName), world.getPluginId(apiName, plugin.name, consumerID));
            }

            return noop({ type: 'noop-plugin', plugin });
        }

        if (world.hasPlugin(apiName, plugin.name, consumerID)) {
            if (world.isApiPluginUpToDate(apiName, plugin)) {
                return noop({ type: 'noop-plugin', plugin });
            }

            return updateApiPlugin(world.getApiId(apiName), world.getPluginId(apiName, plugin.name, consumerID), plugin.attributes);
        }

        return addApiPlugin(world.getApiId(apiName), plugin.name, plugin.attributes);
    }
}

function _globalPlugin(plugin) {
    validateEnsure(plugin.ensure);

    return world => {
        var consumerID = pluginConsumerId(world, plugin);
        if (plugin.ensure == 'removed') {
            if (world.hasGlobalPlugin(plugin.name, consumerID)) {
                return removeGlobalPlugin(world.getGlobalPluginId(plugin.name, consumerID));
            }

            return noop({ type: 'noop-global-plugin', plugin });
        }

        if (world.hasGlobalPlugin(plugin.name, consumerID)) {
            if (world.isGlobalPluginUpToDate(plugin)) {
                return noop({ type: 'noop-global-plugin', plugin });
            }

            return updateGlobalPlugin(world.getGlobalPluginId(plugin.name, consumerID), plugin.attributes);
        }

        return addGlobalPlugin(plugin.name, plugin.attributes);
    }
}

function _consumer(consumer) {
    validateEnsure(consumer.ensure);
    validateConsumer(consumer);

    return world => {
        if (consumer.ensure == 'removed') {
            if (world.hasConsumer(consumer.username)) {
                return removeConsumer(world.getConsumerId(consumer.username));
            }

            return noop({ type: 'noop-consumer', consumer });
        }

        if (!world.hasConsumer(consumer.username)) {
            return createConsumer(consumer.username, consumer.custom_id);
        }

        if (!world.isConsumerUpToDate(consumer.username, consumer.custom_id)) {
            return updateConsumer(world.getConsumerId(consumer.username), { username: consumer.username, custom_id: consumer.custom_id });
        }

        return noop({ type: 'noop-consumer', consumer });
    }

    let _credentials = [];

    if (consumer.credentials && consumer.ensure != 'removed') {
        _credentials = consumerCredentials(consumer.username, consumer.credentials);
    }

    let _acls = [];

    if (consumer.acls && consumer.ensure != 'removed') {
        _acls = consumerAcls(consumer.username, consumer.acls);
    }

    return [consumerAction, ..._credentials, ..._acls];
}

function validateConsumer({username}) {
    if (!username) {
        throw new Error("Consumer username must be specified");
    }
}

function _consumerCredentials(consumer) {
    if (!consumer.credentials || consumer.ensure == 'removed') {
        return [];
    }

    return credentials(consumer.username, consumer.credentials);
}

function _consumerCredential(username, credential) {
    validateEnsure(credential.ensure);
    validateCredentialRequiredAttributes(credential);

    return world => {
        if (credential.ensure == 'removed') {
            if (world.hasConsumerCredential(username, credential.name, credential.attributes)) {
                const credentialId = world.getConsumerCredentialId(username, credential.name, credential.attributes);

                return removeConsumerCredentials(world.getConsumerId(username), credential.name, credentialId);
            }

            return noop({ type: 'noop-credential', credential, credentialIdName });
        }

        if (world.hasConsumerCredential(username, credential.name, credential.attributes)) {
            const credentialId = world.getConsumerCredentialId(username, credential.name, credential.attributes);

            if (world.isConsumerCredentialUpToDate(username, credential)) {
                const credentialIdName = getConsumerCredentialSchema(credential.name).id;

                return noop({ type: 'noop-credential', credential, credentialIdName });
            }

            return updateConsumerCredentials(world.getConsumerId(username), credential.name, credentialId, credential.attributes);
        }

        return addConsumerCredentials(world.getConsumerId(username), credential.name, credential.attributes);
    }
}

function validateCredentialRequiredAttributes(credential) {
    const credentialIdName = getConsumerCredentialSchema(credential.name).id;

    if (false == credential.hasOwnProperty('attributes')) {
        throw Error(`${credential.name} has to declare attributes.${credentialIdName}`);
    }

    if (false == credential.attributes.hasOwnProperty(credentialIdName)) {
        throw Error(`${credential.name} has to declare attributes.${credentialIdName}`);
    }
}

function validateAclRequiredAttributes(acl) {
    const aclIdName = getAclSchema().id;

    if (false == acl.hasOwnProperty(aclIdName)) {
        throw Error(`ACLs has to declare property ${aclIdName}`);
    }
}

function _consumerAcls(consumer) {
    if (!consumer.acls || consumer.ensure == 'removed') {
        return [];
    }

    return acls(consumer.username, consumer.acls);
}

function _consumerAcl(username, acl) {

    validateEnsure(acl.ensure);
    validateAclRequiredAttributes(acl);

    return world => {
        if (acl.ensure == 'removed') {
            if (world.hasConsumerAcl(username, acl.group)) {
                const aclId = world.getConsumerAclId(username, acl.group);

                return removeConsumerAcls(world.getConsumerId(username), aclId);
            }

            return noop({ type: 'noop-acl', acl });
        }

        if (world.hasConsumerAcl(username, acl.group)) {
            return noop({ type: 'noop-acl', acl });
        }

        return addConsumerAcls(world.getConsumerId(username), acl.group);
    }
}

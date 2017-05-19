'use strict';

import colors from 'colors';
import assign from 'object-assign';
import invariant from 'invariant';
import readKongApi from './readKongApi';
import {getSchema as getConsumerCredentialSchema} from './consumerCredentials';
import {normalize as normalizeAttributes} from './utils';
import { migrateApiDefinition } from './migrate';
import { logReducer } from './kongStateLocal';
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

const logFanout = () => {
    const listeners = [];

    return {
        logger: log => listeners.forEach(f => f(log)),
        subscribe: f => listeners.push(f),
    };
};

const selectWorldStateBind = async (adminApi, internalLogger) => {
    if (process.env.EXPERIMENTAL_USE_LOCAL_STATE == '1') {
        internalLogger.logger({ type: 'experimental-features', message: `Using experimental feature: local state`.blue.bold});
        let state = await readKongApi(adminApi);

        internalLogger.subscribe(log => {
            state = logReducer(state, log);
        });

        return f => async () => f(_createWorld(state));
    }

    return _bindWorldState(adminApi);
};

export default async function execute(config, adminApi, logger = () => {}) {
    const internalLogger = logFanout();
    const actions = [
        ...consumers(config.consumers),
        ...apis(config.apis),
        ...globalPlugins(config.plugins)
    ];

    internalLogger.subscribe(logger);

    internalLogger.logger({
        type: 'kong-info',
        version: await adminApi.fetchKongVersion(),
    });

    return actions
        .map(await selectWorldStateBind(adminApi, internalLogger))
        .reduce((promise, action) => promise.then(_executeActionOnApi(action, adminApi, internalLogger.logger)), Promise.resolve(''));
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

        if (params.noop) {
            logger({ type: 'noop', params });

            return Promise.resolve('No-op');
        }

        logger({ type: 'request', params, uri: adminApi.router(params.endpoint) });

        return adminApi
            .requestEndpoint(params.endpoint, params)
            .then(response => Promise.all([
                {
                    type: 'response',
                    ok: response.ok,
                    uri: adminApi.router(params.endpoint),
                    status: response.status,
                    statusText: response.statusText,
                    params,
                },
                response.text()
            ]))
            .then(([response, content]) => {
                logger({ ...response, content: parseResponseContent(content) });

                if (!response.ok) {
                    const error = new Error(`${response.statusText}\n${content}`);
                    error.response = response;

                    throw error;
                }
            });
        }
}

function _bindWorldState(adminApi) {
    return f => async () => {
        const state = await readKongApi(adminApi);

        return f(_createWorld(state));
    }
}

function _createWorld({apis, consumers, plugins, _info: { version }}) {
    const world = {
        getVersion: () => version,

        hasApi: apiName => Array.isArray(apis) && apis.some(api => api.name === apiName),
        getApi: apiName => {
            const api = apis.find(api => api.name === apiName);

            invariant(api, `Unable to find api ${apiName}`);

            return api;
        },
        getApiId: apiName => {
            const id = world.getApi(apiName)._info.id;

            invariant(id, `API ${apiName} doesn't have an Id`);

            return id;
        },
        getGlobalPlugin: (pluginName, pluginConsumerID) => {
            const plugin = plugins.find(plugin => plugin.api_id === undefined && plugin.name === pluginName && plugin.consumer_id == pluginConsumerID);

            invariant(plugin, `Unable to find global plugin ${pluginName}`);

            return plugin;
        },
        getPlugin: (apiName, pluginName, pluginConsumerID) => {
            const plugin = world.getApi(apiName).plugins.find(plugin => plugin.name == pluginName && plugin.consumer_id == pluginConsumerID);

            invariant(plugin, `Unable to find plugin ${pluginName}`);

            return plugin;
        },
        getPluginId: (apiName, pluginName, pluginConsumerID) => {
            const pluginId = world.getPlugin(apiName, pluginName, pluginConsumerID)._info.id;

            invariant(pluginId, `Unable to find plugin id for ${apiName} and ${pluginName}`);

            return pluginId;
        },
        getGlobalPluginId: (pluginName, pluginConsumerID) => {
            const globalPluginId = world.getGlobalPlugin(pluginName, pluginConsumerID)._info.id

            invariant(globalPluginId, `Unable to find global plugin id ${pluginName}`);

            return globalPluginId;
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
            const consumer = world.getConsumer(username);

            return !!extractCredential(consumer.credentials, name, attributes);
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

            invariant(consumer, `Unable to find consumer ${username}`);

            return consumer;
        },

        getConsumerId: username => {
            const consumerId = world.getConsumer(username)._info.id;

            invariant(consumerId, `Unable to find consumer id ${username}`);

            return consumerId;
        },

        getConsumerCredential: (username, name, attributes) => {
            const consumer = world.getConsumer(username);

            const credential = extractCredential(consumer.credentials, name, attributes);

            invariant(credential, `Unable to find consumer credential ${username} ${name}`);

            return credential;
        },

        getConsumerAcl: (username, groupName) => {
            const consumer = world.getConsumer(username);

            const acl = extractAclId(consumer.acls, groupName);

            invariant(acl, `Unable to find consumer acl ${username} ${groupName}`);

            return acl;
        },

        getConsumerCredentialId: (username, name, attributes) => {
            const credentialId = world.getConsumerCredential(username, name, attributes)._info.id;

            invariant(credentialId, `Unable to find consumer credential id ${username} ${name}`);

            return credentialId;
        },

        getConsumerAclId: (username, groupName) => {
            const aclId = world.getConsumerAcl(username, groupName)._info.id;

            invariant(aclId, `Unable to find consumer acl id ${username} ${groupName}`);

            return aclId;
        },

        isConsumerUpToDate: (username, custom_id) => {
            const consumer = world.getConsumer(username);

            return consumer.custom_id == custom_id;
        },

        isApiUpToDate: (api) => {
            return diff(api.attributes, world.getApi(api.name).attributes).length == 0;
        },

        isApiPluginUpToDate: (apiName, plugin) => {
            if (false == plugin.hasOwnProperty('attributes')) {
                // of a plugin has no attributes, and its been added then it is up to date
                return true;
            }

            let current = world.getPlugin(apiName, plugin.name, plugin.attributes.consumer_id);
            let attributes = normalizeAttributes(plugin.attributes);

            return isAttributesWithConfigUpToDate(attributes, current.attributes);
        },

        isGlobalPluginUpToDate: (plugin) => {
            if (false == plugin.hasOwnProperty('attributes')) {
                // of a plugin has no attributes, and its been added then it is up to date
                return true;
            }

            let current = world.getGlobalPlugin(plugin.name, plugin.attributes.consumer_id);
            let attributes = normalizeAttributes(plugin.attributes);

            return isAttributesWithConfigUpToDate(attributes, current.attributes);
        },

        isConsumerCredentialUpToDate: (username, credential) => {
            const current = world.getConsumerCredential(username, credential.name, credential.attributes);

            return isAttributesWithConfigUpToDate(credential.attributes, current.attributes);
        },
    };

    return world;
}

function isAttributesWithConfigUpToDate(defined, current) {
    const excludingConfig = ({ config, ...rest }) => rest;

    return diff(defined.config, current.config).length === 0
        && diff(excludingConfig(defined), excludingConfig(current)).length === 0;
}

function extractCredential(credentials, name, attributes) {
    const idName = getConsumerCredentialSchema(name).id;

    const credential = credentials
        .filter(c => c.name === name)
        .filter(c => c.attributes[idName] === attributes[idName]);

    invariant(credential.length <= 1, `consumer shouldn't have multiple ${name} credentials with ${idName} = ${attributes[idName]}`)

    return credential.length ? credential[0] : undefined;
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

function _plugin(apiName, plugin) {
    validateEnsure(plugin.ensure);

    return world => {
        if (plugin.ensure == 'removed') {
            if (world.hasPlugin(apiName, plugin.name, plugin.attributes.consumer_id)) {
                return removeApiPlugin(world.getApiId(apiName), world.getPluginId(apiName, plugin.name, plugin.attributes.consumer_id));
            }

            return noop({ type: 'noop-plugin', plugin });
        }

        if (world.hasPlugin(apiName, plugin.name, plugin.attributes.consumer_id)) {
            if (world.isApiPluginUpToDate(apiName, plugin)) {
                return noop({ type: 'noop-plugin', plugin });
            }

            return updateApiPlugin(world.getApiId(apiName), world.getPluginId(apiName, plugin.name, plugin.attributes.consumer_id), plugin.attributes);
        }

        return addApiPlugin(world.getApiId(apiName), plugin.name, plugin.attributes);
    }
}

function _globalPlugin(plugin) {
    validateEnsure(plugin.ensure);

    return world => {
        if (plugin.ensure == 'removed') {
            if (world.hasGlobalPlugin(plugin.name, plugin.attributes.consumer_id)) {
                return removeGlobalPlugin(world.getGlobalPluginId(plugin.name, plugin.attributes.consumer_id));
            }

            return noop({ type: 'noop-global-plugin', plugin });
        }

        if (world.hasGlobalPlugin(plugin.name, plugin.attributes.consumer_id)) {
            if (world.isGlobalPluginUpToDate(plugin)) {
                return noop({ type: 'noop-global-plugin', plugin });
            }

            return updateGlobalPlugin(world.getGlobalPluginId(plugin.name, plugin.attributes.consumer_id), plugin.attributes);
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

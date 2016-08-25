'use strict';

import colors from 'colors';
import assign from 'object-assign';
import kongState from './kongState';
import {getSchema as getConsumerCredentialSchema} from './consumerCredentials';
import {normalize as normalizeAttributes} from './utils';
import {
    noop,
    createApi,
    removeApi,
    updateApi,
    addApiPlugin,
    removeApiPlugin,
    updateApiPlugin,
    createConsumer,
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

export default async function execute(config, adminApi) {
    const actions = [
        ...apis(config.apis),
        ...consumers(config.consumers)
    ];

    return actions
        .map(_bindWorldState(adminApi))
        .reduce((promise, action) => promise.then(_executeActionOnApi(action, adminApi)), Promise.resolve(''));
}

export function apis(apis = []) {
    return apis.reduce((actions, api) => [...actions, _api(api), ..._apiPlugins(api)], []);
};

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

function _executeActionOnApi(action, adminApi) {
    return async () => {
        const params = await action();

        if (params.noop) {
            return Promise.resolve('No-op');
        }

        return adminApi
            .requestEndpoint(params.endpoint, params)
            .then(response => {
                console.info(
                    `\n${params.method.blue}`,
                    response.ok ? ('' + response.status).bold.green : ('' + response.status).bold.red,
                    adminApi.router(params.endpoint).blue,
                    "\n",
                    params.body ? params.body : ''
                );

                if (!response.ok) {
                    if (params.endpoint.name == 'consumer' && params.method == 'DELETE') {
                        console.log('Bug in Kong throws error, Consumer has still been removed will continue'.bold.green);

                        return response;
                    }

                    return response.text()
                        .then(content => {
                            throw new Error(`${response.statusText}\n${content}`);
                        });
                } else {
                    response.text()
                        .then(content => {
                            console.info(`Response status ${response.statusText}:`.green, "\n", JSON.parse(content));
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

function _createWorld({apis, consumers}) {
    const world = {
        hasApi: apiName => Array.isArray(apis) && apis.some(api => api.name === apiName),
        getApi: apiName => {
            const api = apis.find(api => api.name === apiName);

            if (!api) {
                throw new Error(`Unable to find api ${apiName}`);
            }

            return api;
        },
        getPlugin: (apiName, pluginName) => {
            const plugin = world.getApi(apiName).plugins.find(plugin => plugin.name == pluginName);

            if (!plugin) {
                throw new Error(`Unable to find plugin ${pluginName}`);
            }

            return plugin;
        },
        getPluginId: (apiName, pluginName) => {
            return world.getPlugin(apiName, pluginName).id;
        },
        getPluginAttributes: (apiName, pluginName) => {
            return world.getPlugin(apiName, pluginName).config;
        },
        hasPlugin: (apiName, pluginName) => {
            return Array.isArray(apis) && apis.some(api => api.name === apiName && Array.isArray(api.plugins) && api.plugins.some(plugin => plugin.name == pluginName));
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

        isApiUpToDate: (api) => {
            let current = world.getApi(api.name);

            let different = Object.keys(api.attributes).filter(key => {
                return api.attributes[key] !== current[key];
            });

            return different.length == 0;
        },

        isApiPluginUpToDate: (apiName, plugin) => {
            if (false == plugin.hasOwnProperty('attributes')) {
                // of a plugin has no attributes, and its been added then it is up to date
                return true;
            }

            const diff = (a, b) => Object.keys(a).filter(key => {
                return JSON.stringify(a[key]) !== JSON.stringify(b[key]);
            });

            let current = world.getPlugin(apiName, plugin.name);
            let {config, ...rest} = normalizeAttributes(plugin.attributes);

            return diff(config, current.config).length === 0 && diff(rest, current).length === 0;
        },

        isConsumerCredentialUpToDate: (username, credential) => {
            const current = world.getConsumerCredential(username, credential.name, credential.attributes);

            let different = Object.keys(credential.attributes).filter(key => {
                return JSON.stringify(credential.attributes[key]) !== JSON.stringify(current[key]);
            });

            return different.length === 0;
        }
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

    return world => {
        if (api.ensure == 'removed') {
            return world.hasApi(api.name) ? removeApi(api.name) : noop();
        }

        if (world.hasApi(api.name)) {
            if (world.isApiUpToDate(api)) {
                console.log("api", `${api.name}`.bold, "is up-to-date");

                return noop();
            }

            return updateApi(api.name, api.attributes);
        }

        return createApi(api.name, api.attributes);
    };
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
            if (world.hasPlugin(apiName, plugin.name)) {
                return removeApiPlugin(apiName, world.getPluginId(apiName, plugin.name));
            }

            return noop();
        }

        if (world.hasPlugin(apiName, plugin.name)) {
            if (world.isApiPluginUpToDate(apiName, plugin)) {
                console.log("  - plugin", `${plugin.name}`.bold, "is up-to-date".green);

                return noop();
            }

            return updateApiPlugin(apiName, world.getPluginId(apiName, plugin.name), plugin.attributes);
        }

        return addApiPlugin(apiName, plugin.name, plugin.attributes);
    }
}

function _consumer(consumer) {
    validateEnsure(consumer.ensure);
    validateConsumer(consumer);

    return world => {
        if (consumer.ensure == 'removed') {
            if (world.hasConsumer(consumer.username)) {
                return removeConsumer(consumer.username);
            }

            return noop();
        }

        if (!world.hasConsumer(consumer.username)) {
            return createConsumer(consumer.username);
        }

        console.log("consumer", `${consumer.username}`.bold);

        return noop();
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

                return removeConsumerCredentials(username, credential.name, credentialId);
            }

            return noop();
        }

        if (world.hasConsumerCredential(username, credential.name, credential.attributes)) {
            const credentialId = world.getConsumerCredentialId(username, credential.name, credential.attributes);

            if (world.isConsumerCredentialUpToDate(username, credential)) {
                const credentialIdName = getConsumerCredentialSchema(credential.name).id;
                console.log("  - credential", `${credential.name}`.bold, `with ${credentialIdName}:`, `${credential.attributes[credentialIdName]}`.bold, "is up-to-date".green);

                return noop();
            }

            return updateConsumerCredentials(username, credential.name, credentialId, credential.attributes);
        }

        return addConsumerCredentials(username, credential.name, credential.attributes);
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

                return removeConsumerAcls(username, aclId);
            }

            return noop();
        }

        if (world.hasConsumerAcl(username, acl.group)) {
            return noop();
        }

        return addConsumerAcls(username, acl.group);
    }
}

'use strict';

import colors from 'colors';
import createAdminApi from 'adminApi';
import assign from 'object-assign';
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
    removeConsumerCredentials
} from 'actions';

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
    return consumers.reduce((calls, consumer) => [...calls, _consumer(consumer), ..._consumerCredentials(consumer)], []);
}

export function credentials(username, credentials) {
    return credentials.reduce((actions, credential) => [...actions, _consumerCredential(username, credential)], []);
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
        const state = await _getKongState(adminApi);
        return f(_createWorld(state));
    }
}

async function _getKongState({fetchApis, fetchPlugins, fetchConsumers, fetchConsumerCredentials}) {
    const apis = await fetchApis();
    const apisWithPlugins = await Promise.all(apis.map(async item => {
        const plugins =  await fetchPlugins(item.name);

        return {...item, plugins};
    }));

    const consumers = await fetchConsumers();
    const consumersWithCredentials = await Promise.all(consumers.map(async consumer => {
        if (consumer.custom_id && !consumer.username) {
            console.log(`Consumers with only custom_id not supported: ${consumer.custom_id}`);

            return consumer;
        }

        const oauth2 = await fetchConsumerCredentials(consumer.username, 'oauth2');
        const keyAuth = await fetchConsumerCredentials(consumer.username, 'key-auth');
        const jwt = await fetchConsumerCredentials(consumer.username, 'jwt');
        const basicAuth = await fetchConsumerCredentials(consumer.username, 'basic-auth');

        return {...consumer, credentials: {oauth2, keyAuth, jwt, basicAuth}};
    }));

    return {
        apis: apisWithPlugins,
        consumers: consumersWithCredentials
    };
}

function _createWorld({apis, consumers}) {
    return {
        hasApi: apiName => apis.some(api => api.name === apiName),
        getPluginId: (apiName, pluginName) => {
            const api = apis.find(api => api.name === apiName);

            if (!api) {
                throw new Error(`Unable to find api ${apiName}`);
            }

            const plugin = api.plugins.find(plugin => plugin.name == pluginName);

            if (!plugin) {
                throw new Error(`Unable to find plugin ${pluginName}`);
            }

            return plugin.id;
        },
        hasPlugin: (apiName, pluginName) => {
            return apis.some(api => api.name === apiName && api.plugins.some(plugin => plugin.name == pluginName));
        },
        hasConsumer: (username) => {
            return consumers.some(consumer => consumer.username === username);
        },
        hasConsumerCredential: (username, name, attributes) => {
            switch(name) {
                case 'oauth2': {
                    return consumers.some(
                        c => c.username === username
                        && c.credentials.oauth2.some(oa => oa.client_id == attributes.client_id));
                }
                case 'key-auth': {
                    return consumers.some(
                        c => c.username === username
                        && c.credentials.keyAuth.some(k => k.key == attributes.key));
                }
                case 'jwt': {
                    return consumers.some(
                        c => c.username === username
                        && c.credentials.jwt.some(k => k.key == attributes.key));
                }
                case 'basic-auth': {
                    return consumers.some(
                            c => c.username === username &&
                            c.credentials.basicAuth.some(k => k.username == attributes.username)
                    );
                }
            }

            throw new Error(`Unknown credential "${name}"`);
        },
        getConsumerCredentialId: (username, name, attributes) => {
            const consumer = consumers.find(c => c.username === username);

            if (!consumer) {
                throw new Error(`Unable to find consumer ${username}`);
            }

            const credential = extractCredentialId(consumer.credentials, name, attributes);

            if (!credential) {
                throw new Error(`Unable to find credential`);
            }

            return credential.id;
        }
    };
}

function extractCredentialId(credentials, name, attributes) {
    switch (name) {
        case 'oauth2': return credentials.oauth2.find(oa => oa.client_id == attributes.client_id);
        case 'key-auth': return credentials.keyAuth.find(k => k.key == attributes.key);
        case 'jwt': return credentials.jwt.find(k => k.key == attributes.key);
        case 'basic-auth': return credentials.basicAuth.find(k => k.username == attributes.username);
    }

    throw new Error(`Unknown credential "${name}"`);
}

function _api(api) {
    validateEnsure(api.ensure);

    return world => {
        if (api.ensure == 'removed') {
            return world.hasApi(api.name) ? removeApi(api.name) : noop();
        }

        if (world.hasApi(api.name)) {
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

        return noop();
    }

    let _credentials = [];

    if (consumer.credentials && consumer.ensure != 'removed') {
        _credentials = consumerCredentials(consumer.username, consumer.credentials);
    }

    return [consumerAction, ..._credentials];
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

            return updateConsumerCredentials(username, credential.name, credentialId, credential.attributes);
        }

        return addConsumerCredentials(username, credential.name, credential.attributes);
    }
}

import assign from 'object-assign';

export function noop() {
    return {noop: true};
}

export function createApi(name, params) {
    return {
        endpoint: {name: 'apis'},
        method: 'POST',
        body: assign({}, params, {name})
    };
};

export function removeApi(name) {
    return {
        endpoint: {name: 'api', params: {name}},
        method: 'DELETE',
    };
}

export function updateApi(name, params) {
    return {
        endpoint: {name: 'api', params: {name}},
        method: 'PATCH',
        body: params
    };
}

export function addApiPlugin(apiId, pluginName, params) {
    return {
        endpoint: {name: 'api-plugins', params: {apiId, pluginName}},
        method: 'POST',
        body: assign({}, params, {name: pluginName})
    };
}

export function removeApiPlugin(apiId, pluginId) {
    return {
        endpoint: {name: 'api-plugin', params: {apiId, pluginId}},
        method: 'DELETE',
    };
}

export function updateApiPlugin(apiId, pluginId, params) {
    return {
        endpoint: {name: 'api-plugin', params: {apiId, pluginId}},
        method: 'PATCH',
        body: params
    };
}

export function addGlobalPlugin(pluginName, params) {
    return {
        endpoint: {name: 'plugins', params: {pluginName}},
        method: 'POST',
        body: assign({}, params, {name: pluginName})
    };
}

export function removeGlobalPlugin(pluginId) {
    return {
        endpoint: {name: 'plugin', params: {pluginId}},
        method: 'DELETE',
    };
}

export function updateGlobalPlugin(pluginId, params) {
    return {
        endpoint: {name: 'plugin', params: {pluginId}},
        method: 'PATCH',
        body: params
    };
}

export function createConsumer(username, custom_id) {
    return {
        endpoint: { name: 'consumers' },
        method: 'POST',
        body: { username, custom_id }
    };
}

export function updateConsumer(consumerId, params) {
    return {
        endpoint: {name: 'consumer', params: {consumerId}},
        method: 'PATCH',
        body: params
    };
}

export function removeConsumer(consumerId) {
    return {
        endpoint: {name: 'consumer', params: {consumerId}},
        method: 'DELETE'
    };
}

export function addConsumerCredentials(consumerId, plugin, params) {
    return {
        endpoint: {name: 'consumer-credentials', params: {consumerId, plugin}},
        method: 'POST',
        body: params
    };
}

export function updateConsumerCredentials(consumerId, plugin, credentialId, params) {
    return {
        endpoint: {name: 'consumer-credential', params: {consumerId, plugin, credentialId}},
        method: 'PATCH',
        body: params
    };
}

export function removeConsumerCredentials(consumerId, plugin, credentialId) {
    return {
        endpoint: {name: 'consumer-credential', params: {consumerId, plugin, credentialId}},
        method: 'DELETE'
    };
}

export function addConsumerAcls(consumerId, groupName) {
    return {
        endpoint: {name: 'consumer-acls', params: {consumerId}},
        method: 'POST',
        body: {
            group: groupName
        }
    };
}

export function removeConsumerAcls(consumerId, aclId) {
    return {
        endpoint: {name: 'consumer-acl', params: {consumerId, aclId}},
        method: 'DELETE'
    };
}

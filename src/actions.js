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

export function createConsumer(username) {
        return {
        endpoint: { name: 'consumers' },
        method: 'POST',
        body: { username }
    };
}

export function removeConsumer(username) {
    return {
        endpoint: {name: 'consumer', params: {username}},
        method: 'DELETE'
    };
}

export function addConsumerCredentials(username, plugin, params) {
    return {
        endpoint: {name: 'consumer-credentials', params: {username, plugin}},
        method: 'POST',
        body: params
    };
}

export function updateConsumerCredentials(username, plugin, credentialId, params) {
    return {
        endpoint: {name: 'consumer-credential', params: {username, plugin, credentialId}},
        method: 'PATCH',
        body: params
    };
}

export function removeConsumerCredentials(username, plugin, credentialId) {
    return {
        endpoint: {name: 'consumer-credential', params: {username, plugin, credentialId}},
        method: 'DELETE'
    };
}

export function addConsumerAcls(username, groupName) {
    return {
        endpoint: {name: 'consumer-acls', params: {username}},
        method: 'POST',
        body: {
            group: groupName
        }
    };
}

export function removeConsumerAcls(username, aclId) {
    return {
        endpoint: {name: 'consumer-acl', params: {username, aclId}},
        method: 'DELETE'
    };
}

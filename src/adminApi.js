import createRouter from './router';

require('isomorphic-fetch');

let pluginSchemasCache;

export default host => {
    const router = createRouter(host);

    return {
        router,
        fetchApis: () => getJson(router({name: 'apis'})),
        fetchPlugins: apiName => getJson(router({name: 'api-plugins', params: {apiName}})),
        fetchConsumers: () => getJson(router({name: 'consumers'})),
        fetchConsumerCredentials: (username, plugin) => getJson(router({name: 'consumer-credentials', params: {username, plugin}})),

        // this is very chatty call and doesn't change so its cached
        fetchPluginSchemas: () => {
            if (pluginSchemasCache) {
                return Promise.resolve(pluginSchemasCache);
            }

            return getJson(router({name: 'plugins-enabled'}))
                .then(json => Promise.all(json.enabled_plugins.map(plugin => getPluginScheme(plugin, plugin => router({name: 'plugins-scheme', params: {plugin}})))))
                .then(all => pluginSchemasCache = new Map(all));
        },
        requestEndpoint: (endpoint, params) => fetch(router(endpoint), prepareOptions(params))
    }
}

function getPluginScheme(plugin, schemaRoute) {
    return getJson(schemaRoute(plugin))
        .then(({fields}) => [plugin, fields]);
}

function getJson(uri) {
    return fetch(uri, {
        method: 'GET',
        headers: {
            'Connection': 'keep-alive',
            'Accept': 'application/json'
        }
    })
    .then(r => r.json())
    .then(json => {
        if (json.next) {
            throw new Error(`Content overflow on ${uri}, paggination not supported`);
        }

        return json.data ? json.data : json;
    });
}

const prepareOptions = ({method, body}) => {
    if (body) {
        return {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            body: JSON.stringify(body)
        };
    }

    return {
        method: method,
        headers: {
            'Accept': 'application/json',
        }
    };
}

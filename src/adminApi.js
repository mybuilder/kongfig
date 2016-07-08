import createRouter from './router';
import requester from './requester';

let pluginSchemasCache;
let resultsCache = {};

export default ({host, https, ignoreConsumers, cache}) => {
    const router = createRouter(host, https);

    return createApi({
        router,
        ignoreConsumers,
        getJson: cache ? getJsonCache : getJson,
    });
}

function createApi({ router, getJson, ignoreConsumers }) {
    return {
        router,
        fetchApis: () => getJson(router({name: 'apis'})),
        fetchPlugins: apiName => getJson(router({name: 'api-plugins', params: {apiName}})),
        fetchConsumers: () => ignoreConsumers ? Promise.resolve([]) : getJson(router({name: 'consumers'})),
        fetchConsumerCredentials: (username, plugin) => getJson(router({name: 'consumer-credentials', params: {username, plugin}})),
        fetchConsumerAcls: (username) => getJson(router({name: 'consumer-acls', params: {username}})),

        // this is very chatty call and doesn't change so its cached
        fetchPluginSchemas: () => {
            if (pluginSchemasCache) {
                return Promise.resolve(pluginSchemasCache);
            }

            return getJson(router({name: 'plugins-enabled'}))
                .then(json => Promise.all(json.enabled_plugins.map(plugin => getPluginScheme(plugin, plugin => router({name: 'plugins-scheme', params: {plugin}})))))
                .then(all => pluginSchemasCache = new Map(all));
        },
        requestEndpoint: (endpoint, params) => {
            resultsCache = {};
            return requester.request(router(endpoint), prepareOptions(params));
        }
    };
}

function getJsonCache(uri) {
    if (resultsCache.hasOwnProperty(uri)) {
        return resultsCache[uri];
    }

    let result = getJson(uri);
    resultsCache[uri] = result;

    return result;
}

function getPluginScheme(plugin, schemaRoute) {
    return getJson(schemaRoute(plugin))
        .then(({fields}) => [plugin, fields]);
}

function getJson(uri) {
    return requester.get(uri)
    .then(r => r.json())
    .then(json => {
        if (json.next) {
            throw new Error(`Content overflow on ${uri}, pagination not supported`);
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

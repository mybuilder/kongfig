import createRouter from './router';
import requester from './requester';

let pluginSchemasCache;
let resultsCache = {};

export default ({host, https, ignoreConsumers, cache}) => {
    const router = createRouter(host, https);

    return createApi({
        router,
        ignoreConsumers,
        getPaginatedJson: cache ? getPaginatedJsonCache : getPaginatedJson,
    });
}

function createApi({ router, getPaginatedJson, ignoreConsumers }) {
    return {
        router,
        fetchApis: () => getPaginatedJson(router({name: 'apis'})),
        fetchPlugins: apiName => getPaginatedJson(router({name: 'api-plugins', params: {apiName}})),
        fetchConsumers: () => ignoreConsumers ? Promise.resolve([]) : getPaginatedJson(router({name: 'consumers'})),
        fetchConsumerCredentials: (username, plugin) => getPaginatedJson(router({name: 'consumer-credentials', params: {username, plugin}})),
        fetchConsumerAcls: (username) => getPaginatedJson(router({name: 'consumer-acls', params: {username}})),

        // this is very chatty call and doesn't change so its cached
        fetchPluginSchemas: () => {
            if (pluginSchemasCache) {
                return Promise.resolve(pluginSchemasCache);
            }

            return getPaginatedJson(router({name: 'plugins-enabled'}))
                .then(json => Promise.all(json.enabled_plugins.map(plugin => getPluginScheme(plugin, plugin => router({name: 'plugins-scheme', params: {plugin}})))))
                .then(all => pluginSchemasCache = new Map(all));
        },
        requestEndpoint: (endpoint, params) => {
            resultsCache = {};
            return requester.request(router(endpoint), prepareOptions(params));
        }
    };
}

function getPaginatedJsonCache(uri) {
    if (resultsCache.hasOwnProperty(uri)) {
        return resultsCache[uri];
    }

    let result = getPaginatedJson(uri);
    resultsCache[uri] = result;

    return result;
}

function getPluginScheme(plugin, schemaRoute) {
    return getPaginatedJson(schemaRoute(plugin))
        .then(({fields}) => [plugin, fields]);
}

function getPaginatedJson(uri) {
    return requester.get(uri)
    .then(r => r.json())
    .then(json => {
        if (!json.data) return json;
        if (!json.next) return json.data;

        return json.data.concat(getPaginatedJson(json.next));
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

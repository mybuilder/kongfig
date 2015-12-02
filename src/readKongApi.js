import kongState from './kongState';

export default async (adminApi) => {
    return Promise.all([kongState(adminApi), adminApi.fetchPluginSchemas()])
        .then(([state, schemas]) => {
            const prepareConfig = (plugin, config) => stripConfig(config, schemas.get(plugin));
            const parseApiPluginsForSchemes = plugins => parseApiPlugins(plugins, prepareConfig);

            return parseApis(state.apis, parseApiPluginsForSchemes);
        })
};

function parseApis(apis, parseApiPlugins) {
    return apis.map(({
        name, plugins,
        request_host, request_path, strip_request_path, preserve_host, upstream_url,
        id, created_at}) => {
        return {
            name,
            plugins: parseApiPlugins(plugins),
            attributes: {
                request_host,
                request_path,
                strip_request_path,
                preserve_host,
                upstream_url,
            },
            _info: {
                id,
                created_at
            }
        };
    });
}

function parseApiPlugins(plugins, prepareConfig) {
    return plugins.map(({
        name,
        config,
        id, api_id, consumer_id, enabled, created_at
    }) => {
        return {
            name,
            attributes: {
                config: prepareConfig(name, config)
            },
            _info: {
                id,
                //api_id,
                consumer_id,
                enabled,
                created_at
            }
        };
    });
}

function stripConfig(config, schema) {
    const mutableConfig = {...config};

    if (false) {
        // strip default keys
        Object.keys(config).map(key => {
            if (schema[key].hasOwnProperty('default') && schema[key].default === config[key]) {
                delete mutableConfig[key];
            }
        });
    }

    // remove some cache values
    delete mutableConfig['_key_der_cache'];
    delete mutableConfig['_cert_der_cache'];

    return mutableConfig;
}

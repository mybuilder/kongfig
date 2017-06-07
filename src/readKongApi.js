import semVer from 'semver';
import kongState from './kongState';

export default async (adminApi) => {
    return Promise.all([kongState(adminApi), adminApi.fetchPluginSchemas(), adminApi.fetchKongVersion()])
        .then(([state, schemas, version]) => {
            const prepareConfig = (plugin, config) => stripConfig(config, schemas.get(plugin));
            const parseApiPluginsForSchemes = plugins => parseApiPlugins(plugins, prepareConfig);
            const parsePluginsForSchemes = plugins => parseGlobalPlugins(plugins, prepareConfig);

            return {
                apis: parseApis(state.apis, parseApiPluginsForSchemes, version),
                consumers: parseConsumers(state.consumers),
                plugins: parsePluginsForSchemes(state.plugins)
            }
        })
};

function parseConsumers(consumers) {
    return consumers.map(({username, custom_id, credentials, acls, ..._info}) => {
        return {
            username,
            custom_id,
            _info,
            acls: Array.isArray(acls) ? acls.map(({group, ..._info}) => ({group, _info})) : [],
            credentials: zip(Object.keys(credentials), Object.values(credentials))
                .map(parseCredential)
                .reduce((acc, x) => acc.concat(x), [])
        };
    });
}

function zip(a, b) {
    return a.map((n, index) => [n, b[index]]);
}

function parseCredential([credentialName, credentials]) {
    if (!Array.isArray(credentials)) {
      return [];
    }

    return credentials.map(({consumer_id, id, created_at, ...attributes}) => {
        return {
            name: credentialName,
            attributes,
            _info: {id, consumer_id, created_at}
        }
    });
}

function parseApis(apis, parseApiPlugins, kongVersion) {
    if (semVer.gte(kongVersion, '0.10.0')) {
        return parseApisV10(apis, parseApiPlugins);
    }

    return parseApisBeforeV10(apis, parseApiPlugins);
}

function parseApisBeforeV10(apis, parseApiPlugins) {
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

function parseApisV10(apis, parseApiPlugins) {
    return apis.map(({
        name, plugins,
        hosts, uris, methods,
        strip_uri, preserve_host, upstream_url, id, created_at,
        https_only, http_if_terminated,
        retries, upstream_connect_timeout, upstream_read_timeout, upstream_send_timeout}) => {
        return {
            name,
            plugins: parseApiPlugins(plugins),
            attributes: {
                hosts,
                uris,
                methods,
                strip_uri,
                preserve_host,
                upstream_url,
                retries,
                upstream_connect_timeout,
                upstream_read_timeout,
                upstream_send_timeout,
                https_only,
                http_if_terminated
            },
            _info: {
                id,
                created_at
            }
        };
    });
}

function parseApiPlugins(plugins, prepareConfig) {
    if (!Array.isArray(plugins)) {
      return [];
    }

    return plugins.map(({
        name,
        config,
        id, api_id, consumer_id, enabled, created_at
    }) => {
        return {
            name,
            attributes: {
                enabled,
                config: prepareConfig(name, config)
            },
            _info: {
                id,
                //api_id,
                consumer_id,
                created_at
            }
        };
    });
}

function parseGlobalPlugins(plugins, prepareConfig) {
    if (!Array.isArray(plugins)) {
      return [];
    }

    return plugins.map(({
        name,
        enabled,
        config,
        id, api_id, consumer_id, created_at
    }) => {
        return {
            name,
            attributes: {
                enabled,
                config: prepareConfig(name, config)
            },
            _info: {
                id,
                api_id,
                consumer_id,
                created_at
            }
        };
    })
    .filter(x => x.name);
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

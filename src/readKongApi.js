const util = require('util')
import semVer from 'semver';
import kongState from './kongState';

export default async (adminApi) => {
    return Promise.all([kongState(adminApi), adminApi.fetchPluginSchemas(), adminApi.fetchKongVersion()])
        .then(([state, schemas, version]) => {
            return {
                _info: { version },
                apis: parseApis(state.apis, version),
                consumers: parseConsumers(state.consumers),
                plugins: parseGlobalPlugins(state.plugins)
            }
        })
};

export const parseConsumer = ({ username, custom_id, credentials, acls, ..._info }) => {
    return {
        username,
        custom_id,
        _info,
    };
};

export const parseAcl = ({group, ..._info}) => ({group, _info});

function parseConsumers(consumers) {
    return consumers.map(({username, custom_id, credentials, acls, ..._info}) => {
        return {
            ...parseConsumer({ username, custom_id, ..._info}),
            acls: Array.isArray(acls) ? acls.map(parseAcl) : [],
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

function parseApis(apis, kongVersion) {
    if (semVer.gte(kongVersion, '0.10.0')) {
        return parseApisV10(apis);
    }

    return parseApisBeforeV10(apis);
}

const parseApiPreV10 = ({
    name,
    request_host, request_path, strip_request_path, preserve_host, upstream_url,
    id, created_at}) => {
    return {
        name,
        plugins: [],
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
};

export const parseApiPostV10 = ({
    name, plugins,
    hosts, uris, methods,
    strip_uri, preserve_host, upstream_url, id, created_at,
    https_only, http_if_terminated,
    retries, upstream_connect_timeout, upstream_read_timeout, upstream_send_timeout}) => {
    return {
        name,
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
};

const withParseApiPlugins = (parseApi) => api => {
    const { name, ...rest} = parseApi(api);

    return { name, plugins: parseApiPlugins(api.plugins), ...rest };
};

function parseApisBeforeV10(apis) {
    return apis.map(withParseApiPlugins(parseApiPreV10));
}

function parseApisV10(apis) {
    return apis.map(withParseApiPlugins(parseApiPostV10));
}

export const parsePlugin = ({
    name,
    config,
    id, api_id, consumer_id, enabled, created_at
}) => {
    return {
        name,
        attributes: {
            enabled,
            consumer_id,
            config: stripConfig(config)
        },
        _info: {
            id,
            //api_id,
            consumer_id,
            created_at
        }
    };
};

function parseApiPlugins(plugins) {
    if (!Array.isArray(plugins)) {
      return [];
    }

    return plugins.map(parsePlugin);
}

export const parseGlobalPlugin = ({
    name,
    enabled,
    config,
    id, api_id, consumer_id, created_at
}) => {
    return {
        name,
        attributes: {
            enabled,
            consumer_id,
            config: stripConfig(config)
        },
        _info: {
            id,
            api_id,
            consumer_id,
            created_at
        }
    };
};

function parseGlobalPlugins(plugins) {
    if (!Array.isArray(plugins)) {
      return [];
    }

    return plugins
        .map(parseGlobalPlugin)
        .filter(x => x.name);
}

function stripConfig(config) {
    const mutableConfig = {...config};

    // remove some cache values
    delete mutableConfig['_key_der_cache'];
    delete mutableConfig['_cert_der_cache'];

    return mutableConfig;
}

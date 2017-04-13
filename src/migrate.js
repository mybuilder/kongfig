import semVer from 'semver';

const DEFINITION_V1 = 'v1';
const DEFINITION_V2 = 'v2';

const _removeUndefined = x => JSON.parse(JSON.stringify(x));

const _guessDefinitionVersion = (api) => {
    if (['hosts', 'uris', 'methods'].filter(x => api.attributes.hasOwnProperty(x)).length > 0) {
        return DEFINITION_V2;
    }

    return DEFINITION_V1;
};

const _migrateV1toV2 = (api) => {
    const {
        request_host,
        request_path,
        strip_request_path,
        ...oldAttributes,
    } = api.attributes;

    const newAttributes = {
        hosts: api.attributes.request_host ? [api.attributes.request_host] : undefined,
        uris: api.attributes.request_path ? [api.attributes.request_path] : undefined,
        strip_uri: api.attributes.strip_request_path,
    };

    return _removeUndefined({ ...api, attributes: { ...oldAttributes, ...newAttributes }});
};

const _migrateApiDefinitionToVersion = (api, kongVersion) => {
    switch (_guessDefinitionVersion(api)) {
    case DEFINITION_V1:
        if (semVer.gte(kongVersion, '0.10.0')) {
            return _migrateV1toV2(api);
        }

        return api;
    default:
        return api;
    }
}

export const migrateApiDefinition = (api, fn) => world => fn(_migrateApiDefinitionToVersion(api, world.getVersion()), world);

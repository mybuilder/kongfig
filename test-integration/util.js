import adminApi from '../src/adminApi';
import readKongApi from '../src/readKongApi';
import execute from '../src/core';

if (typeof process.env.TEST_INTEGRATION_KONG_HOST == 'undefined') {
    throw Error('Please set TEST_INTEGRATION_KONG_HOST env variable');
}

export const testAdminApi = adminApi({
    host: process.env.TEST_INTEGRATION_KONG_HOST,
    https: false,
    ignoreConsumers: false,
    cache: false,
});

const _ignoreKeys = (obj, keys) => {
    if (obj instanceof Array) {
        obj.forEach(function(item) {
            _ignoreKeys(item, keys)
        });
    } else if (typeof obj === 'object') {
        Object.getOwnPropertyNames(obj).forEach((key) => {
            if (keys.indexOf(key) !== -1) {
                obj[key] = '___IGNORED___';
            } else {
                _ignoreKeys(obj[key], keys);
            }
        });
    }

    return obj;
};

export const ignoreKeys = (message, keys) => _ignoreKeys(JSON.parse(JSON.stringify(message)), keys);

export const cleanupKong = async () => {
    console.log("\n\n--- Cleanup \n\n".bold);
    const results = await readKongApi(testAdminApi);
    await execute({
        apis: results.apis.map(api => ({ ...api, ensure: 'removed' })),
        consumers: results.consumers.map(consumer => ({ ...consumer, ensure: 'removed' })),
        plugins: results.plugins.map(plugin => ({ ...plugin, ensure: 'removed' })),
    }, testAdminApi);

    console.log("\n\n--- Cleanup END \n\n".bold);
};

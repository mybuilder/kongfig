import adminApi from '../lib/adminApi';
import readKongApi from '../lib/readKongApi';
import execute from '../lib/core';
import { logReducer } from '../lib/kongStateLocal';
import getCurrentStateSelector from '../lib/stateSelector';
import invariant from 'invariant';
import pad from 'pad';
import { pretty } from '../lib/prettyConfig';

invariant(process.env.TEST_INTEGRATION_KONG_HOST, `
    Please set ${'TEST_INTEGRATION_KONG_HOST'.bold} env variable

    TEST_INTEGRATION_KONG_HOST=localhost:8001 yarn test

    ${'WARNING! Running integration tests are going to remove all data from the kong'.red.bold}.
`);

const UUIDRegex = /[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/g;
let uuids = {};
let log = [];
let rawLog = [];

export const exportToYaml = pretty('yaml');
export const getLocalState = () => getCurrentStateSelector(rawLog.reduce(logReducer, undefined));

export const testAdminApi = adminApi({
    host: process.env.TEST_INTEGRATION_KONG_HOST,
    https: false,
    ignoreConsumers: false,
    cache: false,
    concurrency: 8,
});

export const getLog = () => log;
export const logger = message => {
    if (message.type === 'experimental-features') {
        // cannot include these in tests because they change based on test matrix
        return;
    }

    const m = cloneObject(message);

    if (m.hasOwnProperty('uri')) {
        m.uri = m.uri.replace(process.env.TEST_INTEGRATION_KONG_HOST, 'localhost:8001');
    }

    rawLog.push(m);
    log.push(ignoreKeys(m, ['created_at', 'version', 'orderlist']));
};

const _ignoreKeys = (obj, keys) => {
    if (Array.isArray(obj)) {
        return obj;
    }

    if (typeof obj !== 'object') {
        return obj;
    }

    return Object.keys(obj).reduce((x, key) => {
        if (typeof obj[key] === 'string' && obj[key].match(UUIDRegex)) {
            const value = obj[key].match(UUIDRegex).reduce((value, uuid) => {
                if (!uuids.hasOwnProperty(uuid)) {
                    const id = pad(12, `${Object.keys(uuids).length + 1}`, '0');
                    uuids[uuid] = `2b47ba9b-761a-492d-9a0c-${id}`;
                }

                return value.replace(uuid, uuids[uuid]);
            }, obj[key]);

            return { ...x, [key]: value };
        } else if (keys.indexOf(key) !== -1) {
            return { ...x, [key]: `___${key}___` };
        }

        return { ...x, [key]: _ignoreKeys(obj[key], keys) };
    }, {});
};

const cloneObject = obj => JSON.parse(JSON.stringify(obj));

export const ignoreKeys = (message, keys) => _ignoreKeys(cloneObject(message), keys);

const cleanupKong = async () => {
    const results = await readKongApi(testAdminApi);
    await execute({
        apis: results.apis.map(api => ({ ...api, ensure: 'removed' })),
        consumers: results.consumers.map(consumer => ({ ...consumer, ensure: 'removed' })),
        plugins: results.plugins.map(plugin => ({ ...plugin, ensure: 'removed' })),
        upstreams: results.upstreams.map(upstream => ({ ...upstream, ensure: 'removed' })),
        certificates: results.certificates.map(certificate => ({ ...certificate, ensure: 'removed' })),
    }, testAdminApi);
};

export const tearDown = async () => {
    uuids = {};
    log = [];
    rawLog = [];
    await cleanupKong();
};

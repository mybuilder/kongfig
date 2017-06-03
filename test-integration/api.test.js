import execute from '../src/core';
import { testAdminApi, ignoreKeys, cleanupKong } from './util';
import readKongApi from '../src/readKongApi';

let log = [];
const logger = message => {
    log.push(ignoreKeys(message, ['apiId', 'id', 'api_id', 'created_at']));
};

beforeAll(async () => {
    await cleanupKong();
});

afterEach(async () => {
    log = [];
    await cleanupKong();
});

describe("API", () => {
    it("should add an API", async () => {
        const config = {
            apis: [{
                name: "mockbin",
                ensure: "present",
                attributes: {
                    upstream_url: "http://mockbin.com",
                    hosts: ["mockbin.com"]
                }
            }]
        };

        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(log).toMatchSnapshot();
        expect(ignoreKeys(kongState, ['created_at', 'id'])).toMatchSnapshot();
    });

    it("should add an API with a plugins", async () => {
        const config = {
            apis: [{
                name: "mockbin",
                ensure: "present",
                attributes: {
                    upstream_url: "http://mockbin.com",
                    hosts: ["mockbin.com"]
                },
                plugins: [{
                    name: "key-auth"
                }, {
                    name: "cors",
                    attributes: {
                        config: {
                            credentials: false,
                            preflight_continue: false,
                            max_age: 7000
                        }
                    }
                }]
            }]
        };

        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(log).toMatchSnapshot();
        expect(ignoreKeys(kongState, ['created_at', 'id'])).toMatchSnapshot();
    });
});

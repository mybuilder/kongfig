import execute from '../lib/core';
import { testAdminApi, logger, ignoreKeys, getLog, tearDown } from './util';
import readKongApi from '../lib/readKongApi';

beforeEach(tearDown);

describe("API", () => {
    it("should add the API", async () => {
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

        expect(getLog()).toMatchSnapshot();
        expect(ignoreKeys(kongState, ['created_at'])).toMatchSnapshot();
    });

    it("should not update if already up to date", async () => {
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
        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(ignoreKeys(kongState, ['created_at'])).toMatchSnapshot();
    });

    it("should remove the api", async () => {
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

        config.apis[0].ensure = 'removed';

        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(ignoreKeys(kongState, ['created_at', 'id'])).toMatchSnapshot();
    });

    it("should add mockbin API with a plugins", async () => {
        const config = {
            apis: [{
                name: "mockbin",
                ensure: "present",
                attributes: {
                    upstream_url: "http://mockbin.com",
                    hosts: ["mockbin.com"]
                },
                plugins: [{
                    name: "key-auth",
                    attributes: {
                        config: {
                            key_names: ['foobar']
                        }
                    }
                }]
            }]
        };

        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(ignoreKeys(kongState, ['created_at', 'id'])).toMatchSnapshot();
    });
});

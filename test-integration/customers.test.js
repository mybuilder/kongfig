import execute from '../lib/core';
import { testAdminApi, logger, exportToYaml, getLog, getLocalState, tearDown } from './util';
import readKongApi from '../lib/readKongApi';

beforeEach(tearDown);

describe("Integration consumers", () => {
    it("should add the consumer", async () => {
        const config = {
            consumers: [{
                username: "iphone-app",
                ensure: "present",
            }]
        };

        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should update the consumer", async () => {
        const config = {
            consumers: [{
                username: "iphone-app",
                ensure: "present",
            }]
        };

        await execute(config, testAdminApi, logger);

        config.consumers[0].custom_id = 'foobar123';
        await execute(config, testAdminApi, logger);

        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should remove the consumer", async () => {
        const config = {
            consumers: [{
                username: "iphone-app",
                ensure: "present",
            }]
        };

        await execute(config, testAdminApi, logger);

        config.consumers[0].ensure = 'removed';
        await execute(config, testAdminApi, logger);

        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });
});

describe('Integration consumers credentials', () => {
    it("should add the credential", async () => {
        const config = {
            consumers: [{
                username: "iphone-app",
                ensure: "present",
                credentials: [{
                    name: "key-auth",
                    ensure: "present",
                    attributes: {
                        key: "very-secret-key"
                    }
                }]
            }]
        };

        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should update the credential", async () => {
        const config = {
            consumers: [{
                username: "iphone-app",
                ensure: "present",
                credentials: [{
                    name: "hmac-auth",
                    ensure: "present",
                    attributes: {
                        username: "my-user",
                        secret: "the secrent"
                    }
                }]
            }]
        };

        await execute(config, testAdminApi, logger);

        config.consumers[0].credentials[0].attributes.secret = 'changed-pass';

        await execute(config, testAdminApi, logger);

        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should remove the credential", async () => {
        const config = {
            consumers: [{
                username: "iphone-app",
                ensure: "present",
                credentials: [{
                    name: "key-auth",
                    ensure: "present",
                    attributes: {
                        key: "very-secret-key"
                    }
                }]
            }]
        };

        await execute(config, testAdminApi, logger);

        config.consumers[0].credentials[0].ensure = 'removed';
        await execute(config, testAdminApi, logger);

        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });
});

describe('Integration consumers acls', () => {
    it("should add the acl", async () => {
        const config = {
            consumers: [{
                username: "iphone-app",
                ensure: "present",
                acls: [{
                    group: "foobar",
                    ensure: "present",
                }]
            }]
        };

        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should remove the acl", async () => {
        const config = {
            consumers: [{
                username: "iphone-app",
                ensure: "present",
                acls: [{
                    group: "foobar",
                    ensure: "present",
                }]
            }]
        };

        await execute(config, testAdminApi, logger);

        config.consumers[0].acls[0].ensure = 'removed';
        await execute(config, testAdminApi, logger);

        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });
});

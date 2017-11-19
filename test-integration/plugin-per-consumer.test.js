import execute from '../lib/core';
import { testAdminApi, logger, exportToYaml, getLog, getLocalState, tearDown } from './util';
import readKongApi from '../lib/readKongApi';

beforeEach(tearDown);

const ignoreConfigOrder = state => ({
    ...state,
    consumers: state.consumers.sort((a, b) => a.username > b.username ? 1 : -1),
    plugins: state.plugins.sort((a, b) => a.attributes.config.minute - b.attributes.config.minute),
});

describe("per user api plugins by username", () => {
    it("should add an api rate limiting plugin for a user", async () => {
        const config = {
            consumers: [{
                username: "user-limited",
                ensure: "present",
            }],

            apis: [{
                name: "mockbin",
                ensure: "present",
                attributes: {
                    upstream_url: "http://mockbin.com",
                    hosts: ["mockbin.com"]
                },
                plugins: [{
                    name: "rate-limiting",
                    attributes: {
                        username: "user-limited",
                        config: {
                            minute: 1,
                        }
                    }
                }]
            }]
        };

        await execute(config, testAdminApi, logger);

        const kongState = ignoreConfigOrder(await readKongApi(testAdminApi));

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(ignoreConfigOrder(getLocalState())).toEqual(kongState);
    });
});

describe("per user global plugins by username", () => {
    it("should add global rate limiting plugin for a user", async () => {
        const config = {
            consumers: [{
                username: "user-limited",
                ensure: "present",
            }],
            plugins: [{
                name: "rate-limiting",
                attributes: {
                    username: "user-limited",
                    config: {
                        minute: 1,
                    }
                }
            }]
        };

        await execute(config, testAdminApi, logger);

        const kongState = ignoreConfigOrder(await readKongApi(testAdminApi));

        expect(kongState.consumers[0].username).toEqual('user-limited');
        expect(kongState.plugins[0]._info.consumer_id).toEqual(kongState.consumers[0]._info.id);
        expect(kongState.plugins[0].attributes.username).toEqual(kongState.consumers[0].username);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(ignoreConfigOrder(getLocalState())).toEqual(kongState);
    });

    it("should add global rate limiting plugin for multiple users", async () => {
        const config = {
            consumers: [{
                username: "user-limited",
                ensure: "present",
            }, {
                username: "user-limited-another",
                ensure: "present",
            }],
            plugins: [{
                name: "rate-limiting",
                attributes: {
                    username: "user-limited",
                    config: {
                        minute: 1,
                    }
                }
            }, {
                name: "rate-limiting",
                attributes: {
                    username: "user-limited-another",
                    config: {
                        minute: 10,
                    }
                }
            }]
        };

        await execute(config, testAdminApi, logger);

        const kongState = ignoreConfigOrder(await readKongApi(testAdminApi));

        expect(kongState.consumers[0].username).toEqual('user-limited');
        expect(kongState.plugins[0]._info.consumer_id).toEqual(kongState.consumers[0]._info.id);
        expect(kongState.plugins[0].attributes.username).toEqual(kongState.consumers[0].username);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(ignoreConfigOrder(getLocalState())).toEqual(kongState);
    });

    it("should remove global rate limiting plugin for the user", async () => {
        const config = {
            consumers: [{
                username: "user-limited",
                ensure: "present",
            }, {
                username: "user-limited-another",
                ensure: "present",
            }],
            plugins: [{
                name: "rate-limiting",
                attributes: {
                    username: "user-limited",
                    config: {
                        minute: 1,
                    }
                }
            }, {
                name: "rate-limiting",
                attributes: {
                    username: "user-limited-another",
                    config: {
                        minute: 10,
                    }
                }
            }]
        };

        await execute(config, testAdminApi, logger);

        config.consumers[0].ensure = 'removed';
        config.plugins[0].ensure = 'removed';

        await execute(config, testAdminApi, logger);

        const kongState = ignoreConfigOrder(await readKongApi(testAdminApi));

        expect(kongState.consumers[0].username).toEqual('user-limited-another');
        expect(kongState.plugins[0].attributes.username).toEqual('user-limited-another');
        expect(kongState.plugins[0]._info.consumer_id).toEqual(kongState.consumers[0]._info.id);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(ignoreConfigOrder(getLocalState())).toEqual(kongState);
    });

    it("should update global rate limiting plugin for the user", async () => {
        const config = {
            consumers: [{
                username: "user-limited",
                ensure: "present",
            }, {
                username: "user-limited-another",
                ensure: "present",
            }],
            plugins: [{
                name: "rate-limiting",
                attributes: {
                    username: "user-limited",
                    config: {
                        minute: 1,
                    }
                }
            }, {
                name: "rate-limiting",
                attributes: {
                    username: "user-limited-another",
                    config: {
                        minute: 10,
                    }
                }
            }]
        };

        await execute(config, testAdminApi, logger);

        config.plugins[1].attributes.config.minute = 20;

        await execute(config, testAdminApi, logger);

        const kongState = ignoreConfigOrder(await readKongApi(testAdminApi));

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(ignoreConfigOrder(getLocalState())).toEqual(kongState);
    });
});

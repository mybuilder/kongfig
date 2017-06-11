import execute from '../lib/core';
import { testAdminApi, logger, exportToYaml, getLog, getLocalState, tearDown } from './util';
import readKongApi from '../lib/readKongApi';

beforeEach(tearDown);

describe("Integration global plugin", () => {
    it("should add the plugin", async () => {
        const config = {
            plugins: [{
                name: "cors",
                attributes: {
                    config: {
                        credentials: false,
                        preflight_continue: false,
                        max_age: 7000
                    }
                }
            }]
        };

        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should update the global plugin", async () => {
        const config = {
            plugins: [{
                name: "cors",
                attributes: {
                    config: {
                        credentials: false,
                        preflight_continue: false,
                        max_age: 7000
                    }
                }
            }]
        };

        await execute(config, testAdminApi, logger);

        config.plugins[0].attributes.enabled = false;

        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should not update if already up to date", async () => {
        const config = {
            plugins: [{
                name: "cors",
                attributes: {
                    config: {
                        credentials: false,
                        preflight_continue: false,
                        max_age: 7000
                    }
                }
            }]
        };

        await execute(config, testAdminApi, logger);
        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should remove the global plugin", async () => {
        const config = {
            plugins: [{
                name: "cors",
                attributes: {
                    config: {
                        credentials: false,
                        preflight_continue: false,
                        max_age: 7000
                    }
                }
            }]
        };

        await execute(config, testAdminApi, logger);

        config.plugins[0].ensure = 'removed';

        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });
});

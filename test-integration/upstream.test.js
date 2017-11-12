import execute from '../lib/core';
import { testAdminApi, logger, exportToYaml, getLog, getLocalState, tearDown } from './util';
import readKongApi from '../lib/readKongApi';

beforeEach(tearDown);

describe("Upstream", () => {
    const config = {};

    beforeEach(() => {
        config.upstreams = [{
            name: "mockbinUpstream",
            ensure: "present",
            attributes: {
                slots: 10
            }
        }];
    });

    it("should add the upstream", async () => {
        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should not update if already up to date", async () => {
        await execute(config, testAdminApi, logger);
        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should remove the upstream", async () => {
        config.upstreams[0].ensure = "removed";
        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should update the upstream", async () => {
        await execute(config, testAdminApi, logger);

        config.upstreams[0].attributes.slots = 20;

        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });
});

describe("Upstream Targets", () => {
    let config = {};
    let upstream, target1;

    beforeEach(() => {
        config.upstreams = [{
            name: "mockbinUpstream",
            ensure: "present",
            attributes: {
                slots: 10
            },
            targets: [{
                ensure: "present",
                target: "server1.mockbin:8080",
                attributes: {
                    weight: 50
                }
            }]
        }];

        upstream = config.upstreams[0];
        target1 = upstream.targets[0];
    });

    it("should add mockbin upstream with target", async () => {
        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should remove target from mockbin upstream", async () => {
        await execute(config, testAdminApi, logger);

        target1.ensure = 'removed';

        await execute(config, testAdminApi, logger);

        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should update mockbin upstream target", async () => {
        await execute(config, testAdminApi, logger);

        let weight = target1.attributes.weight;
        target1.attributes.weight = weight * 2;

        await execute(config, testAdminApi, logger);

        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    })
});

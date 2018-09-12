import execute from '../lib/core';
import { testAdminApi, logger, exportToYaml, getLog, getLocalState, tearDown } from './util';
import readKongApi from '../lib/readKongApi';

describe("Service", () => {
    beforeEach(tearDown);

    it("should add the Service", async () => {
        const config = {
            services: [{
                name: "mockbin",
                ensure: "present",
                attributes: {
                    url: "http://mockbin.com/test"
                }
            }]
        };
        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should not update if already up to date", async () => {
        const config = {
            services: [{
                name: "mockbin",
                ensure: "present",
                attributes: {
                    url: "http://mockbin.com/test"
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

    it("should remove the service", async () => {
        const config = {
            services: [{
                name: "mockbin",
                ensure: "present",
                attributes: {
                    url: "http://mockbin.com/test"
                }
            }]
        };

        await execute(config, testAdminApi, logger);

        config.services[0].ensure = 'removed';

        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should update the service", async () => {
        const config = {
            services: [{
                name: "mockbin",
                ensure: "present",
                attributes: {
                    url: "http://mockbin.com/test"
                }
            }]
        };

        await execute(config, testAdminApi, logger);

        config.services[0].attributes.protocol = true;

        await execute(config, testAdminApi, logger);
        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });
});

describe("Service plugins", () => {
    beforeEach(tearDown);

    it("should add mockbin service with a plugins", async () => {
        const config = {
            services: [{
                name: "mockbin",
                ensure: "present",
                attributes: {
                    url: "http://mockbin.com/test"
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
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should remove mockbin service plugin", async () => {
        const config = {
            services: [{
                name: "mockbin",
                ensure: "present",
                attributes: {
                    url: "http://mockbin.com/test"
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

        config.services[0].plugins[0].ensure = 'removed';

        await execute(config, testAdminApi, logger);

        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should update mockbin service plugin", async () => {
        const config = {
            services: [{
                name: "mockbin",
                ensure: "present",
                attributes: {
                    url: "http://mockbin.com/test"
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

        config.services[0].plugins[0].attributes.enabled = false;

        await execute(config, testAdminApi, logger);

        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

});
describe("Service routes", () => {
    beforeEach(tearDown);

    it("should add mockbin service with a route", async () => {
        const config = {
            services: [{
                name: "mockbin",
                ensure: "present",
                attributes: {
                    url: "http://mockbin.com/test"
                },
                routes: [{
                    name: "r1",
                    attributes: {
                        hosts: ["foo.com"],
                        paths: [],
                        methods: []
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

    it("should remove mockbin service route", async () => {
        const config = {
            services: [{
                name: "mockbin",
                ensure: "present",
                attributes: {
                    url: "http://mockbin.com/test"
                },
                routes: [{
                    name: "r1",
                    attributes: {
                        hosts: ["foo.com"],
                        paths: [],
                        methods: []
                    }
                }]
            }]
        };

        await execute(config, testAdminApi, logger);

        config.services[0].routes[0].ensure = 'removed';

        await execute(config, testAdminApi, logger);

        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

    it("should update mockbin service route", async () => {
        const config = {
            services: [{
                name: "mockbin",
                ensure: "present",
                attributes: {
                    url: "http://mockbin.com/test"
                },
                routes: [{
                    name: "r1",
                    attributes: {
                        hosts: ["foo.com"],
                        paths: [],
                        methods: []
                    }
                }]
            }]
        };

        await execute(config, testAdminApi, logger);

        config.services[0].routes[0].attributes.paths = ['/api'];

        await execute(config, testAdminApi, logger);

        const kongState = await readKongApi(testAdminApi);

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(getLocalState()).toEqual(kongState);
    });

});

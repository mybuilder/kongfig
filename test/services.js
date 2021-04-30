import expect from 'expect.js';
import {services, servicePlugins, routes} from '../src/core.js';
import {
    noop,
    createService,
    removeService,
    updateService,
    addServicePlugin,
    removeServicePlugin,
    updateServicePlugin,
    addRoute,
    removeRoute,
    updateRoute
} from '../src/actions.js';

describe("services", () => {
    it("should add new service", () => {
        var actual = services([{
            "ensure": "present",
            "name": "leads",
            "attributes": {
                "url": "bar"
            }
        }])
        .map(x => x({hasService: () => false, getVersion: () => '0.14.0'}));

        expect(actual).to.be.eql([
            createService('leads', {url: "bar"})
        ]);
    });

    it("should remove service", () => {
        var actual = services([{
            "name": "leads",
            "ensure": "removed",
            "attributes": {
                "url": "bar"
            }
        }])
        .map(x => x({hasService: () => true, getVersion: () => '0.14.0'}));

        expect(actual).to.be.eql([
            removeService('leads')
        ]);
    });

    it("should do no op if api is already removed", () => {
        const service = {
            "name": "leads",
            "ensure": "removed",
            "attributes": {
                "url": "bar"
            }
        };
        var actual = services([service])
        .map(x => x({hasService: () => false, getVersion: () => '0.14.0'}));

        expect(actual).to.be.eql([
            noop({ type: 'noop-service', service })
        ]);
    });

    it("should update service", () => {
        var actual = services([{
            "ensure": "present",
            "name": "leads",
            "attributes": {
                "url": "bar"
            }
        }])
        .map(x => x({hasService: () => true, isServiceUpToDate: () => false, getVersion: () => '0.14.0'}));

        expect(actual).to.be.eql([
            updateService('leads', {url: "bar"})
        ]);
    });

    it("should validate ensure enum", () => {
        expect(() => services([{
            "ensure": "not-valid",
            "name": "leads"
        }])).to.throwException(/Invalid ensure/);
    });

    it('should add service with plugins', () => {
        var actual = services([{
            "ensure": "present",
            "name": "leads",
            "attributes": {
                "url": "bar"
            },
            'plugins': [{
                "name": 'cors',
                "ensure": "present",
                'attributes': {
                    'config.foo': "bar"
                }
            }]
        }]).map(x => x({
            hasService: () => false,
            hasServicePlugin: () => false,
            getServiceId: () => 'abcd-1234',
            getVersion: () => '0.14.0'
        }));

        expect(actual).to.be.eql([
            createService('leads', {url: "bar"}),
            addServicePlugin('abcd-1234', 'cors', {'config.foo': "bar"})
        ]);
    });

    it('should add service with route', () => {
        var actual = services([{
            "ensure": "present",
            "name": "leads",
            "attributes": {
                "url": "bar"
            },
            'routes': [{
                "ensure": "present",
                "name": "main",
                'attributes': {
                    'hosts': ["bar"]
                }
            }]
        }]).map(x => x({
            hasService: () => false,
            hasRoute: () => false,
            getServiceId: () => 'abcd-1234',
            getRouteId: () => 'abcd-1234',
            getVersion: () => '0.14.0'
        }));

        expect(actual).to.be.eql([
            createService('leads', {url: "bar"}),
            addRoute('abcd-1234', "abcd-1234", {'hosts': ["bar"]})
        ]);
    });

    describe("servicePlugins", () => {
        it("should add a plugin to a service", () => {
            var actual = servicePlugins(
                'leads', [{
                    "name": "cors",
                    'attributes': {
                        "config.foo": 'bar'
                    }}]
            ).map(x => x({hasServicePlugin: () => false, getServiceId: () => 'abcd-1234'}));

            expect(actual).to.be.eql([
                addServicePlugin('abcd-1234', 'cors', {"config.foo": 'bar'})
            ]);
        });

        it("should remove service plugin", () => {
            var actual = servicePlugins(
                'leads', [{
                    "name": "cors",
                    "ensure": "removed"}]
            ).map(x => x({
                hasServicePlugin: () => true,
                getServicePluginId: () => 123,
                getServiceId: () => 'abcd-1234',
            }));

            expect(actual).to.be.eql([
                removeServicePlugin('abcd-1234', 123)
            ]);
        });

        it('should update service plugin', () => {
            var actual = servicePlugins(
                'leads', [{
                    'name': 'cors',
                    'attributes': {
                        'config.foo': 'bar'
                    }}]
            ).map(x => x({
                hasServicePlugin: () => true,
                getServicePluginId: () => 123,
                getServiceId: () => 'abcd-1234',
                isServicePluginUpToDate: () => false
            }));

            expect(actual).to.be.eql([
                updateServicePlugin('abcd-1234', 123, {'config.foo': 'bar'})
            ])
        });

        it("should validate ensure enum", () => {
            expect(() => servicePlugins("leads", [{
                "ensure": "not-valid",
                "name": "leads"
            }])).to.throwException(/Invalid ensure/);
        });
    });
    describe("routes", () => {
        it("should add a route to a service", () => {
            var actual = routes(
                'leads', [{
                    "name": "main",
                    'attributes': {
                        "hosts": ['bar']
                    }}]
            ).map(x => x({hasRoute: () => false, getServiceId: () => 'abcd-1234', getRouteId: () => 'abcd-1234'}));

            expect(actual).to.be.eql([
                addRoute('abcd-1234', "abcd-1234", {"hosts": ['bar']})
            ]);
        });

        it("should remove route", () => {
            var actual = routes(
                'leads', [{
                    "name": "main",
                    "ensure": "removed"}]
            ).map(x => x({
                hasRoute: () => true,
                getRouteId: () => 123,
                getServiceId: () => 'abcd-1234',
            }));

            expect(actual).to.be.eql([
                removeRoute('abcd-1234', 123)
            ]);
        });

        it('should update route', () => {
            var actual = routes(
                'leads', [{
                    'name': 'main',
                    'attributes': {
                        "hosts": ['bar']
                    }}]
            ).map(x => x({
                hasRoute: () => true,
                getRouteId: () => 123,
                getServiceId: () => 'abcd-1234',
                isRouteUpToDate: () => false
            }));

            expect(actual).to.be.eql([
                updateRoute('abcd-1234', 123, {"hosts": ['bar']})
            ])
        });

        it("should validate ensure enum", () => {
            expect(() => routes("leads", [{
                "ensure": "not-valid",
            }])).to.throwException(/Invalid ensure/);
        });
    });
});

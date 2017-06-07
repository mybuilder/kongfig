import expect from 'expect.js';
import {apis, plugins} from '../src/core.js';
import {
    noop,
    createApi,
    removeApi,
    updateApi,
    addApiPlugin,
    removeApiPlugin,
    updateApiPlugin
} from '../src/actions.js';

describe("apis", () => {
    it("should add new api", () => {
        var actual = apis([{
            "ensure": "present",
            "name": "leads",
            "attributes": {
                "upstream_url": "bar"
            }
        }])
        .map(x => x({hasApi: () => false, getVersion: () => '0.10.0'}));

        expect(actual).to.be.eql([
            createApi('leads', {upstream_url: "bar"})
        ]);
    });

    it("should remove api", () => {
        var actual = apis([{
            "name": "leads",
            "ensure": "removed",
            "attributes": {
                "upstream_url": "bar"
            }
        }])
        .map(x => x({hasApi: () => true, getVersion: () => '0.10.0'}));

        expect(actual).to.be.eql([
            removeApi('leads')
        ]);
    });

    it("should do no op if api is already removed", () => {
        const api = {
            "name": "leads",
            "ensure": "removed",
            "attributes": {
                "upstream_url": "bar"
            }
        };
        var actual = apis([api])
        .map(x => x({hasApi: () => false, getVersion: () => '0.10.0'}));

        expect(actual).to.be.eql([
            noop({ type: 'noop-api', api })
        ]);
    });

    it("should update api", () => {
        var actual = apis([{
            "ensure": "present",
            "name": "leads",
            "attributes": {
                "upstream_url": "bar"
            }
        }])
        .map(x => x({hasApi: () => true, isApiUpToDate: () => false, getVersion: () => '0.10.0'}));

        expect(actual).to.be.eql([
            updateApi('leads', {upstream_url: "bar"})
        ]);
    });

    it("should validate ensure enum", () => {
        expect(() => apis([{
            "ensure": "not-valid",
            "name": "leads"
        }])).to.throwException(/Invalid ensure/);
    });

    it('should add api with plugins', () => {
        var actual = apis([{
            "ensure": "present",
            "name": "leads",
            "attributes": {
                "upstream_url": "bar"
            },
            'plugins': [{
                "name": 'cors',
                "ensure": "present",
                'attributes': {
                    'config.foo': "bar"
                }
            }]
        }]).map(x => x({
            hasApi: () => false,
            hasPlugin: () => false,
            getApiId: () => 'abcd-1234',
            getVersion: () => '0.10.0'
        }));

        expect(actual).to.be.eql([
            createApi('leads', {upstream_url: "bar"}),
            addApiPlugin('abcd-1234', 'cors', {'config.foo': "bar"})
        ]);
    });

    describe("plugins", () => {
        it("should add a plugin to an api", () => {
            var actual = plugins(
                'leads', [{
                    "name": "cors",
                    'attributes': {
                        "config.foo": 'bar'
                    }}]
            ).map(x => x({hasPlugin: () => false, getApiId: () => 'abcd-1234'}));

            expect(actual).to.be.eql([
                addApiPlugin('abcd-1234', 'cors', {"config.foo": 'bar'})
            ]);
        });

        it("should remove api plugin", () => {
            var actual = plugins(
                'leads', [{
                    "name": "cors",
                    "ensure": "removed"}]
            ).map(x => x({
                hasPlugin: () => true,
                getPluginId: () => 123,
                getApiId: () => 'abcd-1234',
            }));

            expect(actual).to.be.eql([
                removeApiPlugin('abcd-1234', 123)
            ]);
        });

        it('should update api plugin', () => {
            var actual = plugins(
                'leads', [{
                    'name': 'cors',
                    'attributes': {
                        'config.foo': 'bar'
                    }}]
            ).map(x => x({
                hasPlugin: () => true,
                getPluginId: () => 123,
                getApiId: () => 'abcd-1234',
                isApiPluginUpToDate: () => false
            }));

            expect(actual).to.be.eql([
                updateApiPlugin('abcd-1234', 123, {'config.foo': 'bar'})
            ])
        });

        it("should validate ensure enum", () => {
            expect(() => plugins("leads", [{
                "ensure": "not-valid",
                "name": "leads"
            }])).to.throwException(/Invalid ensure/);
        });
    });
});

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
                "foo": "bar"
            }
        }])
        .map(x => x({hasApi: () => false}));

        expect(actual).to.be.eql([
            createApi('leads', {foo: "bar"})
        ]);
    });

    it("should remove api", () => {
        var actual = apis([{
            "name": "leads",
            "ensure": "removed"
        }])
        .map(x => x({hasApi: () => true}));

        expect(actual).to.be.eql([
            removeApi('leads')
        ]);
    });

    it("should do no op if api is already removed", () => {
        var actual = apis([{
            "name": "leads",
            "ensure": "removed"
        }])
        .map(x => x({hasApi: () => false}));

        expect(actual).to.be.eql([
            noop()
        ]);
    });

    it("should update api", () => {
        var actual = apis([{
            "ensure": "present",
            "name": "leads",
            "attributes": {
                "foo": "bar"
            }
        }])
        .map(x => x({hasApi: () => true}));

        expect(actual).to.be.eql([
            updateApi('leads', {foo: "bar"})
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
                "foo": "bar"
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
        }));

        expect(actual).to.be.eql([
            createApi('leads', {foo: "bar"}),
            addApiPlugin('leads', 'cors', {'config.foo': "bar"})
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
            ).map(x => x({hasPlugin: () => false}));

            expect(actual).to.be.eql([
                addApiPlugin('leads', 'cors', {"config.foo": 'bar'})
            ]);
        });

        it("should remove api plugin", () => {
            var actual = plugins(
                'leads', [{
                    "name": "cors",
                    "ensure": "removed"}]
            ).map(x => x({
                hasPlugin: () => true,
                getPluginId: () => 123
            }));

            expect(actual).to.be.eql([
                removeApiPlugin('leads', 123)
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
                getPluginId: () => 123
            }));

            expect(actual).to.be.eql([
                updateApiPlugin('leads', 123, {'config.foo': 'bar'})
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

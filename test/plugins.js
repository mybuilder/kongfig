import expect from 'expect.js';
import {apis, plugins, globalPlugins} from '../src/core.js';
import {
    noop,
    addGlobalPlugin,
    removeGlobalPlugin,
    updateGlobalPlugin
} from '../src/actions.js';

describe("plugins", () => {
    it("should add new global plugin", () => {
        var actual = globalPlugins([{
            "ensure": "present",
            "name": "cors",
            "attributes": {
                'config.foo': "bar"
            }
        }])
        .map(x => x({hasGlobalPlugin: () => false}));

        expect(actual).to.be.eql([
            addGlobalPlugin('cors', {'config.foo': "bar"})
        ]);
    });

    it("should remove a global plugin", () => {
        var actual = globalPlugins([{
            "name": "cors",
            "ensure": "removed",
            "attributes": {
                'config.foo': "bar"
            }
        }])
        .map(x => x({
                    hasGlobalPlugin: () => true,
                    getGlobalPluginId: () => 123
                    }));

        expect(actual).to.be.eql([
            removeGlobalPlugin(123)
        ]);
    });

    it('should update a global plugin', () => {
        var actual = globalPlugins([{
            'name': 'cors',
            'attributes': {
                'config.foo': 'bar'
            }}]
        ).map(x => x({
            hasGlobalPlugin: () => true,
            getGlobalPluginId: () => 123,
            isGlobalPluginUpToDate: () => false
        }));

        expect(actual).to.be.eql([
            updateGlobalPlugin(123, {'config.foo': 'bar'})
        ]);
    });

    it("should validate ensure enum", () => {
        expect(() => globalPlugins([{
            "ensure": "not-valid",
            "name": "cors"
        }])).to.throwException(/Invalid ensure/);
    });

});

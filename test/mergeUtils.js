import expect from 'expect.js';
import mergeConfig from 'mergeUtils';

describe("merge", () => {
    it("should merge api with same name", () => {
        var baseConfig = {apis: [{name: 'test', request_path: '/test'}]};
        var overrideConfig = {apis: [{name: 'test', upstream_url: 'http://test.com'}]};

        var mergedConfig = mergeConfig(baseConfig, overrideConfig);

        expect(mergedConfig).to.have.key('apis');
        expect(mergedConfig['apis']).to.be.an('array');
        expect(mergedConfig['apis']).to.have.length(1);
        expect(mergedConfig['apis'][0]).to.have.keys('name', 'upstream_url', 'request_path');
        expect(mergedConfig['apis'][0]['name']).to.be.equal('test');
        expect(mergedConfig['apis'][0]['request_path']).to.be.equal('/test');
        expect(mergedConfig['apis'][0]['upstream_url']).to.be.equal('http://test.com');

    });

    it("should override config for flat api definition", () => {
        var baseConfig = {apis: [{name: 'test', request_path: '/test'}]};
        var overrideConfig = {apis: [{name: 'test', upstream_url: 'http://test.com', request_path: '/test/1'}]};

        var mergedConfig = mergeConfig(baseConfig, overrideConfig);

        expect(mergedConfig).to.have.key('apis');
        expect(mergedConfig['apis']).to.be.an('array');
        expect(mergedConfig['apis']).to.have.length(1);
        expect(mergedConfig['apis'][0]).to.have.keys('name', 'upstream_url', 'request_path');
        expect(mergedConfig['apis'][0]['name']).to.be.equal('test');
        expect(mergedConfig['apis'][0]['request_path']).to.be.equal('/test/1');
        expect(mergedConfig['apis'][0]['upstream_url']).to.be.equal('http://test.com');

    });

    it("should merge disjoint configs", () => {
        var baseConfig = {apis: [{name: 'test', request_path: '/test', upstream_url: 'http://test.com'}]};
        var overrideConfig = {apis: [{name: 'demo', request_path: '/demo', upstream_url: 'http://demo.com'}]};

        var mergedConfig = mergeConfig(baseConfig, overrideConfig);

        expect(mergedConfig).to.have.key('apis');
        expect(mergedConfig['apis']).to.be.an('array');
        expect(mergedConfig['apis']).to.have.length(2);

        expect(mergedConfig['apis'][0]).to.have.keys('name', 'upstream_url', 'request_path');
        expect(mergedConfig['apis'][0]['name']).to.be.equal('test');
        expect(mergedConfig['apis'][0]['request_path']).to.be.equal('/test');
        expect(mergedConfig['apis'][0]['upstream_url']).to.be.equal('http://test.com');

        expect(mergedConfig['apis'][1]).to.have.keys('name', 'upstream_url', 'request_path');
        expect(mergedConfig['apis'][1]['name']).to.be.equal('demo');
        expect(mergedConfig['apis'][1]['request_path']).to.be.equal('/demo');
        expect(mergedConfig['apis'][1]['upstream_url']).to.be.equal('http://demo.com');
    });

    it("should merge nested configs", () => {
        var baseConfig = {
            apis: [{
                name: 'nested',
                request_path: '/nested',
                upstream_url: 'http://nested.com',
                plugins: [{name: 'acl', attributes: {'config.whitelist': 'good-group'}}]
            }]
        };

        var overrideConfig = {
            apis: [{
                name: 'nested',
                request_path: '/nested',
                upstream_url: 'http://nested.com',
                plugins: [
                    {
                        name: 'acl',
                        attributes: {
                            'config.whitelist': 'super-good-group'
                        }
                    },
                    {
                        name: 'key-auth',
                        attributes: {
                            'config.keynames': 'apikey',
                            'config.hide_credentials': true
                        }
                    }]
            }]
        };

        var mergedConfig = mergeConfig(baseConfig, overrideConfig);

        expect(mergedConfig).to.have.key('apis');
        expect(mergedConfig['apis']).to.be.an('array');
        expect(mergedConfig['apis']).to.have.length(1);

        expect(mergedConfig['apis'][0]).to.have.keys('name', 'upstream_url', 'request_path', 'plugins');
        expect(mergedConfig['apis'][0]['name']).to.be.equal('nested');
        expect(mergedConfig['apis'][0]['request_path']).to.be.equal('/nested');
        expect(mergedConfig['apis'][0]['upstream_url']).to.be.equal('http://nested.com');

        expect(mergedConfig['apis'][0]['plugins']).to.be.an('array');
        expect(mergedConfig['apis'][0]['plugins']).to.have.length(2);

        expect(mergedConfig['apis'][0]['plugins'][0]).to.have.keys('name', 'attributes');
        expect(mergedConfig['apis'][0]['plugins'][0]['name']).to.be.equal('acl');
        expect(mergedConfig['apis'][0]['plugins'][0]['attributes']).to.eql({'config.whitelist': 'super-good-group'});

        expect(mergedConfig['apis'][0]['plugins'][1]).to.have.keys('name', 'attributes');
        expect(mergedConfig['apis'][0]['plugins'][1]['name']).to.be.equal('key-auth');
        expect(mergedConfig['apis'][0]['plugins'][1]['attributes']).to.eql({
            'config.keynames': 'apikey',
            'config.hide_credentials': true
        });

    });

});

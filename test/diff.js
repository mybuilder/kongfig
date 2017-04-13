import expect from 'expect.js';
import diff from '../src/diff';

describe("diff", () => {
    const defined = {
        uris: [ '/foobar', '/baz' ],
        strip_uri: true,
        preserve_host: true,
        upstream_url: 'http://localhost:8001'
    };

    const server = {
        uris: [ '/foobar', '/baz' ],
        id: 'e24e355f-3861-4479-bd34-1aa8a995421e',
        upstream_read_timeout: 60000,
        preserve_host: true,
        created_at: 1492015892000,
        upstream_connect_timeout: 60000,
        upstream_url: 'http://localhost:8001',
        strip_uri: true,
        https_only: false,
        name: 'foobar',
        http_if_terminated: true,
        upstream_send_timeout: 60000,
        retries: 5,
        plugins: []
    };

    it("noting changed", () => {
        expect(diff(defined, server)).to.be.eql([]);
    });

    it("strip_uri changed", () => {
        expect(diff({...defined, strip_uri: false}, server)).to.be.eql(['strip_uri']);
    });

    it("uris one removed", () => {
        expect(diff({...defined, uris: ['/foobar']}, server)).to.be.eql(['uris']);
    });

    it("uris one added", () => {
        expect(diff({...defined, uris: ['/foobar', '/baz', '/added']}, server)).to.be.eql(['uris']);
    });

    it("uris one changed", () => {
        expect(diff({...defined, uris: ['/foobar', '/changed']}, server)).to.be.eql(['uris']);
    });

    it('methods added', () => {
        expect(diff({...defined, methods: ['GET']}, server)).to.be.eql(['methods']);
    });
});


describe("diff hacks", () => {
    it("should be same redirect_uri when a string", () => {
        expect(diff({ redirect_uri: 'foobar' }, { redirect_uri: 'foobar' })).to.be.eql([]);
        expect(diff({ redirect_uri: 'foobar' }, { redirect_uri: ['foobar'] })).to.be.eql([]);
    });

    it("should be same redirect_uri when an array", () => {
        expect(diff({ redirect_uri: ['foobar'] }, { redirect_uri: ['foobar'] })).to.be.eql([]);
    });

    it("should be different redirect_uri when a string", () => {
        expect(diff({ redirect_uri: 'foobar2' }, { redirect_uri: ['foobar'] })).to.be.eql(['redirect_uri']);
    });

    it("should be different redirect_uri when an array", () => {
        expect(diff({ redirect_uri: ['foobar2'] }, { redirect_uri: ['foobar'] })).to.be.eql(['redirect_uri']);
    })
});

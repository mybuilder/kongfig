import expect from 'expect.js';
import {upstreams, targets} from '../src/core.js';
import { noop } from '../src/actions.js';
import {
    createUpstream,
    removeUpstream,
    updateUpstream,
    addUpstreamTarget,
    removeUpstreamTarget,
    updateUpstreamTarget
} from '../src/actions/upstreams.js';

describe("upstreams", () => {
    it("should add new upstream", () => {
        const actual = upstreams([{
            "ensure": "present",
            "name": "leadsUpstream",
            "attributes": {
                "slots": 10
            }
        }])
        .map(x => x({hasUpstream: () => false}));

        expect(actual).to.be.eql([
            createUpstream('leadsUpstream', {slots: 10})
        ]);
    });

    it("should remove upstream", () => {
        const actual = upstreams([{
            "name": "leadsUpstream",
            "ensure": "removed",
            "attributes": {
                "slots": 10
            }
        }])
        .map(x => x({
            hasUpstream: () => true
        }));

        expect(actual).to.be.eql([
            removeUpstream('leadsUpstream')
        ]);
    });

    it("should do no-op if upstream is already removed", () => {
        const upstream = {
            "name": "leadsUpstream",
            "ensure": "removed",
            "attributes": {
                "slots": 10
            }
        };
        const actual = upstreams([upstream])
            .map(x => x({hasUpstream: () => false}));

        expect(actual).to.be.eql([
            noop({ type: 'noop-upstream', upstream})
        ]);
    });

    it("should update the upstream", () => {
        const actual = upstreams([{
            "name": "leadsUpstream",
            "attributes": {
                "slots": 10
            }
        }])
        .map(x => x({hasUpstream: () => true,
            isUpstreamUpToDate: () => false
        }));

        expect(actual).to.be.an('array');
        expect(actual).to.have.length(1);

        expect(actual[0]).to.be.eql(updateUpstream('leadsUpstream', {slots: 10}));
    });

    it("should validate ensure enum", () => {
        expect(() => upstreams([{
            "ensure": "not-valid",
            "name": "leadsUpstream"
        }])).to.throwException(/Invalid ensure/);
    });

    it('should add upstream with targets', () => {
        const actual = upstreams([{
            "ensure": "present",
            "name": "leadsUpstream",
            "attributes": {
                "slots": 10
            },
            "targets": [{
                "target": "server1.leads:8080",
                "ensure": "present",
                "attributes": {
                    "weight": 50
                }
            }]
        }]).map(x => x({
            hasUpstream: () => false,
            hasUpstreamTarget: () => false,
            getUpstreamId: () => 'abcd-1234'
        }));

        expect(actual).to.be.eql([
            createUpstream('leadsUpstream', {slots: 10}),
            addUpstreamTarget('abcd-1234', 'server1.leads:8080', {weight: 50})
        ]);
    });

    it('should update the upstream target', () => {
        const upstream = {
            "name": "leadsUpstream",
            "attributes": {
                "slots": 10
            },
            "targets": [{
                "target": "server1.leads:8080",
                "attributes": {
                    "weight": 50
                }
            }]
        };

        const actual = upstreams([upstream]).map(x => x({
            hasUpstream: () => true,
            isUpstreamUpToDate: () => true,
            hasUpstreamTarget: () => true,
            isUpstreamTargetUpToDate: () => false,
            getUpstreamId: () => 'abcd-1234'
        }));

        expect(actual).to.be.eql([
            noop({ type: 'noop-upstream', upstream: upstream }),
            updateUpstreamTarget('abcd-1234', 'server1.leads:8080', {weight: 50})
        ]);
    });

    it('should remove target from upstream', () => {
        const upstream = {
            "name": "leadsUpstream",
            "attributes": {
                "slots": 10
            },
            "targets": [{
                "target": "server1.leads:8080",
                "ensure": "removed",
                "attributes": {
                    "weight": 50
                }
            }]
        };

        const actual = upstreams([upstream]).map(x => x({
            hasUpstream: () => true,
            isUpstreamUpToDate: () => true,
            hasUpstreamTarget: () => true,
            getUpstreamId: () => 'abcd-1234'
        }));

        expect(actual).to.be.eql([
            noop({ type: 'noop-upstream', upstream: upstream }),
            removeUpstreamTarget('abcd-1234', 'server1.leads:8080')
        ]);
    });

    it('should do no-op if target was already removed', () => {
        const upstream = {
            "name": "leadsUpstream",
            "attributes": {
                "slots": 10
            },
            "targets": [{
                "target": "server1.leads:8080",
                "ensure": "removed",
                "attributes": {
                    "weight": 50
                }
            }]
        };

        const actual = upstreams([upstream]).map(x => x({
            hasUpstream: () => true,
            isUpstreamUpToDate: () => true,
            hasUpstreamTarget: () => false
        }));

        expect(actual).to.be.eql([
            noop({ type: 'noop-upstream', upstream: upstream }),
            noop({ type: 'noop-target', target: upstream.targets[0] }),
        ]);
    });
});

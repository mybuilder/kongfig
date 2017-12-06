import should from 'should';
import clone from 'clone';
import orig from './fixtures/syncConfigs-base.json';
import sync from '../src/syncConfigs.js'

let local, remote;

beforeEach(done => {
    local = clone(orig);
    remote = clone(orig);
    done();
});

describe('apis', () => {
    describe('when apis exist on the remote but not locally', () => {
        beforeEach(done => {
            local.apis = local.apis.filter(a => !a.name.startsWith('test'));
            local = sync(local, remote);
            done();
        });

        it('should mark the missing apis for removal', () => {
            local.apis.filter(a => a.ensure === 'removed').length.should.eql(2);

            remote.apis
            .filter(a => a.name.startsWith('test'))
            .forEach(api => {
                api.ensure = 'removed';
                local.apis.should.containEql(api);
            });
        });
    });

    describe('when api plugins exist on the remote but not locally', () => {
        beforeEach(done => {
            local.apis.forEach(a => a.plugins = a.plugins ? [] : a.plugins);
            local = sync(local, remote);
            done();
        });

        it('should mark the missing api plugins for removal', () => {
            let localApis = local.apis.filter(a => a.plugins && a.plugins.length > 0);

            remote.apis
            .filter(a => a.plugins && a.plugins.length > 0)
            .forEach(api => {
                let found = localApis.find(localApi => localApi.name === api.name);
                should.exist(found);
                api.plugins.forEach(plugin => {
                    plugin.ensure = 'removed';
                    found.plugins.should.containEql(plugin);
                });
            });
        });
    });
});

describe('global plugins', () => {
    describe('when global plugins exist on the remote but not locally', () => {
        beforeEach(done => {
            local.plugins = local.plugins.filter(p => !p.name.startsWith('test'));
            local = sync(local, remote);
            done();
        });

        it('should mark the missing plugins for removal', () => {
            local.plugins.filter(p => p.ensure === 'removed').length.should.eql(3);

            remote.plugins
            .filter(p => p.name.startsWith('test'))
            .forEach(plugin => {
                plugin.ensure = 'removed';
                local.plugins.should.containEql(plugin);
            });
        });
    });
});

describe('consumers', () => {
    describe('when consumers exist on the remote but not locally', () => {
        beforeEach(done => {
            local.consumers = local.consumers.filter(c => !c.username.startsWith('test'));
            done();
        });

        describe('and ignoreConsumers is falsy', () => {
            it('should mark the missing consumers for removal', () => {
                local = sync(local, remote);

                local.consumers.filter(c => c.ensure === 'removed').length.should.eql(3);

                remote.consumers
                .filter(c => c.username.startsWith('test'))
                .forEach(consumer => {
                    consumer.ensure = 'removed';
                    local.consumers.should.containEql(consumer);
                });
            });
        });

        describe('and ignoreConsumers is truthy', () => {
            it('should not mark the missing consumers for removal', () => {
                local = sync(local, remote, true);

                local.consumers.filter(c => c.ensure === 'removed').length.should.eql(0);

                remote.consumers
                .filter(c => c.username.startsWith('test'))
                .forEach(consumer => {
                    consumer.ensure = 'removed';
                    local.consumers.should.not.containEql(consumer);
                });
            });
        });
    });

    describe('when consumer credentials exist on the remote but not locally', () => {
        beforeEach(done => {
            local.consumers = local.consumers.map(c => {
                c.username.startsWith('test') ? c.credentials.pop() : null;
                return c;
            });
            done();
        });

        it('should mark the missing credentials for removal', () => {
            local = sync(local, remote);
            let removed = local.consumers.filter(c => !!c.credentials.find(c => c.ensure === 'removed'));

            removed.length.should.eql(3);
            removed.forEach(c => c.credentials.filter(c => c.ensure === 'removed').length.should.eql(1));

            remote.consumers
            .filter(c => c.username.startsWith('test'))
            .forEach(consumer => {
                let expected = consumer.credentials.pop();
                let found = local.consumers.find(c => c.username === consumer.username);
                should.exist(found);
                expected.ensure = 'removed';
                found.credentials.should.containEql(expected);
            });
        });

        describe('if ignoreConsumers is falsy', () => {
            it('should not mark the missing credentials for removal', () => {
                local = sync(local, remote, true);
                let removed = local.consumers.filter(c => !!c.credentials.find(c => c.ensure === 'removed'));

                removed.length.should.eql(0);

                remote.consumers
                .filter(c => c.username.startsWith('test'))
                .forEach(consumer => {
                    let expected = consumer.credentials.pop();
                    let found = local.consumers.find(c => c.username === consumer.username);
                    should.exist(found);
                    expected.ensure = 'removed';
                    found.credentials.should.not.containEql(expected);
                });
            });
        });
    });
});

describe('upstreams', () => {
    describe('when upstreams exist on the remote but not locally', () => {
        beforeEach(done => {
            local.upstreams = local.upstreams.filter(u => !u.name.startsWith('test'));
            local = sync(local, remote);
            done();
        });

        it('should mark the missing upstreams for removal', () => {
            let expected = remote.upstreams.filter(u => u.name.startsWith('test'));

            local.upstreams.filter(u => u.ensure === 'removed').length.should.eql(2);

            expected.forEach(upstream => {
                upstream.ensure = 'removed';
                local.upstreams.should.containEql(upstream);
            });
        });
    });

    describe('when upstream targets exist on the remote but not locally', () => {
        beforeEach(done => {
            local.upstreams = local.upstreams.map(u => {
                u.name.startsWith('test') ? u.targets.pop() : null;
                return u;
            });
            local = sync(local, remote);
            done();
        });

        it('should mark the missing upstream targets for removal', () => {
            let removed = local.upstreams.filter(u => !!u.targets.find(t => t.ensure === 'removed'));

            removed.length.should.eql(2);
            removed.forEach(u => u.targets.filter(t => t.ensure === 'removed').length.should.eql(1));

            remote.upstreams
            .filter(u => u.name.startsWith('test'))
            .forEach(upstream => {
                let expected = upstream.targets.pop();
                let found = local.upstreams.find(u => u.name === upstream.name);
                should.exist(found);
                expected.ensure = 'removed';
                found.targets.should.containEql(expected);
            });
        });
    });
});

describe('combined', () => {
    const rootKeys = ['apis', 'consumers', 'plugins', 'upstreams'];

    describe('when root elements exist locally, but not on the remote', () => {
        it('should do nothing to the local config', () => {
            let expected = clone(local);
            rootKeys.forEach(key => delete remote[key]);
            local = sync(local, remote);

            expected.should.eql(local);
        });
    });

    describe('when root elements exist on the remote, but not locally', () => {
        beforeEach(done => {
            remote.foo = 'bar';
            rootKeys.forEach(key => delete local[key]);
            local = sync(local, remote);
            done();
        });

        it('should create them locally and mark them for removal', () => {
            Object.keys(local).should.containDeep(rootKeys);
            rootKeys.forEach(val => {
                local[val].forEach(obj => {
                    obj.should.containEql({ensure: 'removed'});
                });
            });
        });

        it('should not add unexpected root elements', () => {
            Object.keys(local).should.not.containDeep(['foo']);
        });

        describe('if ignoreConsumers is truthy', () => {
            it('should mark everything except consumers for removal', () => {
                local = clone(orig);
                rootKeys.forEach(key => delete local[key]);
                local = sync(local, remote, true);

                rootKeys.forEach(key => {
                    remote[key].forEach(o => {
                        o.ensure = 'removed';

                        if (key === 'consumers') {
                            local[key].should.not.containEql(o);
                        } else {
                            local[key].should.containEql(o);
                        }
                    });
                });
            });
        });
    });
});


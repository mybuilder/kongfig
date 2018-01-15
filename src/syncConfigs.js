'use strict';

import clone from 'clone';
import { getSchema } from './consumerCredentials'

const rootKeys = ['apis', 'consumers', 'plugins', 'upstreams'];

const ensureRemoved = (obj) => {
    obj.ensure = 'removed';
};

const markPluginsForRemoval = (local, remote) => {
    remote.forEach(plugin => {
        if (!local.find(p => p.name === plugin.name)) {
            ensureRemoved(plugin);
            local.unshift(plugin);
        }
    });
};

const markApisForRemoval = (local, remote) => {
    remote.forEach(api => {
        let found = local.find(a => a.name === api.name);
        if (found && api.plugins) {
            found.plugins = found.plugins ? found.plugins : [];
            markPluginsForRemoval(found.plugins, api.plugins);
        } else {
            ensureRemoved(api);
            local.unshift(api);
        }
    })
};

const markCredentialsForRemoval = (local, remote) => {
    remote.forEach(cred => {
        let key = getSchema(cred.name).id;
        if (!local.find(c=> c.attributes[key] === cred.attributes[key])) {
            ensureRemoved(cred);
            local.unshift(cred);
        }
    });
};

const markConsumersForRemoval = (local, remote) => {
    remote.forEach(consumer => {
        let found = local.find(c => c.username === consumer.username);
        if (found) {
            found.credentials = found.credentials ? found.credentials : [];
            markCredentialsForRemoval(found.credentials, consumer.credentials);
        } else {
            ensureRemoved(consumer);
            local.unshift(consumer);
        }
    });
};

const markTargetsForRemoval = (local, remote) => {
    remote.forEach(target => {
        if (!local.find(t => t.target === target.target)) {
            ensureRemoved(target);
            local.unshift(target);
        }
    });
};

const markUpstreamsForRemoval = (local, remote) => {
    remote.forEach(upstream => {
        let found = local.find(u => u.name === upstream.name);
        if (found) {
            found.targets = found.targets ? found.targets : [];
            markTargetsForRemoval(found.targets, upstream.targets);
        } else {
            ensureRemoved(upstream);
            local.unshift(upstream);
        }
    });
};

export default (local, remote, ignoreConsumers) => {
    const localKeys = Object.keys(local);
    const remoteKeys = Object.keys(remote);

    local = clone(local);
    remote = clone(remote);

    rootKeys.forEach(key => {
        local[key] = localKeys.includes(key) ? local[key] : [];
        remote[key] = remoteKeys.includes(key) ? remote[key] : [];
    });

    markApisForRemoval(local.apis, remote.apis);
    markPluginsForRemoval(local.plugins, remote.plugins);
    if (!ignoreConsumers) {
        markConsumersForRemoval(local.consumers, remote.consumers);
    }
    markUpstreamsForRemoval(local.upstreams, remote.upstreams);

    return local;
};

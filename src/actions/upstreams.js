import assign from 'object-assign';

export function createUpstream(name, params) {
    return {
        type: 'create-upstream',
        endpoint: { name: 'upstreams' },
        method: 'POST',
        body: assign({}, params, {name})
    };
}

export function removeUpstream(name) {
    return {
        type: 'remove-upstream',
        endpoint: { name: 'upstream', params: {name} },
        method: 'DELETE'
    };
}

export function updateUpstream(name, params) {
    return {
        type: 'update-upstream',
        endpoint: { name: 'upstream', params: {name} },
        method: 'PATCH',
        body: params,
    }
}

export function addUpstreamTarget(upstreamId, targetName, params) {
    return {
        type: 'add-upstream-target',
        endpoint: { name: 'upstream-targets', params: {upstreamId, targetName} },
        method: 'POST',
        body: assign({}, params, {target: targetName})
    };
}

export function removeUpstreamTarget(upstreamId, targetName) {
    return {
        type: 'remove-upstream-target',
        endpoint: { name: 'upstream-targets', params: {upstreamId, targetName} },
        method: 'POST',
        body: { target: targetName, weight: 0 }
    };
}

export function updateUpstreamTarget(upstreamId, targetName, params) {
    return addUpstreamTarget(upstreamId, targetName, params);
}

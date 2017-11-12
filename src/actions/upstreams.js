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
    // orderlist must be passed if the slots value is changed,
    // however we don't want to store orderlist in the config
    // because this can be a very large array.
    // Clone the params object and add a randomly generated
    // orderlist to it based on slot value.
    return {
        type: 'update-upstream',
        endpoint: { name: 'upstream', params: {name} },
        method: 'PATCH',
        body: addOrderlistToUpstreamAttributes(params)
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

function addOrderlistToUpstreamAttributes(attributes) {
    if (attributes.slots) {
        attributes = Object.assign({}, attributes);
        attributes.orderlist = [];
        for (let i = 1; i <= attributes.slots; i++) {
            let pos = Math.floor(Math.random() * i);
            attributes.orderlist.splice(pos, 0, i);
        }
    }

    return attributes;
}


export const parseUpstream = ({
    name,
    slots,
    id,
    created_at,
    orderlist
}) => {
    return {
        name,
        attributes: {
            slots
        },
        _info: {
            id,
            created_at,
            orderlist
        }
    };
};

export const parseUpstreams = (upstreams) => {
    return upstreams.map(upstream => {
        const { name, ...rest } = parseUpstream(upstream);

        return { name, targets: parseUpstreamTargets(upstream.targets), ...rest };
    });
};

export const parseTarget = ({
    target,
    weight,
    id,
    upstream_id,
    created_at
}) => {
    return {
        target,
        attributes: {
            weight
        },
        _info: {
            id,
            upstream_id,
            created_at
        }
    }
};

function parseUpstreamTargets(targets) {
    if (!Array.isArray(targets)) {
        return [];
    }

    return targets.map(parseTarget);
}

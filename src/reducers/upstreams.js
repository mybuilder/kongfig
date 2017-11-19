import { parseUpstream, parseTarget } from '../parsers/upstreams';

const targets = (state, log) => {
    const { params: { type, endpoint: { params, body } }, content } = log;

    switch(type) {
        case 'add-upstream-target': return [
            // target with the same name overrides the previous target
            ...state.filter(target => target.target !== params.targetName),
            parseTarget(content)
        ];
        case 'update-upstream-target': return state.map(state => {
            if (state._info.id !== content.id) {
                return state;
            }

            return parseTarget(content);
        });
        case 'remove-upstream-target': return state.filter(target => target.target !== params.targetName);
        default: return state;
    }
};

const upstream = (state, log) => {
    const { params: { type, endpoint: { params, body } }, content } = log;

    switch (type) {
        case 'create-upstream': return {
            ...parseUpstream(content),
            targets: []
        };
        case 'update-upstream':
            if (state._info.id !== content.id) {
                return state
            }

            return {
                ...state,
                ...parseUpstream(content)
            };

        case 'add-upstream-target':
        case 'update-upstream-target':
        case 'remove-upstream-target':
            if (state._info.id !== params.upstreamId) {
                return state;
            }

            return {
                ...state,
                targets: targets(state.targets, log)
            };

        default: return state;
    }
};

export default (state = [], log) => {
    if (log.type !== 'response') {
        return state;
    }

    const { params: { type, endpoint: { params } }, content } = log;

    switch (type) {
        case 'create-upstream': return [...state, upstream(undefined, log)];
        case 'remove-upstream': return state.filter(upstream => upstream.name !== params.name);

        case 'add-upstream-target':
        case 'update-upstream-target':
        case 'remove-upstream-target':
        case 'update-upstream': return state.map(state => upstream(state, log));

        default: return state;
    }
};

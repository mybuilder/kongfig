import { parseApiPostV10, parsePlugin, parseConsumer, parseAcl, parseGlobalPlugin } from '../readKongApi';

const plugins = (state, log) => {
    const { params: { type, endpoint: { params, body } }, content } = log;

    switch (type) {
    case 'add-api-plugin': return [ ...state, parsePlugin(content) ];
    case 'update-api-plugin': return state.map(state => {
        if (state._info.id !== content.id) {
            return state;
        }

        return parsePlugin(content);
    });
    case 'remove-api-plugin': return state.filter(plugin => plugin._info.id !== params.pluginId);
    default: return state;
    }
};

const api = (state, log) => {
    const { params: { type, endpoint: { params, body } }, content } = log;

    switch (type) {
    case 'create-api': return {
        ...parseApiPostV10(content),
        plugins: []
    };
    case 'update-api':
        if (state._info.id !== content.id) {
            return state;
        }

        return {
            ...state,
            ...parseApiPostV10(content)
        };

    case 'add-api-plugin':
    case 'update-api-plugin':
    case 'remove-api-plugin':
        if (state._info.id !== params.apiId) {
            return state;
        }

        return {
            ...state,
            plugins: plugins(state.plugins, log)
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
    case 'create-api': return [...state, api(undefined, log)];
    case 'remove-api': return state.filter(api => api.name !== params.name);

    case 'add-api-plugin':
    case 'update-api-plugin':
    case 'remove-api-plugin':
    case 'update-api': return state.map(state => api(state, log));

    default: return state;
    }
};

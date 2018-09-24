import { parseService, parsePlugin, parseRoute } from '../readKongApi';

const plugins = (state, log) => {
    const { params: { type, endpoint: { params, body } }, content } = log;

    switch (type) {
    case 'add-service-plugin': return [ ...state, parsePlugin(content) ];
    case 'update-service-plugin': return state.map(state => {
        if (state._info.id !== content.id) {
            return state;
        }

        return parsePlugin(content);
    });
    case 'remove-service-plugin': return state.filter(plugin => plugin._info.id !== params.pluginId);
    default: return state;
    }
};

const routes = (state, log) => {
    const { params: { type, endpoint: { params, body } }, content } = log;

    switch (type) {
    case 'add-route': return [ ...state, parseRoute(content) ];
    case 'update-route': return state.map(state => {
        if (state._info.id !== content.id) {
            return state;
        }
        return parseRoute(content);
    });
    case 'remove-route': return state.filter(route => route._info.id !== params.routeId);
    default: return state;
    }
};

const service = (state, log) => {
    const { params: { type, endpoint: { params, body } }, content } = log;

    switch (type) {

    case 'create-service': return {
        ...parseService(content),
        plugins: [],
        routes: []
    };
    case 'update-service':
        if (state._info.id !== content.id) {
            return state;
        }

        return {
            ...state,
            ...parseService(content)
        };

    case 'add-service-plugin':
    case 'update-service-plugin':
    case 'remove-service-plugin':
    case 'add-route':
    case 'update-route':
    case 'remove-route':
        if (state._info.id !== params.serviceId) {
            return state;
        }

        return {
            ...state,
            plugins: plugins(state.plugins, log),
            routes: routes(state.routes, log)
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
    case 'create-service': return [...state, service(undefined, log)];
    case 'remove-service': return state.filter(service => service.name !== params.name);

    case 'add-service-plugin':
    case 'update-service-plugin':
    case 'remove-service-plugin':
    case 'add-route':
    case 'update-route':
    case 'remove-route':
    case 'update-service': return state.map(state => service(state, log));

    default: return state;
    }
};

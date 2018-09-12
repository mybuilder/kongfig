import apis from './apis';
import plugins from './plugins';
import consumers from './consumers';
import services from './services';
import upstreams from './upstreams';
import certificates from './certificates';

const combine = reducers => (state = {}, log) => {
    return Object.keys(reducers).reduce((nextState, key) => {
        nextState[key] = reducers[key](state[key], log);

        return nextState;
    }, state);
};

const _info = (state = {}, log) => {
    const { type } = log;

    switch (type) {
    case 'kong-info':
        return { ...state, version: log.version };
    default: return state;
    }
}

export default combine({
    _info,
    apis,
    plugins,
    consumers,
    services,
    upstreams,
    certificates,
});

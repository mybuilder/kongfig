import apis from './apis';
import plugins from './plugins';
import consumers from './consumers';

const combine = reducers => (state = {}, log) => {
    return Object.keys(reducers).reduce((nextState, key) => {
        nextState[key] = reducers[key](state[key], log);

        return nextState;
    }, {});
};

export default combine({
    apis,
    plugins,
    consumers,
});

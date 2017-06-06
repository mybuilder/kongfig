import { parseApiPostV10, parsePlugin, parseConsumer, parseAcl, parseGlobalPlugin } from '../lib/readKongApi';
import reducer from './reducers';

export const logReducer = (state = {}, log) => {
    if (log.type !== 'response') {
        return state;
    }

    // console.log(log.params.type, log.params.endpoint, log.content);

    return reducer(state, log);
};

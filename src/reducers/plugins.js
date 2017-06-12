import { parseGlobalPlugin } from '../readKongApi';

export default (state = [], log) => {
    if (log.type !== 'response') {
        return state;
    }

    const { params: { type, endpoint: { params } }, content } = log;

    switch (type) {
    case 'add-global-plugin': return [...state, parseGlobalPlugin(content)];
    case 'update-global-plugin': return state.map(plugin => {
        if (plugin._info.id !== params.pluginId) {
            return plugin;
        }

        return parseGlobalPlugin(content);
    });
    case 'remove-global-plugin': return state.filter(plugin => plugin._info.id !== params.pluginId);
    default: return state;
    }

    return state;
};

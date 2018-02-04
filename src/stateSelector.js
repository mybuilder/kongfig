import invariant from 'invariant';

const getConsumerById = (id, consumers) => {
    const consumer = consumers.find(x => x._info.id === id);

    invariant(consumer, `Unable to find a consumer for ${id}`);

    return consumer;
};

export default state => {
    const fixPluginAnonymous = ({ name, attributes: { config, ...attributes }, ...plugin }) => {
        if (config && config.anonymous) {
            const { anonymous, ...restOfConfig } = config;
            const { username } = getConsumerById(anonymous, state.consumers);

            return { name, attributes: { ...attributes, config: { anonymous_username: username, ...restOfConfig } }, ...plugin };
        }

        return { name, attributes: { ...attributes, config }, ...plugin };
    }

    const fixPluginUsername = ({ name, attributes: { consumer_id, ...attributes }, ...plugin }) => {
        if (!consumer_id) {
            return { name, attributes, ...plugin };
        }

        const { username } = getConsumerById(consumer_id, state.consumers);

        return { name, attributes: { username, ...attributes }, ...plugin };
    };

    const fixApiPluginUsername = api => ({
        ...api,
        plugins: (api.plugins || []).map(fixPluginUsername).map(fixPluginAnonymous),
    });

    return {
        ...state,
        apis: state.apis && state.apis.map(fixApiPluginUsername),
        plugins: state.plugins && state.plugins.map(fixPluginUsername).map(fixPluginAnonymous),
    };
};

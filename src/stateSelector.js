const getConsumerById = (id, consumers) => consumers.find(x => x._info.id === id) || {};

export default state => {
    const fixPluginUsername = ({ name, attributes: { consumer_id, ...attributes }, ...plugin }) => {
        const { username } = getConsumerById(consumer_id, state.consumers);

        return { name, attributes: { username, ...attributes }, ...plugin };
    };

    const fixApiPluginUsername = api => ({
        ...api,
        plugins: (api.plugins || []).map(fixPluginUsername),
    });

    return {
        ...state,
        apis: state.apis && state.apis.map(fixApiPluginUsername),
        plugins: state.plugins && state.plugins.map(fixPluginUsername),
    };
};

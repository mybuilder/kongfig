import {getSupportedCredentials} from './consumerCredentials'

export default async ({fetchApis, fetchPlugins, fetchGlobalPlugins, fetchConsumers, fetchConsumerCredentials, fetchConsumerAcls, fetchKongVersion}) => {
    const version = await fetchKongVersion();
    const apis = await fetchApis();
    const apisWithPlugins = await Promise.all(apis.map(async item => {
        const plugins =  await fetchPlugins(item.id);

        return {...item, plugins};
    }));

    const consumers = await fetchConsumers();
    const consumersWithCredentialsAndAcls = await Promise.all(consumers.map(async consumer => {
        if (consumer.custom_id && !consumer.username) {
            console.log(`Consumers with only custom_id not supported: ${consumer.custom_id}`);

            return consumer;
        }

        const allCredentials = Promise.all(getSupportedCredentials().map(name => {
            return fetchConsumerCredentials(consumer.id, name)
                .then(credentials => [name, credentials]);
        }));

        var aclsFetched = await fetchConsumerAcls(consumer.id);

        var consumerWithCredentials = allCredentials
            .then(result => {
                return {
                    ...consumer,
                    credentials: result.reduce((acc, [name, credentials]) => {
                        return {...acc, [name]: credentials};
                    }, {}),
                    acls: aclsFetched

                };
            });

        return consumerWithCredentials;

    }));

    const allPlugins = await fetchGlobalPlugins();
    const globalPlugins = allPlugins.filter(plugin => {
        return plugin.api_id === undefined;
    });

    return {
        apis: apisWithPlugins,
        consumers: consumersWithCredentialsAndAcls,
        plugins: globalPlugins,
        version,
    };
};

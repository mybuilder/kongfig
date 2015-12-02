export default async ({fetchApis, fetchPlugins, fetchConsumers, fetchConsumerCredentials}) => {
    const apis = await fetchApis();
    const apisWithPlugins = await Promise.all(apis.map(async item => {
        const plugins =  await fetchPlugins(item.name);

        return {...item, plugins};
    }));

    const consumers = await fetchConsumers();
    const consumersWithCredentials = await Promise.all(consumers.map(async consumer => {
        if (consumer.custom_id && !consumer.username) {
            console.log(`Consumers with only custom_id not supported: ${consumer.custom_id}`);

            return consumer;
        }

        const oauth2 = await fetchConsumerCredentials(consumer.username, 'oauth2');
        const keyAuth = await fetchConsumerCredentials(consumer.username, 'key-auth');
        const jwt = await fetchConsumerCredentials(consumer.username, 'jwt');
        const basicAuth = await fetchConsumerCredentials(consumer.username, 'basic-auth');

        return {...consumer, credentials: {oauth2, keyAuth, jwt, basicAuth}};
    }));

    return {
        apis: apisWithPlugins,
        consumers: consumersWithCredentials
    };
};

import {getSupportedCredentials} from './core'

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

        const allCredentials = Promise.all(getSupportedCredentials().map(name => {
            return fetchConsumerCredentials(consumer.username, name)
                .then(credentials => [name, credentials]);
        }));

        return allCredentials
            .then(result => {
                return {
                    ...consumer,
                    credentials: result.reduce((acc, [name, credentials]) => {
                        return {...acc, [name]: credentials};
                    }, {})
                };
            });
    }));

    return {
        apis: apisWithPlugins,
        consumers: consumersWithCredentials
    };
};

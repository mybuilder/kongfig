import semVer from 'semver';
import {getSupportedCredentials} from './consumerCredentials'

const fetchUpstreamsWithTargets = async ({ version, fetchUpstreams, fetchTargets }) => {
    if (semVer.lte(version, '0.10.0')) {
        return Promise.resolve([]);
    }

    const upstreams = await fetchUpstreams();

    return await Promise.all(
        upstreams.map(async item => {
            const targets = await fetchTargets(item.id);

            return { ...item, targets };
        })
    );
};

const fetchCertificatesForVersion = async ({ version, fetchCertificates }) => {
    if (semVer.lte(version, '0.10.0')) {
        return Promise.resolve([]);
    }

    return await fetchCertificates();
};

const fetchServicesWithPluginsAndRoutes = async ({ version, fetchServices, fetchServicePlugins, fetchRoutes}) => {
    if (semVer.lt(version, '0.14.0')) {
        return Promise.resolve([]);
    }
    const services = await fetchServices();

    return await Promise.all(services.map(async item => {

        const plugins =  await fetchServicePlugins(item.id);
        const routes = await fetchRoutes(item.id);

        return {...item, plugins, routes};
      }));
}

export default async ({fetchApis, fetchPlugins, fetchServices, fetchServicePlugins, fetchRoutes, fetchGlobalPlugins, fetchConsumers, fetchConsumerCredentials, fetchConsumerAcls, fetchUpstreams, fetchTargets, fetchTargetsV11Active, fetchCertificates, fetchKongVersion}) => {
    const version = await fetchKongVersion();
    const apis = await fetchApis();
    const apisWithPlugins = await Promise.all(apis.map(async item => {
        const plugins =  await fetchPlugins(item.id);

        return {...item, plugins};
    }));

    const servicesWithPluginsAndRoutes = await fetchServicesWithPluginsAndRoutes({ version, fetchServices, fetchServicePlugins, fetchRoutes });

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
        return (plugin.api_id === undefined && plugin.service_id === undefined);
    });

    const upstreamsWithTargets = await fetchUpstreamsWithTargets({ version, fetchUpstreams, fetchTargets: semVer.gte(version, '0.12.0') ? fetchTargets : fetchTargetsV11Active });
    const certificates = await fetchCertificatesForVersion({ version, fetchCertificates });

    return {
        apis: apisWithPlugins,
        services: servicesWithPluginsAndRoutes,
        consumers: consumersWithCredentialsAndAcls,
        plugins: globalPlugins,
        upstreams: upstreamsWithTargets,
        certificates,
        version,
    };
};

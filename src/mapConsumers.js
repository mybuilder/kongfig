export default (ignoreConsumers, mapType) => {
    return config => removeConsumers(translateConsumers(config, mapType), ignoreConsumers);
}

function translateConsumers(config, mapType) {
    if (mapType) {
        config['apis'] = mapApis(config['apis'], config['consumers'], mapType);
        config['plugins'] = mapPlugins(config['plugins'], config['consumers'], mapType);
    } 
    return config;
}

function removeConsumers(config, ignoreConsumers) {
    if (ignoreConsumers) {
        config['consumers'] = [];
    }

    return config;
}


function mapApis(apis, consumers, mapType) {
    apis.forEach(function(api) {
        api.plugins = mapPlugins(api.plugins, consumers, mapType);
    });
    return apis
}

function mapPlugins(plugins, consumers, mapType) {
    plugins.forEach(function(plugin) {
        if (plugin.attributes && plugin.attributes.consumer_id) {
            var consumer = getConsumer(plugin.attributes.consumer_id, consumers);
            if (!consumer[mapType]) {
                throw new Error(`Unable to map consumer. ${consumer.id} has no ${mapType}.`);
            }
            plugin[mapType] = consumer[mapType];
            delete plugin.attributes.consumer_id;
        }
    });
    return plugins
}



function getConsumer(id, consumers) {
    const consumer = consumers.find(c => c.id === id);
    if (!consumer) {
        throw new Error(`Unable to find consumer ${id}.`);
    }

    return consumer
}

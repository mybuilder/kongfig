import createRouter from 'router';

require('babel/polyfill');
require('isomorphic-fetch');

export default host => {
    const router = createRouter(host);

    return {
        router,
        fetchApis: () => getJson(router({name: 'apis'})),
        fetchPlugins: apiName => getJson(router({name: 'api-plugins', params: {apiName}})),
        fetchConsumers: () => getJson(router({name: 'consumers'})),
        fetchConsumerCredentials: (username, plugin) => getJson(router({name: 'consumer-credentials', params: {username, plugin}})),
        requestEndpoint: (endpoint, params) => fetch(router(endpoint), prepareOptions(params))
    }
}

function getJson(uri) {
    return fetch(uri, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(r => r.json())
    .then(json => {
        if (json.next) {
            throw new Error(`Content overflow on ${uri}, paggination not supported`);
        }

        return json.data;
    });
}

const prepareOptions = ({method, body}) => {
    if (body) {
        return {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            body: JSON.stringify(body)
        };
    }

    return {
        method: method,
        headers: {
            'Accept': 'application/json',
        }
    };
}

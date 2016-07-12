require('isomorphic-fetch');

let headers = {};

const addHeader = (name, value) => { headers[name] = value };
const clearHeaders = () => { headers = {} };

const get = (uri) => {
    const options = {
        method: 'GET',
        headers: {
            'Connection': 'keep-alive',
            'Accept': 'application/json'
        }
    };

    return request(uri, options);
};

const request = (uri, opts) => {
    const requestHeaders = Object.assign(
        {},
        opts.headers,
        headers
    );

    const options = Object.assign(
        {},
        opts,
        { headers: requestHeaders }
    );

    return fetch(uri, options);
};

export default {
    addHeader,
    clearHeaders,
    get,
    request
};

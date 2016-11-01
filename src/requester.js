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

    return fetchWithRetry(uri, options);
};

function fetchWithRetry(url, options) {
  var retries = 3;
  var retryDelay = 1000;

  if (options && options.retries) {
    retries = options.retries;
  }

  if (options && options.retryDelay) {
    retryDelay = options.retryDelay;
  }

  return new Promise(function(resolve, reject) {
    var wrappedFetch = (n) => {
      fetch(url, options)
        .then(response => {
          resolve(response);
        })
        .catch(error => {
          if (n > 0) {
            setTimeout(() => {
              wrappedFetch(--n);
            }, retryDelay);
          } else {
            reject(error);
          }
        });
    };
    wrappedFetch(retries);
  });
}

export default {
    addHeader,
    clearHeaders,
    get,
    request
};

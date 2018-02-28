const createLogHandler = handlers => message => {
    if (handlers.hasOwnProperty(message.type)) {
        return handlers[message.type](message);
    }

    return handlers['unknown'](message);
};

const censoredKeys = ['key', 'password', 'client_secret', 'access_token', 'refresh_token', 'provision_key', 'secret', 'cert'];

const censor = (key, value) => {
    if (typeof value !== 'string') {
        return value;
    }

    return censoredKeys.indexOf(key) === -1 ? value : `*****${value.slice(-4)}`;
};
const censorLogData = data => JSON.parse(JSON.stringify(data, censor));

export const screenLogger = createLogHandler({
    noop: message => createLogHandler({
        'noop-api': ({ api }) => console.log(`api ${api.name.bold} ${'is up to date'.bold.green}`),
        'noop-plugin': ({ plugin }) => console.log(`- plugin ${plugin.name.bold} ${'is up to date'.bold.green}`),
        'noop-global-plugin': ({ plugin }) => console.log(`global plugin ${plugin.name.bold} ${'is up to date'.bold.green}`),
        'noop-consumer': ({ consumer }) => console.log(`consumer ${consumer.username.bold} ${'is up to date'.bold.green}`),
        'noop-credential': ({ credential, credentialIdName }) => console.log(`- credential ${credential.name.bold} with ${credentialIdName.bold}: ${censor('key', credential.attributes[credentialIdName]).bold} ${'is up to date'.bold.green}`),
        'noop-upstream': ({ upstream }) => console.log(`upstream ${upstream.name.bold} ${'is up to date'.bold.green}`),
        'noop-target': ({ target }) => console.log(`target ${target.target.bold} ${'is up to date'.bold.green}`),
        'noop-certificate': ({ identityClue }) => console.log(`certificate ${identityClue}... ${'is up to date'.bold.green}`),
        'noop-certificate-sni': ({ sni }) => console.log(`certificate sni ${sni.name} ${'is up to date'.bold.green}`),
        'noop-certificate-sni-removed': ({ sni }) => console.log(`certificate sni ${sni.name} ${'is NOT present'.bold.green}`),

        unknown: action => console.log('unknown action', action),
    })(message.params),
    request: ({ uri, params: { method, body } }) => console.log(
        `\n${method.bold.blue}`, uri.blue, "\n", body ? censorLogData(body) : ''
    ),
    response: ({ ok, status, statusText, content }) => console.log(
        ok ? `${status} ${statusText.bold}`.green : `${status} ${statusText.bold}`.red,
        censorLogData(content)
    ),
    debug: () => {},
    'experimental-features': ({ message }) => console.log(message),
    'kong-info': ({ version }) => console.log(`Kong version: ${version}`),
    unknown: message => console.log('unknown', message),
});

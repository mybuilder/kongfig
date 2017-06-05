const createLogHandler = handlers => message => {
    if (handlers.hasOwnProperty(message.type)) {
        return handlers[message.type](message);
    }

    return handlers['unknown'](message);
};

export const screenLogger = createLogHandler({
    noop: message => createLogHandler({
        'noop-api': ({ api }) => console.log(`api ${api.name.bold} ${'is up to date'.bold.green}`),
        'noop-plugin': ({ plugin }) => console.log(`- plugin ${plugin.name.bold} ${'is up to date'.bold.green}`),
        'noop-global-plugin': ({ plugin }) => console.log(`global plugin ${plugin.name.bold} ${'is up to date'.bold.green}`),
        'noop-consumer': ({ consumer }) => console.log(`consumer ${consumer.username.bold} ${'is up to date'.bold.green}`),
        'noop-credential': ({ credential, credentialIdName }) => console.log(`- credential ${credential.name.bold} with ${credentialIdName.bold}: ${credential.attributes[credentialIdName].bold} ${'is up to date'.bold.green}`),

        unknown: action => console.log('unknown action', action),
    })(message.params),
    request: ({ uri, params: { method, body } }) => console.log(
        `\n${method.bold.blue}`, uri.blue, "\n", body ? body : ''
    ),
    response: ({ ok, status, statusText, content }) => console.log(
        ok ? `${status} ${statusText.bold}`.green : `${status} ${statusText.bold}`.red,
        content
    ),
    debug: () => {},
    unknown: message => console.log('unknown', message),
});

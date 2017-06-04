const createLogHandler = handlers => message => {
    if (handlers.hasOwnProperty(message.type)) {
        return handlers[message.type](message);
    }

    return handlers['unknown'](message);
};

export const screenLogger = createLogHandler({
    action: message => createLogHandler({
        'create-api': action => {},
        'remove-api': action => {},
        'update-api': action => {},
        'add-api-plugin': action => {},
        'remove-api-plugin': action => {},
        'update-api-plugin': action => {},
        'add-global-plugin': action => {},
        'remove-global-plugin': action => {},
        'update-global-plugin': action => {},
        'create-customer': action => {},
        'update-customer': action => {},
        'remove-customer': action => {},
        'add-customer-credential': action => {},
        'update-customer-credential': action => {},
        'remove-customer-credential': action => {},
        'add-customer-acls': action => {},
        'remove-customer-acls': action => {},

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
    response: ({ ok, status, statusText }) => console.log(
        ok ? `${status} ${statusText.bold}`.green : `${status} ${statusText.bold}`.red,
    ),
    'response-content': ({ content }) => console.log(content),
    'response-error': ({ statusText, content }) => console.error(`${statusText.bold}`.red, content),
    debug: () => {},
    unknown: message => console.log('unknown', message),
});

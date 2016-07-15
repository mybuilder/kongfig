'use strict';

const schema = {
    'oauth2': {
        id: 'client_id'
    },
    'key-auth': {
        id: 'key'
    },
    'jwt': {
        id: 'key'
    },
    'basic-auth': {
        id: 'username'
    },
    'hmac-auth': {
        id: 'username'
    }
};

export function getSupportedCredentials() {
    return Object.keys(schema);
}

export function getSchema(name) {
    if (false === schema.hasOwnProperty(name)) {
        throw new Error(`Unknown credential "${name}"`);
    }

    return schema[name];
}

export function addSchema(name, val){
    if (schema.hasOwnProperty(name)){
        throw new Error(`There is already a schema with name '${name}'`);
    }
    if (!val || !val.hasOwnProperty('id')){
        throw new Error(`Credential schema ${name} should have a property named "id"`);
    }
    schema[name] = val;
}

export function addSchemasFromOptions(opts){
    if (!opts || opts.length === 0) return;

    opts.forEach(val => {
        var vals = val.split(':');
        if (vals.length != 2) {
            throw new Error(`Use <pluginname>:<keyname> format in ${val}`);
        }
        addSchema(vals[0], {id: vals[1]});
    });
}

export function addSchemasFromConfig(config){
    if (!config.credentialSchemas) return;

    for (let key in config.credentialSchemas){
        addSchema(key, config.credentialSchemas[key]);
    }
}

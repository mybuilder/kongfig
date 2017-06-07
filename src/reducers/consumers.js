import { parseApiPostV10, parsePlugin, parseConsumer, parseAcl, parseGlobalPlugin } from '../readKongApi';


const acls = (state, log) => {
    const { params: { type, endpoint: { params } }, content } = log;

    switch (type) {
    case 'add-customer-acls': return [ ...state, parseAcl(content)];
    case 'remove-customer-acls': return state.filter(acl => acl._info.id !== params.aclId);
    default: return state;
    }
}

// the implementation in the readKongApi is not compatible
// because the payload doesn't contain the plugin name
const parseCredential = (name, { consumer_id, id, created_at, ...attributes }) => {
    return {
        name,
        attributes,
        _info: { id, consumer_id, created_at }
    }
}

const credentials = (state, log) => {
    const { params: { type, endpoint: { params } }, content } = log;

    switch (type) {
    case 'add-customer-credential': return [ ...state, parseCredential(params.plugin, content) ];
    case 'remove-customer-credential': return state.filter(credential => credential._info.id !== params.credentialId);
    case 'update-customer-credential': return state.map(state => {
        if (state._info.id !== params.credentialId) {
            return state;
        }

        return parseCredential(params.plugin, content);
    })
    default: return state;
    }
}

const customer = (state, log) => {
    const { params: { type, endpoint: { params } }, content } = log;

    switch (type) {
    case 'create-customer': return {
        ...parseConsumer(content),
        acls: [],
        credentials: []
    };
    case 'update-customer': return {
        ...state,
        ...parseConsumer(content),
    };

    case 'remove-customer-acls':
    case 'add-customer-acls':
        if (state._info.id !== params.consumerId) {
            return state;
        }

        return {
            ...state,
            acls: acls(state.acls, log)
        };

    case 'update-customer-credential':
    case 'remove-customer-credential':
    case 'add-customer-credential':
        if (state._info.id !== params.consumerId) {
            return state;
        }

        return {
            ...state,
            credentials: credentials(state.credentials, log),
        };
    default: return state;
    }
};

export default (state = [], log) => {
    if (log.type !== 'response') {
        return state;
    }

    const { params: { type, endpoint: { params } }, content } = log;

    switch (type) {
    case 'create-customer': return [...state, customer(undefined, log)];
    case 'remove-customer': return state.filter(consumer => consumer._info.id !== params.consumerId);

    case 'add-customer-credential':
    case 'update-customer-credential':
    case 'remove-customer-credential':
    case 'add-customer-acls':
    case 'remove-customer-acls':
    case 'update-customer': return state.map(state => {
        if (state._info.id !== params.consumerId) {
            return state;
        }

        return customer(state, log);
    });
    default: return state;
    }
};

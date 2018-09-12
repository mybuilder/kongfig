import { parseCertificates } from '../parsers/certificates';

const sni = (state, log) => {
    const { params: { type, endpoint: { params, body } }, content } = log;

    if (state._info.id != content.certificate.id) {
        return state;
    }

    switch (type) {
        case 'remove-certificate-sni': return { ...state, snis: state.snis.filter(x => x.name !== content.name) };
        case 'add-certificate-sni': return { ...state, snis: [...state.snis, { name: content.name }] };
        default: state;
    }

    return state;
}

export default (state = [], log) => {
    if (log.type !== 'response') {
        return state;
    }

    const { params: { type, endpoint: { params, body } }, content } = log;

    switch (type) {
        case 'create-certificate': return [...state, ...parseCertificates([content])];

        case 'remove-certificate-sni':
        case 'add-certificate-sni': return state.map(state => sni(state, log));
        default: return state;
    }
};

export const parseCertificates = certs => certs.map(({ cert, key, snis, ..._info }) => ({
    cert,
    key,
    snis: (snis || []).map(name => ({ name })),
    _info,
}));

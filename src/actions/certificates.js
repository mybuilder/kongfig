export const addCertificate = ({ key, cert }) => ({
    type: 'create-certificate',
    endpoint: { name: 'certificates' },
    method: 'POST',
    body: { key, cert },
});

export const removeCertificate = certificateId => ({
    type: 'remove-certificate',
    endpoint: { name: 'certificate', params: { certificateId } },
    method: 'DELETE',
});

export const addCertificateSNI = (ssl_certificate_id, name) => ({
    type: 'add-certificate-sni',
    endpoint: { name: 'certificate-snis' },
    method: 'POST',
    body: { name, ssl_certificate_id },
});

export const removeCertificateSNI = sniName => ({
    type: 'remove-certificate-sni',
    endpoint: { name: 'certificate-sni', params: { sniName } },
    method: 'DELETE',
});

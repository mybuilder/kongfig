export default function createRouter(host, https) {
    const protocol = https ? 'https' : 'http';
    const adminApiRoot = `${protocol}://${host}`;
    return ({name, params}) => {
        switch (name) {
            case 'apis': return `${adminApiRoot}/apis`;
            case 'api': return `${adminApiRoot}/apis/${params.name}`;
            case 'api-plugins': return `${adminApiRoot}/apis/${params.apiId}/plugins`;
            case 'api-plugin': return `${adminApiRoot}/apis/${params.apiId}/plugins/${params.pluginId}`;
            case 'consumers': return `${adminApiRoot}/consumers`;
            case 'consumer': return `${adminApiRoot}/consumers/${params.consumerId}`;
            case 'consumer-credentials': return `${adminApiRoot}/consumers/${params.consumerId}/${params.plugin}`;
            case 'consumer-credential': return `${adminApiRoot}/consumers/${params.consumerId}/${params.plugin}/${params.credentialId}`;
            case 'consumer-acls': return `${adminApiRoot}/consumers/${params.consumerId}/acls`;
            case 'consumer-acl': return `${adminApiRoot}/consumers/${params.consumerId}/acls/${params.aclId}`;

            case 'plugins': return `${adminApiRoot}/plugins`;
            case 'plugin': return `${adminApiRoot}/plugins/${params.pluginId}`;
            case 'plugins-enabled': return `${adminApiRoot}/plugins/enabled`;
            case 'plugins-scheme': return `${adminApiRoot}/plugins/schema/${params.plugin}`;

            case 'upstreams': return `${adminApiRoot}/upstreams`;
            case 'upstream': return `${adminApiRoot}/upstreams/${params.name}`;
            case 'upstream-targets': return `${adminApiRoot}/upstreams/${params.upstreamId}/targets`;
            // Note: this uri must end with a slash for kong version 11
            case 'upstream-targets-active': return `${adminApiRoot}/upstreams/${params.upstreamId}/targets/active/`;

            case 'certificates': return `${adminApiRoot}/certificates`;
            case 'certificate': return `${adminApiRoot}/certificates/${params.certificateId}`;
            case 'certificate-snis': return `${adminApiRoot}/snis/`;
            case 'certificate-sni': return `${adminApiRoot}/snis/${params.sniName}`;

            case 'root': return `${adminApiRoot}`;

            default:
                throw new Error(`Unknown route "${name}"`);
        }
    };
}

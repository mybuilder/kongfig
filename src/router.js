export default function createRouter(host, https) {
    const protocol = https ? 'https' : 'http';
    const adminApiRoot = `${protocol}://${host}`;
    return ({name, params}) => {
        switch (name) {
            case 'apis': return `${adminApiRoot}/apis`;
            case 'api': return `${adminApiRoot}/apis/${params.name}`;
            case 'api-plugins': return `${adminApiRoot}/apis/${params.apiName}/plugins`;
            case 'api-plugin': return `${adminApiRoot}/apis/${params.apiName}/plugins/${params.pluginId}`;
            case 'consumers': return `${adminApiRoot}/consumers`;
            case 'consumer': return `${adminApiRoot}/consumers/${params.username}`;
            case 'consumer-credentials': return `${adminApiRoot}/consumers/${params.username}/${params.plugin}`;
            case 'consumer-credential': return `${adminApiRoot}/consumers/${params.username}/${params.plugin}/${params.credentialId}`;

            case 'plugins-enabled': return `${adminApiRoot}/plugins/enabled`;
            case 'plugins-scheme': return `${adminApiRoot}/plugins/schema/${params.plugin}`;

            default:
                throw new Error(`Unknown route "${name}"`);
        }
    };
}

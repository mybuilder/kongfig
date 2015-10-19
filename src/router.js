export default function createRouter(host) {
    return ({name, params}) => {
        switch (name) {
            case 'apis': return `http://${host}/apis`;
            case 'api': return `http://${host}/apis/${params.name}`;
            case 'api-plugins': return `http://${host}/apis/${params.apiName}/plugins`;
            case 'api-plugin': return `http://${host}/apis/${params.apiName}/plugins/${params.pluginId}`;
            case 'consumers': return `http://${host}/consumers`;
            case 'consumer': return `http://${host}/consumers/${params.username}`;
            case 'consumer-credentials': return `http://${host}/consumers/${params.username}/${params.plugin}`;
            case 'consumer-credential': return `http://${host}/consumers/${params.username}/${params.plugin}/${params.credentialId}`;

            default:
                throw new Error(`Unknown route "${name}"`);
        }
    };
}

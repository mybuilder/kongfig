import prettyjson from 'prettyjson';
import yaml from 'js-yaml';

export function pretty(format) {
    switch (format) {
        case 'json': return config => prettyJson(removeInfo(config));
        case 'yaml': return config => prettyYaml(removeInfo(config));
        case 'yml': return config => prettyYaml(removeInfo(config));
        case 'screen': return prettyScreen;
        default:
            throw new Error('Unknown --format ' + format);
    }
}

export function prettyScreen(config) {
    return prettyjson.render(config, {});
}

export function prettyJson(config) {
    return JSON.stringify(config, null, '  ');
}

export function prettyYaml(config) {
    return yaml.safeDump(config);
}

export function removeInfo(config) {
    return JSON.parse(JSON.stringify(config, (key, value) => {
        if (key == '_info') {
            return undefined;
        }

        return value;
    }));
}

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const log = {
    info: message => console.log(message.green),
    error: message => console.error(message.red)
}

export default (configPath) => {
    if (!fs.existsSync(configPath)) {
        log.error(`Supplied --path '${configPath}' doesn't exist`.red);
        return process.exit(1);
    }

    if(/(\.yml)|(\.yaml)/.test(configPath)) {
        return yaml.safeLoad(fs.readFileSync(configPath));
    }

    if (/(\.json)/.test(configPath)) {
        return JSON.parse(fs.readFileSync(configPath));
    }

    if (/(\.js)/.test(configPath)) {
        try {
            let config = require(resolvePath(configPath));

            if (config === null || typeof config !== 'object' || Object.keys(config).length == 0) {
                log.error('Config file must export an object!\n' + CONFIG_SYNTAX_HELP);

                return process.exit(1);
            }

            return config;
        } catch (e) {
            if (e.code === 'MODULE_NOT_FOUND' && e.message.indexOf(configPath) !== -1) {
                log.error('File %s does not exist!', configPath);
            } else {
                log.error('Invalid config file!\n  ' + e.stack);
            }

            return process.exit(1);
        }
    }
}

function resolvePath(configPath) {
    if (path.isAbsolute(configPath)) {
        return configPath;
    }

    return path.resolve(process.cwd(), configPath);
}

const CONFIG_SYNTAX_HELP =
  '  module.exports = {\n' +
  '    // your config\n' +
  '  };\n';

import execute from 'core';
import loadConfig from 'fileUtils';
import mergeConfig from 'mergeUtils';
import adminApi from 'adminApi';
import fs from 'fs';
import colors from 'colors';

const argv = require('minimist')(process.argv.slice(3), {string: ['path', 'host', 'override']});

if (!argv.path) {
    console.log('--path to the config file is required'.red);
    process.exit(1);
}

if (!fs.existsSync(argv.path)) {
    console.log(`Supplied --path '${argv.path}' doesn't exist`.red);
    process.exit(1);
}

var config = loadConfig(argv.path);

var host = argv.host || config.host;

if (!host) {
    console.log('Kong admin host must be specified in config or --host'.red);
    process.exit(1);
}

var overrideConfig = {};

if (argv.override) {
    if (!fs.existsSync(argv.override)) {
        console.log(`--override config file doesn't exist`.red);
        process.exit(1);
    }

    overrideConfig = loadConfig(argv.override);
}

var finalConfig = mergeConfig(config, overrideConfig);

execute(finalConfig, adminApi(host))
    .catch(error => {
        console.log(`${error}`.red);
        process.exit(1);
    });

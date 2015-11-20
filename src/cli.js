import execute from './core';
import adminApi from './adminApi';
import colors from 'colors';
import configLoader from './configLoader';

const argv = require('minimist')(process.argv.slice(2), { string: ['path', 'host'] });

if (!argv.path) {
    console.log('--path to the config file is required'.red);
    process.exit(1);
}

let config = configLoader(argv.path);

let host = argv.host || config.host;

if (!host) {
    console.log('Kong admin host must be specified in config or --host'.red);
    process.exit(1);
}

execute(config, adminApi(host))
    .catch(error => {
        console.log(`${error}`.red);
        process.exit(1);
    });

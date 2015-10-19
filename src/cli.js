import execute from 'core';
import adminApi from 'adminApi';
import fs from 'fs';
import colors from 'colors';

const argv = require('minimist')(process.argv.slice(2));

if (!argv.path) {
    throw new Error('--path to the config file is required');
}

var config = JSON.parse(fs.readFileSync(argv.path));

var host = argv.host || config.host;

if (!host) {
    throw new Error('Kong admin host must be specified in config or --host');
}

execute(config, adminApi(host))
    .catch(function(error) {
        console.log(('' + error).red);
        process.exit(1);
    });

import execute from 'core';
import adminApi from 'adminApi';
import fs from 'fs';
import colors from 'colors';
import yaml from 'js-yaml';

const argv = require('minimist')(process.argv.slice(2), { string: ['path', 'host'] });

if (!argv.path) {
    console.log('--path to the config file is required'.red);
    process.exit(1);
}

if (!fs.existsSync(argv.path)) {
    console.log(`Supplied --path '${argv.path}' doesn't exist`.red);
    process.exit(1);
}

var config = {};

if(/(\.yml)|(\.yaml)/.test(argv.path)) {
    config = yaml.safeLoad(fs.readFileSync(argv.path));
}
else {
    config = JSON.parse(fs.readFileSync(argv.path));
}

var host = argv.host || config.host;

if (!host) {
    console.log('Kong admin host must be specified in config or --host'.red);
    process.exit(1);
}

execute(config, adminApi(host))
    .catch(error => {
        console.log(`${error}`.red);
        process.exit(1);
    });

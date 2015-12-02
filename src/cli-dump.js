import readKongApi from './readKongApi';
import {pretty} from './prettyConfig';
import adminApi from './adminApi';
import colors from 'colors';

import program from 'commander';

program
    .version(require("../package.json").version)
    .option('-f, --format <value>', 'Export format [screen, json, yaml] (default: yaml)', /^(screen|json|yaml|yml)$/, 'yaml')
    .option('--host <value>', 'Kong admin host (default: localhost:8001)', 'localhost:8001')
    .parse(process.argv);

if (!program.host) {
    console.log('--host to the kong admin is required e.g. localhost:8001'.red);
    process.exit(1);
}

readKongApi(adminApi(program.host))
    .then(apis => {
        return {host: program.host, apis};
    })
    .then(pretty(program.format))
    .then(config => {
        process.stdout.write(config + '\n');
    })
    .catch(error => {
        console.log(`${error}`.red);
        process.exit(1);
    });

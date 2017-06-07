import readKongApi from './readKongApi';
import {pretty} from './prettyConfig';
import adminApi from './adminApi';
import colors from 'colors';
import requester from './requester';
import {repeatableOptionCallback} from './utils';
import {addSchemasFromOptions} from './consumerCredentials';
import mapConsumers from './mapConsumers';

import program from 'commander';

program
    .version(require("../package.json").version)
    .option('-f, --format <value>', 'Export format [screen, json, yaml] (default: yaml)', /^(screen|json|yaml|yml)$/, 'yaml')
    .option('-m, --map-consumers <value>', 'Specify consumer attribute to map consumer_id to when dumping. Can be either username or custom_id. (default: no mapping)', /^(username|custom_id)$/, false)
    .option('--host <value>', 'Kong admin host (default: localhost:8001)', 'localhost:8001')
    .option('--https', 'Use https for admin API requests')
    .option('--ignore-consumers', 'Ignore consumers in kong')
    .option('--header [value]', 'Custom headers to be added to all requests', (nextHeader, headers) => { headers.push(nextHeader); return headers }, [])
    .option('--credential-schema <value>', 'Add custom auth plugin in <name>:<key> format. Ex: custom_jwt:key. Repeat option for multiple custom plugins', repeatableOptionCallback, [])
    .parse(process.argv);

if (!program.host) {
    console.error('--host to the kong admin is required e.g. localhost:8001'.red);
    process.exit(1);
}

try {
    addSchemasFromOptions(program.credentialSchema);
} catch(e){
    console.error(e.message.red);
    process.exit(1);
}

let headers = program.header || [];

headers
    .map((h) => h.split(':'))
    .forEach(([name, value]) => requester.addHeader(name, value));

readKongApi(adminApi({ host: program.host, https: program.https }))
    .then(results => {
        return {host: program.host, https: program.https, headers, ...results};
    })
    .then(mapConsumers(program.ignoreConsumers, program.mapConsumers))
    .then(pretty(program.format))
    .then(config => {
        process.stdout.write(config + '\n');
    })
    .catch(error => {
        console.error(`${error}`.red, '\n', error.stack);
        process.exit(1);
    });

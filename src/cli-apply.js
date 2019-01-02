import execute from './core';
import adminApi from './adminApi';
import colors from 'colors';
import configLoader from './configLoader';
import program from 'commander';
import requester from './requester';
import {repeatableOptionCallback} from './utils';
import { screenLogger } from './logger';
import {addSchemasFromOptions, addSchemasFromConfig} from './consumerCredentials';

program
    .version(require("../package.json").version)
    .option('--path <value>', 'Path to the configuration file')
    .option('--host <value>', 'Kong admin host (default: localhost:8001)')
    .option('--https', 'Use https for admin API requests')
    .option('--no-cache', 'Do not cache kong state in memory')
    .option('--ignore-consumers', 'Do not sync consumers')
    .option('--header [value]', 'Custom headers to be added to all requests', (nextHeader, headers) => { headers.push(nextHeader); return headers }, [])
    .option('--credential-schema <value>', 'Add custom auth plugin in <name>:<key> format. Ex: custom_jwt:key. Repeat option for multiple custom plugins', repeatableOptionCallback, [])
    .option('--concurrency <value>', 'Limit concurrent requests (default: 8)', parseInt)
    .parse(process.argv);

if (!program.path) {
  console.error('--path to the config file is required'.red);
  process.exit(1);
}

try{
    addSchemasFromOptions(program.credentialSchema);
}catch(e){
    console.error(e.message.red);
    process.exit(1);
}

console.log(`Loading config ${program.path}`);

let config = configLoader(program.path);
let host = program.host || config.host || 'localhost:8001';
let https = program.https || config.https || false;
let ignoreConsumers = program.ignoreConsumers || !config.consumers || config.consumers.length === 0 || false;
let cache = program.cache;
let concurrency = program.concurrency || 8;

config.headers = config.headers || [];

let headers = new Map();
([...config.headers, ...program.header])
  .map((h) => h.split(':'))
  .forEach(([name, value]) => headers.set(name, value));

headers
  .forEach((value, name) => requester.addHeader(name, value));

if (!host) {
  console.error('Kong admin host must be specified in config or --host'.red);
  process.exit(1);
}

if (ignoreConsumers) {
    config.consumers = [];
}
else {
  try{
      addSchemasFromConfig(config);
  } catch(e) {
      console.error(e.message.red);
      process.exit(1);
  }
}

console.log(`Apply config to ${host}`.green);

execute(config, adminApi({host, https, ignoreConsumers, cache, concurrency}), screenLogger)
  .catch(error => {
      console.error(`${error}`.red, '\n', error.stack);
      process.exit(1);
  });

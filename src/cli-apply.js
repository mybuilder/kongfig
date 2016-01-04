import execute from './core';
import adminApi from './adminApi';
import colors from 'colors';
import configLoader from './configLoader';
import program from 'commander';

program
    .version(require("../package.json").version)
    .option('--path <value>', 'Path to the configuration file')
    .option('--host <value>', 'Kong admin host (default: localhost:8001)')
    .option('--https', 'Use https for admin API requests')
    .parse(process.argv);

if (!program.path) {
  console.log('--path to the config file is required'.red);
  process.exit(1);
}

let config = configLoader(program.path);
let host = program.host || config.host || 'localhost:8001';
let https = program.https || config.https || false;

if (!host) {
  console.log('Kong admin host must be specified in config or --host'.red);
  process.exit(1);
}

console.log(`Apply config to ${host}`.green);

execute(config, adminApi(host, https))
  .catch(error => {
      console.log(`${error}`.red, '\n', error.stack);
      process.exit(1);
  });

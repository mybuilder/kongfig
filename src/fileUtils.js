'use strict';

import fs from 'fs';
import yaml from 'js-yaml';

export default function loadConfig(path) {
    let config = {};

    if (/(\.yml)|(\.yaml)/.test(path)) {
        config = yaml.safeLoad(fs.readFileSync(path));
    }
    else {
        config = JSON.parse(fs.readFileSync(path));
    }

    return config;
};
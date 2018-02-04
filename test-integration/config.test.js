import execute from '../lib/core';
import { testAdminApi, exportToYaml, logger, getLog, getLocalState, tearDown } from './util';
import readKongApi, { parseApiPostV10, parsePlugin, parseConsumer, parseAcl, parseGlobalPlugin } from '../lib/readKongApi';
import configLoader from '../lib/configLoader';
import fs from 'fs';
import path from 'path';
import pad from 'pad';

beforeEach(tearDown);

const requestToCurl = (uri, method, body) => {
    switch (method) {
        case 'POST': return `$ curl -i -X POST -H "Content-Type: application/json" \\\n  --url ${uri} \\\n  --data '${JSON.stringify(body)}'`;
        default: return ``;
    }
};

const ignoreConfigOrder = state => ({
    ...state,
    apis: state.apis.sort((a, b) => a.name > b.name ? 1 : -1),
    consumers: state.consumers.sort((a, b) => a.username > b.username ? 1 : -1),
    plugins: state.plugins.sort((a, b) => a.attributes.config.minute - b.attributes.config.minute),
    upstreams: state.upstreams.map(upstream => ({
        ...upstream,
        targets: upstream.targets.sort((a, b) => a.target > b.target ? 1 : -1),
    })),
});

const codeBlock = (code, lang = '') => `\`\`\`${lang}\n${code}\n\`\`\``;
const title = text => `${text}\n${'-'.repeat(text.length)}`;
const header = (text, level = 2) => `${'#'.repeat(level)} ${text}`;
const append = (md, ...block) => block.reduce((md, block) => `${md}\n\n${block}`, md);
const replaceDashWithSpace = text => text.split('-').join(' ');

const curlExample = `For illustrative purpose a cURL calls would be the following`;

const addExampleFile = (configPath, filename, log) => {
    const head = append(title(replaceDashWithSpace(filename.replace('.example.yml', '')) + " example"), header('Config file'), codeBlock(fs.readFileSync(configPath), 'yaml'), header('Using curl'), curlExample);
    const content = getLog().reduce((content, log) => {
        switch (log.type) {
        case 'request': return append(content, header(replaceDashWithSpace(log.params.type), 3), codeBlock(requestToCurl(log.uri, log.params.method, log.params.body), 'sh'));
        case 'response': return append(content, codeBlock(`HTTP ${log.status} ${log.statusText}`), codeBlock(JSON.stringify(log.content, null, 2)));

        default: return content;
        }
    }, head);

    fs.writeFileSync(path.resolve(__dirname, '../examples', filename.replace('.yml', '.md')), content, "UTF-8", { 'flags': 'w+' });
};

fs.readdirSync(path.resolve(__dirname, './config')).forEach(filename => {
    it(`should apply ${filename}`, async () => {
        const configPath = path.resolve(__dirname, './config', filename);
        const config = configLoader(configPath);

        await execute(config, testAdminApi, logger);
        await execute(config, testAdminApi, logger); // all the actions should be no-op
        const kongState = ignoreConfigOrder(await readKongApi(testAdminApi));

        expect(getLog()).toMatchSnapshot();
        expect(exportToYaml(kongState)).toMatchSnapshot();
        expect(ignoreConfigOrder(getLocalState())).toEqual(kongState);

        if (filename.endsWith('example.yml')) {
            addExampleFile(configPath, filename, getLog());
        }
    });
});

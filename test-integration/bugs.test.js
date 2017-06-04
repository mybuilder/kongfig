import execute from '../lib/core';
import { testAdminApi, logger, ignoreKeys, getLog, tearDown } from './util';
import readKongApi from '../lib/readKongApi';

beforeEach(tearDown);

it('should allow updating a global plugin with no attributes', async () => {
    const config = {
        plugins: [{
            name: "cors",
            attributes: {
                enabled: true
            }
        }]
    };

    await execute(config, testAdminApi, logger);
    await execute(config, testAdminApi, logger);
    const kongState = await readKongApi(testAdminApi);

    expect(getLog()).toMatchSnapshot();
    expect(ignoreKeys(kongState, ['created_at'])).toMatchSnapshot();
});

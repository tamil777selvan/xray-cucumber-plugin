import _ from 'lodash';
import TagExpressionParser from '@cucumber/tag-expressions';

import { EXISTING_TICKETS, XRAY_TEST_SET_MAPPING, INIT_OPTIONS, XRAY_FIELD_IDS } from './types/types';

import { getExistingTickets } from './utils/jira.helper';
import { requestHelper } from './utils/request.helper';
import logger from './utils/logger';

const generateTestSetMapping = async (testSetMapping: XRAY_TEST_SET_MAPPING, existingTickets: EXISTING_TICKETS[]) => new Promise((resolve, reject) => {
    try {
        const tempTestSetMapping = testSetMapping;
        for (const [key, value] of Object.entries(tempTestSetMapping)) {
            const tagExpression = TagExpressionParser(value.tags);
            const tests = existingTickets.map((values: { labels: string[]; issueStatus: string; key: string; }) => {
                const tags = values.labels.map((tag) => `@${tag}`);
                if (tagExpression.evaluate(tags) && values.issueStatus !== 'Closed') {
                    return values.key;
                }
                return null;
            });
            tempTestSetMapping[key].tests = _.remove(tests);
        }
        resolve(tempTestSetMapping);
    } catch (e) {
        reject(e);
    }
});

export const syncTestSetMappings = async (options: INIT_OPTIONS & XRAY_FIELD_IDS) => {
    try {
        logger.info('XRAY: Process started to sync Test Sets');

        const existingTickets = _.remove(await getExistingTickets(options.jiraProtocol, options.jiraHost, options.jiraProject, options.xrayTestIssueType, options.xrayCucumberTestFieldId, options.xrayCucumberTestStepFieldId, options.headers));

        const testSetMapping = await generateTestSetMapping(options.testSetMappingDetails, existingTickets);

        for await (const value of Object.values(testSetMapping)) {
            let mappedData = [];
            const testSetId = _.get(value, 'testSetId');
            if (_.isArray(testSetId) && testSetId.length !== 0) {
                const tests = _.get(value, 'tests');
                const chunkLength = Math.ceil(tests.length / testSetId.length);
                const chunkData: any = _.chunk(tests, chunkLength);
                mappedData = testSetId.map((setId: string, index: string | number) => ({
                    url: `${options.jiraProtocol}://${options.jiraHost}/rest/api/2/issue/${setId}`,
                    tests: chunkData[index],
                    setId: setId
                }));
            } else {
                throw new Error('testSetId provided in testSetMappingDetails should be an array & should not be empty');
            }

            for await (const data of mappedData) {
                const body = {
                    update: {
                        [options.xrayTestSetFieldId]: [
                            {
                                set: data.tests
                            }
                        ]
                    }
                };
                await requestHelper.put(data.url, body, options.headers);
                logger.info(`XRAY: Test Set updated for ${data.setId}`);
            }
        }

        logger.info('XRAY: Test Sets Syncing process completed');

    } catch (error) {
        logger.error(`XRAY: ${error.message}`);
        throw error;
    }
}

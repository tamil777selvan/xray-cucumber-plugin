// @ts-nocheck
import _ from 'lodash';
import TagExpressionParser from '@cucumber/tag-expressions';

import { Options } from './types/types';

import { getExistingTickets } from './utils/jira_xray_helper';
import { requestHelper } from './utils/request_helper';
import logger from './utils/logger';

const generateTestSetMapping = async (testSetMapping: object, existingTickets: any) => new Promise((resolve, reject) => {
    try {
        const tempTestSetMapping: any = testSetMapping;
        for (const [key, value] of Object.entries(tempTestSetMapping)) {
            const tagExpression = TagExpressionParser(value.tags);
            const tests = existingTickets.map((values: { labels: any[]; issueStatus: string; key: any; }) => {
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
})

export const syncTestSetMappings = async (options: Options) => {
    try {
        logger.info('XRAY: Process started to sync Test Sets...');

        const existingTickets = _.remove(await getExistingTickets(options.jiraHost, options.jiraProject, options.xrayScenarioType.id, options.xrayStepId, options.headers));

        const testSetMapping: any = await generateTestSetMapping(options.testSetMappingDetails, existingTickets);

        for await (const value of Object.values(testSetMapping)) {
            let mappedData = [];
            const testSetId = _.get(value, 'testSetId');
            if (_.isArray(testSetId) && testSetId.length !== 0) {
                const tests = _.get(value, 'tests');
                const chunkLength = Math.ceil(tests.length / testSetId.length);
                const chunkData: any = _.chunk(tests, chunkLength);
                mappedData = testSetId.map((setId: string, index: string | number) => ({
                    url: `https://${options.jiraHost}/rest/api/2/issue/${setId}`,
                    tests: chunkData[index],
                    setId: setId
                }));
            } else {
                throw new Error('testSetId provided in testSetMappingDetails should be an array & should not be empty');
            }

            for await (const data of mappedData) {
                const body = {
                    update: {
                        [options.xrayTestSetId]: [
                            {
                                set: data.tests
                            }
                        ]
                    }
                };
                await requestHelper.put(data.url, body, options.headers);
                logger.info(`XRAY: Test Set updated for ${data.setId}...`);
            }
        }

        logger.info('XRAY: Test Sets Syncing process completed...');

    } catch (error) {
        logger.error(`XRAY: ${error.message}`);
        throw error;
    }
}

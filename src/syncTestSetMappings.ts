import _ from 'lodash';
import TagExpressionParser from '@cucumber/tag-expressions';

import { EXISTING_TICKET, XRAY_TEST_SET_MAPPING, INIT_OPTIONS, XRAY_FIELD_IDS } from './types/types.js';
import { getExistingTickets } from './utils/jira.helper.js';
import { requestHelper } from './utils/request.helper.js';
import logger from './utils/logger.js';

/**
 * Generates test set mappings based on tag expressions.
 *
 * @param {XRAY_TEST_SET_MAPPING} testSetMapping - Test set mapping details.
 * @param {EXISTING_TICKET[]} existingTickets - Existing Jira tickets.
 * @returns {XRAY_TEST_SET_MAPPING} - Resolves with the updated test set mappings.
 * @throws {Error} - If an error occurs during processing.
 */
const generateTestSetMapping = (testSetMapping: XRAY_TEST_SET_MAPPING, existingTickets: EXISTING_TICKET[]): XRAY_TEST_SET_MAPPING => {
    const tempTestSetMapping = { ...testSetMapping };

    for (const [key, value] of Object.entries(tempTestSetMapping)) {
        const tagExpression = TagExpressionParser(value.tags);

        const tests = existingTickets.map((ticket) => {
            const tags = ticket.labels.map((tag) => `@${tag}`);
            if (tagExpression.evaluate(tags) && ticket.issueStatus !== 'Closed') {
                return ticket.key;
            }
            return null;
        });

        tempTestSetMapping[key].tests = _.remove(tests);
    }

    return tempTestSetMapping;
};

/**
 * Synchronize test set mappings with existing Jira tickets.
 *
 * @param {INIT_OPTIONS & XRAY_FIELD_IDS} options - Initialization and field options.
 * @returns {Promise<void>} - Resolves after completing the synchronization.
 * @throws {Error} - If an error occurs during synchronization.
 */
export const syncTestSetMappings = async (options: INIT_OPTIONS & XRAY_FIELD_IDS): Promise<void> => {
    try {
        logger.info('XRAY: Process started to sync Test Sets');

        const existingTickets = _.remove(
            await getExistingTickets(
                options.jiraProtocol,
                options.jiraHost,
                options.jiraProject,
                options.xrayTestIssueType,
                options.xrayCucumberTestFieldId,
                options.xrayCucumberTestStepFieldId,
                options.headers
            )
        );

        const testSetMapping = generateTestSetMapping(options.testSetMappingDetails, existingTickets);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const [testSetName, value] of Object.entries(testSetMapping)) {
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
};

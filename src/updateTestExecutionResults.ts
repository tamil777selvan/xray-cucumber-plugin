import _ from 'lodash';
import { readFile } from 'fs/promises';

import logger from './utils/logger.js';
import { TEST_EXECUTION_OPTION, XRAY_FIELD_IDS } from './types/types.js';
import { getAllFilesInDir } from './utils/files.js';
import { getExistingTickets, getTestExecutionIds, updateExecutionResult } from './utils/jira.helper.js';

/**
 * Parse Cucumber JSON reports to extract test results.
 *
 * @param {string} jsonReportFolderPath - Path to the folder containing JSON reports.
 * @returns {Promise<object>} - Resolves with the extracted test results.
 * @throws {Error} - If an error occurs during parsing.
 */
const parseCucumberReports = async (jsonReportFolderPath: string): Promise<object> => {
    try {
        const files = await getAllFilesInDir(jsonReportFolderPath, '.json');
        const results = {};

        for (const file of files) {
            const raw = await readFile(file);
            JSON.parse(raw.toString()).forEach((data: any) => {
                const elements = _.get(data, 'elements');

                elements.forEach((element) => {
                    const scenarioName = _.get(element, 'name');
                    const steps = _.get(element, 'steps');
                    const stepsResult = steps.map((step: any) => _.get(step, 'result.status'));

                    let testResult = 'PASS';

                    if (stepsResult.includes('failed')) {
                        testResult = 'FAIL';
                    }

                    results[scenarioName] = testResult;
                });

                return results;
            });
        }

        return [results];
    } catch (error) {
        throw new Error(error);
    }
};

/**
 * Update test execution results in Jira based on Cucumber reports or parsed test results.
 *
 * @param {TEST_EXECUTION_OPTION & XRAY_FIELD_IDS} options - Execution and field options.
 * @returns {Promise<void>} - Resolves after updating the test execution results.
 * @throws {Error} - If an error occurs during the update process.
 */
export const updateTestExecutionResults = async (options: TEST_EXECUTION_OPTION & XRAY_FIELD_IDS): Promise<void> => {
    try {
        logger.info('XRAY: Process started to update Test Execution Result');

        let testExecutionResults = undefined;

        if (options.cucumberJsonReportFolderPath) {
            testExecutionResults = await parseCucumberReports(options.cucumberJsonReportFolderPath);
        } else if (options.parsedTestResultDetails) {
            testExecutionResults = options.parsedTestResultDetails;
        } else {
            throw new Error('Either cucumberJsonReportFolderPath or parsedTestResultDetails is required for updating test execution results');
        }

        if (options.skipUpdatingFailedCase) {
            testExecutionResults = _.remove(testExecutionResults, (val) => _.lowerCase(_.values(val).toString()) !== 'fail');
        }

        // Get all tickets
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

        const optimizedExistingTickets = existingTickets.map((ticket) => {
            const obj = {};
            obj[ticket.summary.toString().replace(/[^a-zA-Z0-9-:,()]/g, '')] = ticket.key;
            return obj;
        });

        // Get all execution Id's
        const executionIds = [];

        for (const executionId of options.testExecutionIds) {
            executionIds.push(
                await getTestExecutionIds(options.jiraProtocol, options.jiraHost, executionId, options.xrayTestExecutionFieldId, options.headers)
            );
        }

        for (const [key, value] of Object.entries(_.head(testExecutionResults))) {
            const scenarioName = key;
            const status = value;

            const optimizedExecutionIds = _.flattenDeep(executionIds).map((id) => _.invert(id));

            const ticketId = _.values(_.find(optimizedExistingTickets, scenarioName.replace(/[^a-zA-Z0-9-:,()]/g, '')));

            if (ticketId.length === 1) {
                const executionId = _.remove(_.keys(_.find(optimizedExecutionIds, ticketId.toString())), (val) => val !== ticketId.toString());

                if (executionId.length === 1) {
                    await updateExecutionResult(options.jiraProtocol, options.jiraHost, executionId.toString(), status, options.headers);
                    logger.info(`XRAY: Test Execution Result updated for ${ticketId.toString()}`);
                }
                if (executionId.length === 0) {
                    logger.warn(`XRAY: Skipping result update as ${scenarioName} not found in test execution`);
                }
            }
            if (ticketId.length === 0) {
                logger.warn(`XRAY: Skipping result update as ${scenarioName} not found in xray tests`);
            }
        }

        logger.info('XRAY: Test Execution Result update process completed');
    } catch (error) {
        logger.error(`XRAY: ${error.message}`);
        return;
    }
};

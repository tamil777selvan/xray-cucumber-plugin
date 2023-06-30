import _ from 'lodash';
import { readFile } from 'fs/promises';

import logger from './utils/logger';
import { TEST_EXECUTION_OPTION, XRAY_FIELD_IDS } from './types/types';
import { getAllFilesInDir } from './utils/files';
import { getExistingTickets, getTestExecutionIds, updateExecutionResult } from './utils/jira.helper';

const parseCucumberReports = async (jsonReportFolderPath: string) => {
    try {
        const files = await getAllFilesInDir(jsonReportFolderPath, '.json');
        const results = {};
        for await (const file of files) {
            const raw = await readFile(file);
            JSON.parse(raw.toString()).forEach((data: any) => {
                const elements = _.get(data, 'elements');
                elements.forEach((element) => {
                    const scenarioName = _.get(element, 'name');
                    const steps = _.get(element, 'steps');
                    const stepsResult = steps.map((step: any) => {
                        return _.get(step, 'result.status');
                    });
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
}

export const updateTestExecutionResults = async (options: TEST_EXECUTION_OPTION & XRAY_FIELD_IDS) => {
    try {
        logger.info('XRAY: Process started to update Test Execution Result');

        let testExecutionResults = undefined;

        if (options.cucumberJsonReportFolderPath) {
            testExecutionResults = await parseCucumberReports(options.cucumberJsonReportFolderPath)
        } else if (options.parsedTestResultDetails) {
            testExecutionResults = options.parsedTestResultDetails;
        } else {
            throw new Error('Either cucumberJsonReportFolderPath or parsedTestResultDetails is required for updating test execution results');
        }

        if (options.skipUpdatingFailedCase) {
            testExecutionResults = _.remove(testExecutionResults, (val) => _.lowerCase(_.values(val).toString()) !== 'fail');
        }

        // Get all tickets
        const existingTickets = _.remove(await getExistingTickets(options.jiraProtocol, options.jiraHost, options.jiraProject, options.xrayTestIssueType, options.xrayCucumberTestFieldId, options.xrayCucumberTestStepFieldId, options.headers));

        const optimisedExistingTickets = existingTickets.map((ticket) => {
            const obj = {};
            obj[ticket.summary.toString().replace(/[^a-zA-Z0-9-:,()]/g, '')] = ticket.key;
            return obj;
        });

        // Get all execution Id's
        const executionIds = [];
        for await (const executionId of options.testExecutionIds) {
            executionIds.push(await getTestExecutionIds(options.jiraProtocol, options.jiraHost, executionId, options.xrayTestExecutionFieldId, options.headers));
        }

        for await (const [key, value] of Object.entries(_.head(testExecutionResults))) {
            const scenarioName = key;
            const status = value;

            const optimisedExecutionIds = (_.flattenDeep(executionIds)).map((id) => _.invert(id));

            const ticketId = _.values(_.find(optimisedExistingTickets, scenarioName.replace(/[^a-zA-Z0-9-:,()]/g, '')));

            if (ticketId.length === 1) {
                const executionId = _.remove(_.keys(_.find(optimisedExecutionIds, ticketId.toString())), val => val !== ticketId.toString());
                if (executionId.length === 1) {
                    await updateExecutionResult(options.jiraProtocol, options.jiraHost, executionId.toString(), status, options.headers);
                    logger.info(`XRAY: Test Execution Result updated for ${ticketId.toString()}`);
                } else {
                    logger.warn(`XRAY: Skipping result update as multiple Execution Id found for ${scenarioName}`);
                }
            } else {
                logger.warn(`XRAY: Skipping result update as no / multiple tickets found for ${scenarioName}`);
            }
        }
        logger.info('XRAY: Test Execution Result update process completed');
    } catch (error) {
        logger.error(`XRAY: ${error.message}`);
        return;
    }
}

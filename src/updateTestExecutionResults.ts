// @ts-nocheck
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import denodeify from 'denodeify';
import recursiveReadDir from 'recursive-readdir';

import logger from './utils/logger';
import { TestExecutionResults } from './types/types';

const readdir = denodeify(recursiveReadDir);
const readFile = denodeify(fs.readFile);

import { getExistingTickets, getTestExecutionIds, updateExecutionResult } from './utils/jira_xray_helper';

const parseCucumberReports = async (jsonReportPath: string) => {
    const basePath = path.resolve(jsonReportPath);
    const files: string[] = await readdir(path.resolve(basePath), ['!*.json']);

    for await (const file of files) {
        const rawData = await readFile(file).then((raw: string) => raw);
        const parsedData = JSON.parse(rawData).map((data) => {
            const elements = _.get(data, 'elements');
            const newElements = elements.map((element) => {
                const scenarioName = _.get(element, 'name');
                const steps = _.get(element, 'steps');
                const stepsResult = steps.map((step) => {
                    return _.get(step, 'result.status');
                });
                let testResult = 'PASS';
                if (stepsResult.includes('failed')) {
                    testResult = 'FAIL';
                }
                return { [scenarioName]: testResult };
            });
            return newElements;
        });
        return _.flattenDeep(parsedData);
    }
}

export const updateTestExecutionResults = async (options: TestExecutionResults) => {
    try {
        logger.info('XRAY: Process started to update Test Execution Result...');

        const testDetails = await parseCucumberReports(options.cucumberJsonReportFolder);

        // Get all tickets
        const existingTickets = _.remove(await getExistingTickets(options.jiraHost, options.jiraProject, options.xrayScenarioType.id, options.xrayStepId, options.headers));
        const optimisedExistingTickets = existingTickets.map((ticket) => {
            const obj = {};
            obj[ticket.summary.toString().replace(/[^a-zA-Z0-9-:,()]/g, '')] = ticket.key;
            return obj;
        });
        // Get all execution Id's
        const executionIds = [];
        for await (const execId of options.testExecutionIds) {
            executionIds.push(await getTestExecutionIds(options.jiraHost, execId, options.xrayTestExecutionId, options.headers));
        }

        for await (const details of testDetails) {
            const scenarioName = _.keys(details).toString();
            const status = _.values(details).toString();

            const optimisedExecutionIds = (_.flattenDeep(executionIds)).map((id) => _.invert(id));
            const ticketId = _.values(_.find(optimisedExistingTickets, scenarioName.replace(/[^a-zA-Z0-9-:,()]/g, '')));
            if (ticketId.length === 1) {
                const executionId = _.remove(_.keys(_.find(optimisedExecutionIds, ticketId.toString())), val => val !== ticketId.toString());
                if (executionId.length === 1) {
                    await updateExecutionResult(options.jiraHost, executionId.toString(), status, options.headers);
                    logger.info(`XRAY: Test Execution Result updated for ${ticketId.toString()}...`);
                } else {
                    logger.warn(`XRAY: Skipping result update as multiple Execution Id found for ${scenarioName}...`);
                }
            } else {
                logger.warn(`XRAY: Skipping result update as no / multiple tickets found for ${scenarioName}...`);
            }
        }

        logger.info('XRAY: Test Execution Result update process completed...');
    } catch (error) {
        logger.error(`XRAY: ${error.message}`);
        return;
    }
}

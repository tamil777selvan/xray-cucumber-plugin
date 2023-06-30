import _ from 'lodash';

import logger from './utils/logger';

import { INIT_OPTIONS, XRAY_FIELD_IDS } from './types/types';

import generateFeaturesToImport from './utils/featureFileParser';

import { getExistingTickets, createNewTicket, updateExistingTicket, getTransitionId, updateIssueTransitions } from './utils/jira.helper';

export const syncCucumberTests = async (options: INIT_OPTIONS & XRAY_FIELD_IDS) => {
    try {
        logger.info('XRAY: Process started to sync Cucumber Test Cases');

        const featureData = await generateFeaturesToImport(options.featureFolderPath, options.featureFolderFilter, options.featureTagFilter, options.scenarioDescriptionRegex, options.scenarioDescriptionRegexReplaceValue);

        const existingTickets = _.remove(await getExistingTickets(options.jiraProtocol, options.jiraHost, options.jiraProject, options.xrayTestIssueType, options.xrayCucumberTestFieldId, options.xrayCucumberTestStepFieldId, options.headers));

        for await (const data of featureData) {

            const { tags, scenarioType, scenarioName, scenarioSteps } = data;

            const optimisedScenarioName = scenarioName.toString().trim().replace(/[^a-zA-Z0-9-:,() ]/g, '');

            const labels = _.remove(tags.split(' ')).map((tag) => tag.substring(1)).sort();

            const labelsToAdd: { add?: string; remove?: string; }[] = labels.map((label) => ({ add: label }));

            const isTicketExists = _.filter(existingTickets, { summary: optimisedScenarioName });

            const existingIssueId = _.map(isTicketExists, 'issueId').toString();

            if (_.isEmpty(isTicketExists)) {
                // create new jira tickets if `${isTicketExists}` is empty
                const body = {
                    fields: {
                        issuetype: {
                            id: options.xrayTestId
                        },
                        project: {
                            key: options.jiraProject
                        },
                        priority: {
                            name: 'Medium'
                        },
                        summary: scenarioName,
                        labels,
                        [options.xrayTestTypeFieldId]: {
                            id: options.xrayTestTypeId
                        },
                        [options.xrayCucumberTestFieldId]: {
                            id: options.xrayCucumberTestTypeMappings[scenarioType]
                        },
                        [options.xrayCucumberTestStepFieldId]: scenarioSteps
                    }
                }
                const response = await createNewTicket(options.jiraProtocol, options.jiraHost, body, options.headers);
                logger.info(response);
            } else if (isTicketExists.length === 1) {
                // manipulate existing jira tickets if `${isTicketExists}` has one entry

                const labelsToRemove: { add?: string; remove?: string; }[] = _.flattenDeep(_.map(isTicketExists, 'labels')).map((label) => ({ remove: label }));

                const existingLabels = _.flattenDeep(_.map(isTicketExists, 'labels')).sort();

                const existingSteps = _.flattenDeep(_.map(isTicketExists, 'xrayCucumberTestStep'));

                const existingScenarioType = _.flattenDeep(_.map(isTicketExists, 'xrayCucumberTestType'));

                if (!_.isEqual(labels, existingLabels) || !_.isEqual([scenarioSteps], existingSteps) || !_.isEqual([scenarioType], existingScenarioType)) {
                    const body = {
                        fields: {
                            [options.xrayCucumberTestFieldId]: {
                                id: options.xrayCucumberTestTypeMappings[scenarioType]
                            },
                            [options.xrayCucumberTestStepFieldId]: scenarioSteps
                        },
                        update: {
                            labels: _.union(labelsToRemove, labelsToAdd)
                        }
                    }
                    await updateExistingTicket(options.jiraProtocol, options.jiraHost, existingIssueId, body, options.headers);
                    logger.info(`XRAY: Existing ticket ${_.map(isTicketExists, 'key').join(', ')} got updated`);
                } else {
                    logger.info(`XRAY: Skipping ticket modifications for ${_.map(isTicketExists, 'key').join(', ')} as it's already in updated state`);
                }

                const existingStatus: string[] = _.flattenDeep(_.map(isTicketExists, 'issueStatus'));

                if (existingStatus.includes('Closed')) {
                    const inUseTransitionId = await getTransitionId(options.jiraProtocol, options.jiraHost, existingIssueId, ['In Use', 'Reopen Issue'], options.headers);
                    const body = {
                        update: {
                            comment: [
                                {
                                    add: {
                                        body: 'Ticket is reopened by automated XRAY process'
                                    }
                                }
                            ]
                        },
                        transition: {
                            id: inUseTransitionId.toString()
                        }
                    }
                    await updateIssueTransitions(options.jiraProtocol, options.jiraHost, existingIssueId, body, options.headers);
                    logger.info(`XRAY: Re Opened ${_.map(isTicketExists, 'key').join(', ')} as it's in closed state`);
                }
            } else if (isTicketExists.length > 1) {
                // Multiple tickets found for same scenario, so closing all apart from last created one
                logger.warn(`XRAY: Scenario "${optimisedScenarioName}" has duplicates ticket id's "${_.map(isTicketExists, 'key').join(', ')}"...`);
                const ticketsToClose = _.initial(_.map(isTicketExists, 'key').sort());

                for await (const ticket of ticketsToClose) {
                    const closedTransitionId = await getTransitionId(options.jiraProtocol, options.jiraHost, existingIssueId, ['Closed', 'Close Issue'], options.headers);
                    const body = {
                        update: {
                            comment: [
                                {
                                    add: {
                                        body: 'Ticket is closed by automated XRAY process'
                                    }
                                }
                            ]
                        },
                        transition: {
                            id: closedTransitionId.toString()
                        },
                        fields: {
                            resolution: {
                                name: 'Duplicate'
                            }
                        }
                    };
                    await updateIssueTransitions(options.jiraProtocol, options.jiraHost, ticket, body, options.headers);
                    logger.warn(`XRAY: Closed ${ticket} as it's a duplicate`);
                }
            }
            _.remove(existingTickets, (value) => value.summary === optimisedScenarioName);
        }

        if (existingTickets.length > 0) {
            // Close tickets if scenario is not present in codebase
            const ticketsToClose = _.map(existingTickets, 'key');
            for await (const ticket of ticketsToClose) {
                const { issueStatus } = _.filter(existingTickets, { key: ticket })[0];
                if (issueStatus !== 'Closed') {
                    const closedTransitionId = await getTransitionId(options.jiraProtocol, options.jiraHost, ticket, ['Closed', 'Close Issue'], options.headers);
                    const body = {
                        update: {
                            comment: [
                                {
                                    add: {
                                        body: 'Ticket is closed by automated XRAY process, as the scenario doesn\'t exist in codebase'
                                    }
                                }
                            ]
                        },
                        transition: {
                            id: closedTransitionId.toString()
                        },
                        fields: {
                            resolution: {
                                name: 'Duplicate'
                            }
                        }
                    };
                    await updateIssueTransitions(options.jiraProtocol, options.jiraHost, ticket, body, options.headers);
                    logger.warn(`XRAY: Closed ${ticket} as as test does not exists in code base`);
                } else {
                    logger.info(`XRAY: Skipping ticket modifications for ${ticket} as it's already in closed state`);
                }
            }
        }
        logger.info('XRAY: Cucumber Test Cases Syncing process completed')
    } catch (error) {
        logger.error(`XRAY: ${error.message}`);
        throw error;
    }
}

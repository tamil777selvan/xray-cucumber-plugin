import _ from 'lodash';

import logger from './utils/logger';
import { Options } from './types/types';

import generateFeaturesToImport from './utils/featureFileParser';
import { getXrayFieldId, getExistingTickets, createNewTicket, updateExistingTicket, getTransitionId, openClosedTicket, closeExistingTicket } from './utils/jira_xray_helper';

export const importCucumberTests = async (options: Options) => {
    try {
        logger.info('XRAY: Cucumber Features Import Task Started...');
        // @ts-ignore
        const featureData = await generateFeaturesToImport(options.featureFolderPath, options.featureFolderFilter, options.featureTagFilter);  

        const headers = {
            'Authorization': `Basic ${Buffer.from(`${options.jiraUsername}:${options.jiraPassword}`).toString('base64')}`
        }

        const xrayFieldId = await getXrayFieldId(options.jiraHost, options.jiraProject, headers);

        // @ts-ignore
        const existingTickets = _.remove(await getExistingTickets(options.jiraHost, options.jiraProject, xrayFieldId.xrayScenarioType.id, xrayFieldId.xrayStepId, headers));

        for await (const data of featureData) {
            const { scenarioType, scenarioName, tags, steps } = data;
            const optimisedScenarioName = scenarioName.toString().trim().replace(/[^a-zA-Z0-9-:,() ]/g, '');
            const labels = _.remove(tags.split(' ')).map((tag: string) => tag.substring(1)).sort();
            const labelsToAdd: any = labels.map((label) => ({ add: label }));

            const scenarioId = scenarioType.toLowerCase() === 'scenario outline' ? xrayFieldId.xrayScenarioType.scenarioOutline : xrayFieldId.xrayScenarioType.scenario;

            const isTicketExists = _.filter(existingTickets, { summary: optimisedScenarioName });
            const existingIssueId = _.map(isTicketExists, 'issueId').toString();

            if (isTicketExists.length === 0) {
                const body = {
                    fields: {
                        issuetype: {
                            id: xrayFieldId.issueTypeId
                        },
                        project: {
                            key: options.jiraProject
                        },
                        priority: {
                            id: xrayFieldId.priority
                        },
                        assignee: {
                            name: options.jiraUsername
                        },
                        summary: scenarioName,
                        labels,
                        ...xrayFieldId.xrayTestType,
                        [xrayFieldId.xrayScenarioType.id]: {
                            id: scenarioId
                        },
                        [xrayFieldId.xrayStepId]: steps
                    }
                }
                const response = await createNewTicket(options.jiraHost, body, headers);
                logger.info(response);
            } else if (isTicketExists.length === 1) {
                const labelsToRemove = _.flattenDeep(_.map(isTicketExists, 'labels')).map((label) => ({ remove: label }));
                const existingLabels = _.flattenDeep(_.map(isTicketExists, 'labels')).sort();
                const existingSteps = _.flattenDeep(_.map(isTicketExists, 'cucumberSteps'));
                const existingScenarioId = _.flattenDeep(_.map(isTicketExists, 'scenarioId'));
                if (!_.isEqual(labels, existingLabels) || !_.isEqual([steps], existingSteps) || !_.isEqual([scenarioId], existingScenarioId)) {
                    const body = {
                        fields: {
                            [xrayFieldId.xrayScenarioType.id]: {
                                id: scenarioId
                            },
                            [xrayFieldId.xrayStepId]: steps
                        },
                        update: {
                            labels: _.union(labelsToRemove, labelsToAdd)
                        }
                    }
                    await updateExistingTicket(options.jiraHost, existingIssueId, body, headers);
                    logger.info(`XRAY: Existing ticket ${_.map(isTicketExists, 'key').join(', ')} got updated...`);
                } else {
                    logger.info(`XRAY: Skipping ticket modifications for ${_.map(isTicketExists, 'key').join(', ')} as it's already in updated state...`);
                }
                const existingStatus: any = _.flattenDeep(_.map(isTicketExists, 'issueStatus'));
                
                if (existingStatus.includes('Closed')) {
                    const inUseTransitionId = await getTransitionId(options.jiraHost, existingIssueId, 'In Use', headers);
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

                    await openClosedTicket(options.jiraHost, existingIssueId, body, headers);
                    logger.info(`XRAY: Re Opened ${_.map(isTicketExists, 'key').join(', ')} as it's in closed state...`);
                }
            } else if (isTicketExists.length > 1) {
                logger.warn(`XRAY: Scenario "${optimisedScenarioName}" has duplicates ticket id's "${_.map(isTicketExists, 'key').join(', ')}"...`);
                const ticketsToClose = _.initial(_.map(isTicketExists, 'key').sort());
                for await (const ticket of ticketsToClose) {
                    const closedTransitionId = await getTransitionId(options.jiraHost, existingIssueId, 'Closed', headers);
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
                    await closeExistingTicket(options.jiraHost, ticket, body, headers);
                    logger.warn(`XRAY: Closed ${ticket} as it's a duplicate...`);
                }
            }
            _.remove(existingTickets, (value: any) => value.summary === optimisedScenarioName);
        }

        if (existingTickets.length > 0) {
            const ticketsToClose = _.map(existingTickets, 'key');
            for await (const ticket of ticketsToClose) {
                const { issueStatus }: any = _.filter(existingTickets, { key: ticket })[0];
                if (issueStatus !== 'Closed') {
                    const closedTransitionId = await getTransitionId(options.jiraHost, ticket, 'Closed', headers);
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
                    await closeExistingTicket(options.jiraHost, ticket, body, headers);
                    logger.warn(`XRAY: Closed ${ticket} as as test does not exists in code base...`);
                } else {
                    logger.info(`XRAY: Skipping ticket modifications for ${ticket} as it's already in closed state...`);
                }
            }
        }

        logger.info('XRAY: Cucumber Features Import Task Completed...')

    } catch (error) {
        logger.error(`${error.message}`);
        return;
    }
}

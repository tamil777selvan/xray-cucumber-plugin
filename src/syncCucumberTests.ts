import _ from 'lodash';

import logger from './utils/logger.js';
import { INIT_OPTIONS, XRAY_FIELD_IDS } from './types/types.js';
import generateFeaturesToImport from './utils/featureFileParser.js';
import { getExistingTickets, createNewTicket, updateExistingTicket, getTransitionId, updateIssueTransitions } from './utils/jira.helper.js';

/**
 * Synchronizes Cucumber tests with Xray in Jira.
 *
 * @param {INIT_OPTIONS & XRAY_FIELD_IDS} options - The synchronization options.
 * @returns {Promise<void>} A Promise that resolves when synchronization is complete.
 */
export const syncCucumberTests = async (options: INIT_OPTIONS & XRAY_FIELD_IDS): Promise<void> => {
    try {
        logger.info('XRAY: Process started to sync Cucumber Test Cases');

        const featureData = await generateFeaturesToImport(
            options.featureFolderPath,
            options.featureFolderFilter,
            options.featureTagFilter,
            options.scenarioDescriptionRegex,
            options.scenarioDescriptionRegexReplaceValue
        );

        const existingTickets = await getExistingTickets(
            options.jiraProtocol,
            options.jiraHost,
            options.jiraProject,
            options.xrayTestIssueType,
            options.xrayCucumberTestFieldId,
            options.xrayCucumberTestStepFieldId,
            options.headers
        );

        for (const data of featureData) {
            const { tags, scenarioType, scenarioName, scenarioSteps } = data;

            const optimisedScenarioName = scenarioName
                .toString()
                .trim()
                .replace(/[^a-zA-Z0-9-:,() ]/g, '');

            const labels = _.remove(tags.split(' '))
                .map((tag) => tag.substring(1))
                .sort();

            const labelsToAdd: { add?: string; remove?: string }[] = labels.map((label) => ({ add: label }));

            const isTicketExists = existingTickets.filter((ticket) => ticket.summary === optimisedScenarioName);

            if (isTicketExists.length === 0) {
                // Create new Jira tickets if no matching ticket exists
                const body = {
                    fields: {
                        issuetype: { id: options.xrayTestId },
                        project: { key: options.jiraProject },
                        priority: { name: 'Medium' },
                        summary: scenarioName,
                        labels,
                        [options.xrayTestTypeFieldId]: { id: options.xrayTestTypeId },
                        [options.xrayCucumberTestFieldId]: { id: options.xrayCucumberTestTypeMappings[scenarioType] },
                        [options.xrayCucumberTestStepFieldId]: scenarioSteps
                    }
                };
                const response = await createNewTicket(options.jiraProtocol, options.jiraHost, body, options.headers);
                logger.info(response);
            } else if (isTicketExists.length === 1) {
                // Update existing Jira ticket if only one matching ticket exists
                const existingTicket = isTicketExists[0];

                const labelsToRemove: { add?: string; remove?: string }[] = _.flattenDeep(existingTicket.labels).map((label) => ({ remove: label }));

                const existingLabels = _.flattenDeep(existingTicket.labels).sort();

                const existingSteps = [existingTicket.xrayCucumberTestStep];

                const existingScenarioType = [existingTicket.xrayCucumberTestType];

                if (!_.isEqual(labels, existingLabels) || !_.isEqual([scenarioSteps], existingSteps) || !_.isEqual([scenarioType], existingScenarioType)) {
                    const body = {
                        fields: {
                            [options.xrayCucumberTestFieldId]: { id: options.xrayCucumberTestTypeMappings[scenarioType] },
                            [options.xrayCucumberTestStepFieldId]: scenarioSteps
                        },
                        update: {
                            labels: _.union(labelsToRemove, labelsToAdd)
                        }
                    };
                    await updateExistingTicket(options.jiraProtocol, options.jiraHost, existingTicket.key, body, options.headers);
                    logger.info(`XRAY: Existing ticket ${existingTicket.key} got updated`);
                } else {
                    logger.info(`XRAY: Skipping ticket modifications for ${existingTicket.key} as it's already in an updated state`);
                }

                const existingStatus: string[] = [existingTicket.issueStatus];

                if (existingStatus.includes('Closed')) {
                    const inUseTransitionId = await getTransitionId(
                        options.jiraProtocol,
                        options.jiraHost,
                        existingTicket.key,
                        ['In Use', 'Reopen Issue'],
                        options.headers
                    );
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
                    };
                    await updateIssueTransitions(options.jiraProtocol, options.jiraHost, existingTicket.key, body, options.headers);
                    logger.info(`XRAY: Reopened ${existingTicket.key} as it's in a closed state`);
                }
            } else if (isTicketExists.length > 1) {
                // Multiple tickets found for the same scenario, so closing all but the last created one
                logger.warn(`XRAY: Scenario "${optimisedScenarioName}" has duplicate ticket IDs "${isTicketExists.map((ticket) => ticket.key).join(', ')}"...`);
                const ticketsToClose = _.initial(isTicketExists.map((ticket) => ticket.key).sort());

                for (const ticket of ticketsToClose) {
                    const closedTransitionId = await getTransitionId(
                        options.jiraProtocol,
                        options.jiraHost,
                        ticket,
                        ['Closed', 'Close Issue'],
                        options.headers
                    );
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
            // Close tickets if scenarios don't exist in the codebase
            const ticketsToClose = existingTickets.map((ticket) => ticket.key);

            for (const ticket of ticketsToClose) {
                const { issueStatus } = existingTickets.find((t) => t.key === ticket) || { issueStatus: '' };
                if (issueStatus !== 'Closed') {
                    const closedTransitionId = await getTransitionId(
                        options.jiraProtocol,
                        options.jiraHost,
                        ticket,
                        ['Closed', 'Close Issue'],
                        options.headers
                    );
                    const body = {
                        update: {
                            comment: [
                                {
                                    add: {
                                        body: "Ticket is closed by automated XRAY process, as the scenario doesn't exist in the codebase"
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
                    logger.warn(`XRAY: Closed ${ticket} as the test does not exist in the codebase`);
                } else {
                    logger.info(`XRAY: Skipping ticket modifications for ${ticket} as it's already in a closed state`);
                }
            }
        }

        logger.info('XRAY: Cucumber Test Cases Syncing process completed');
    } catch (error) {
        logger.error(`XRAY: ${error.message}`);
        throw error;
    }
};

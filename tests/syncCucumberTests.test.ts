import { vi, describe, it, expect, afterEach } from 'vitest';

import logger from '../src/utils/logger.js';
import { syncCucumberTests } from '../src/syncCucumberTests.js';
import { getExistingTickets, createNewTicket, updateExistingTicket, getTransitionId, updateIssueTransitions } from '../src/utils/jira.helper.js';
import generateFeaturesToImport from '../src/utils/featureFileParser.js';

vi.mock('../src/utils/logger.js');
vi.mock('../src/utils/jira.helper.js');
vi.mock('../src/utils/featureFileParser.js');

const jiraOptions = {
    jiraProtocol: 'https',
    jiraHost: 'example.com',
    jiraProject: 'PROJECT',
    headers: { Authorization: 'Bearer token' }
};

const xrayFieldIds = {
    xrayTestIssueType: 'Xray Test',
    xrayTestId: '4',
    xrayTestSetId: '6',
    xrayTestExecutionId: '8',
    xrayTestTypeFieldId: 'customfield_19011',
    xrayTestTypeId: '33114',
    xrayCucumberTestFieldId: 'customfield_19012',
    xrayCucumberTestTypeMappings: {
        Scenario: '33116',
        'Scenario Outline': '33117'
    },
    xrayCucumberTestStepFieldId: 'customfield_19013',
    xrayTestSetFieldId: 'customfield_19023',
    xrayTestExecutionFieldId: 'customfield_19026'
};

const options = {
    ...jiraOptions,
    ...xrayFieldIds,
    featureFolderPath: './features',
    featureFolderFilter: 'OptimisedE2EPack',
    featureTagFilter: '',
    scenarioDescriptionRegex: /TC_\d\d /gm,
    scenarioDescriptionRegexReplaceValue: ''
};

describe('syncCucumberTests', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should create new ticket if scenario is not present', async () => {
        const parsedData = {
            tags: '',
            scenarioType: 'Scenario',
            scenarioName: 'Create Mock Scenario Name',
            scenarioSteps: ''
        };

        vi.mocked(generateFeaturesToImport).mockResolvedValue([parsedData]);
        vi.mocked(getExistingTickets).mockResolvedValue([]);

        await syncCucumberTests(options);

        const createNewTicketBody = {
            fields: {
                issuetype: { id: options.xrayTestId },
                project: { key: options.jiraProject },
                priority: { name: 'Medium' },
                summary: parsedData.scenarioName,
                labels: [],
                [xrayFieldIds.xrayTestTypeFieldId]: { id: xrayFieldIds.xrayTestTypeId },
                [xrayFieldIds.xrayCucumberTestFieldId]: {
                    id: xrayFieldIds.xrayCucumberTestTypeMappings[parsedData.scenarioType]
                },
                [xrayFieldIds.xrayCucumberTestStepFieldId]: parsedData.scenarioSteps
            }
        };

        expect(createNewTicket).toHaveBeenCalledWith(options.jiraProtocol, options.jiraHost, expect.objectContaining(createNewTicketBody), options.headers);
    });

    it('should update existing ticket if scenario requires an update', async () => {
        const parsedData = {
            tags: '',
            scenarioType: 'Scenario',
            scenarioName: 'Create Mock Scenario Name',
            scenarioSteps: ''
        };

        const issuekey = `${jiraOptions.jiraProject}-0`;

        vi.mocked(generateFeaturesToImport).mockResolvedValue([parsedData]);
        vi.mocked(getExistingTickets).mockResolvedValue([
            {
                key: issuekey,
                issueId: '100',
                issueType: 'Xray Test',
                issueStatus: 'Open',
                summary: 'Create Mock Scenario Name',
                labels: [],
                xrayCucumberTestType: 'Scenario',
                xrayCucumberTestStep: '\tGiven a step passes\n\tWhen a step passes\n\tThen a step passes'
            }
        ]);

        await syncCucumberTests(options);

        const updateExistingTicketBody = {
            fields: {
                [options.xrayCucumberTestFieldId]: {
                    id: options.xrayCucumberTestTypeMappings[parsedData.scenarioType]
                },
                [options.xrayCucumberTestStepFieldId]: parsedData.scenarioSteps
            },
            update: {
                labels: []
            }
        };

        expect(updateExistingTicket).toHaveBeenCalledWith(
            options.jiraProtocol,
            options.jiraHost,
            issuekey,
            expect.objectContaining(updateExistingTicketBody),
            options.headers
        );
        expect(logger.info).toHaveBeenCalledWith(`XRAY: Existing ticket ${issuekey} got updated`);
    });

    it('should skip updating ticket if no difference found', async () => {
        const parsedData = {
            tags: '',
            scenarioType: 'Scenario',
            scenarioName: 'Create Mock Scenario Name',
            scenarioSteps: ''
        };

        const issuekey = `${jiraOptions.jiraProject}-0`;

        vi.mocked(generateFeaturesToImport).mockResolvedValue([parsedData]);
        vi.mocked(getExistingTickets).mockResolvedValue([
            {
                key: issuekey,
                issueId: '100',
                issueType: 'Xray Test',
                issueStatus: 'Open',
                summary: 'Create Mock Scenario Name',
                labels: [],
                xrayCucumberTestType: 'Scenario',
                xrayCucumberTestStep: ''
            }
        ]);

        await syncCucumberTests(options);

        expect(logger.info).toHaveBeenCalledWith(`XRAY: Skipping ticket modifications for ${issuekey} as it's already in an updated state`);

        expect(updateExistingTicket).not.toBeCalled();
    });

    it('should reopen existing ticket if scenario in closed state', async () => {
        const parsedData = {
            tags: '',
            scenarioType: 'Scenario',
            scenarioName: 'Create Mock Scenario Name',
            scenarioSteps: ''
        };

        const issuekey = `${jiraOptions.jiraProject}-0`;
        const transitionId = '1';

        vi.mocked(generateFeaturesToImport).mockResolvedValue([parsedData]);
        vi.mocked(getExistingTickets).mockResolvedValue([
            {
                key: issuekey,
                issueId: '100',
                issueType: 'Xray Test',
                issueStatus: 'Closed',
                summary: 'Create Mock Scenario Name',
                labels: [],
                xrayCucumberTestType: 'Scenario',
                xrayCucumberTestStep: ''
            }
        ]);
        vi.mocked(getTransitionId).mockResolvedValue(transitionId);

        await syncCucumberTests(options);

        const updateIssueTransitionsBody = {
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
                id: transitionId
            }
        };
        expect(updateIssueTransitions).toHaveBeenCalledWith(
            options.jiraProtocol,
            options.jiraHost,
            issuekey,
            expect.objectContaining(updateIssueTransitionsBody),
            options.headers
        );
        expect(logger.info).toHaveBeenCalledWith(`XRAY: Reopened ${issuekey} as it's in a closed state`);
    });

    it('should close existing ticket if duplicate scenario is found', async () => {
        const parsedData = {
            tags: '',
            scenarioType: 'Scenario',
            scenarioName: 'Create Mock Scenario Name',
            scenarioSteps: ''
        };

        const issuekey = `${jiraOptions.jiraProject}-0`;
        const duplicateIssuekey = `${jiraOptions.jiraProject}-1`;
        const transitionId = '5';

        vi.mocked(generateFeaturesToImport).mockResolvedValue([parsedData]);
        vi.mocked(getExistingTickets).mockResolvedValue([
            {
                key: issuekey,
                issueId: '100',
                issueType: 'Xray Test',
                issueStatus: 'New',
                summary: 'Create Mock Scenario Name',
                labels: [],
                xrayCucumberTestType: 'Scenario',
                xrayCucumberTestStep: ''
            },
            {
                key: duplicateIssuekey,
                issueId: '101',
                issueType: 'Xray Test',
                issueStatus: 'New',
                summary: 'Create Mock Scenario Name',
                labels: [],
                xrayCucumberTestType: 'Scenario',
                xrayCucumberTestStep: ''
            }
        ]);
        vi.mocked(getTransitionId).mockResolvedValue(transitionId);

        await syncCucumberTests(options);

        const updateIssueTransitionsBody = {
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
                id: transitionId
            },
            fields: {
                resolution: {
                    name: 'Duplicate'
                }
            }
        };
        expect(logger.warn).toHaveBeenCalledWith(
            `XRAY: Scenario "${parsedData.scenarioName}" has duplicate ticket IDs "${[issuekey, duplicateIssuekey].join(', ')}"`
        );
        expect(updateIssueTransitions).toHaveBeenCalledWith(
            options.jiraProtocol,
            options.jiraHost,
            issuekey,
            expect.objectContaining(updateIssueTransitionsBody),
            options.headers
        );
        expect(logger.warn).toHaveBeenCalledWith(`XRAY: Closed ${issuekey} as it's a duplicate`);
    });

    it('should close the ticket if scenario is not present in codebase', async () => {
        const issuekey = `${jiraOptions.jiraProject}-0`;
        const transitionId = '0';

        vi.mocked(generateFeaturesToImport).mockResolvedValue([]);
        vi.mocked(getExistingTickets).mockResolvedValue([
            {
                key: issuekey,
                issueId: '100',
                issueType: 'Xray Test',
                issueStatus: 'New',
                summary: 'Create Mock Scenario Name',
                labels: [],
                xrayCucumberTestType: 'Scenario',
                xrayCucumberTestStep: ''
            }
        ]);
        vi.mocked(getTransitionId).mockResolvedValue(transitionId);

        await syncCucumberTests(options);

        const updateIssueTransitionsBody = {
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
                id: transitionId
            },
            fields: {
                resolution: {
                    name: 'Duplicate'
                }
            }
        };
        expect(updateIssueTransitions).toHaveBeenCalledWith(
            options.jiraProtocol,
            options.jiraHost,
            issuekey,
            expect.objectContaining(updateIssueTransitionsBody),
            options.headers
        );
        expect(logger.warn).toHaveBeenCalledWith(`XRAY: Closed ${issuekey} as the test does not exist in the codebase`);
    });

    it('should skip the ticket closure if scenario is already in closed state', async () => {
        const issuekey = `${jiraOptions.jiraProject}-0`;
        const transitionId = '0';

        vi.mocked(generateFeaturesToImport).mockResolvedValue([]);
        vi.mocked(getExistingTickets).mockResolvedValue([
            {
                key: issuekey,
                issueId: '100',
                issueType: 'Xray Test',
                issueStatus: 'Closed',
                summary: 'Create Mock Scenario Name',
                labels: [],
                xrayCucumberTestType: 'Scenario',
                xrayCucumberTestStep: ''
            }
        ]);
        vi.mocked(getTransitionId).mockResolvedValue(transitionId);

        await syncCucumberTests(options);

        expect(logger.info).toHaveBeenCalledWith(`XRAY: Skipping ticket modifications for ${issuekey} as it's already in a closed state`);

        expect(updateIssueTransitions).not.toBeCalled();
    });
});

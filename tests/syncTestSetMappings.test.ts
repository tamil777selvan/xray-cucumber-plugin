import { vi, describe, it, expect, afterEach } from 'vitest';

import { syncTestSetMappings } from '../src/syncTestSetMappings.js';
import { getExistingTickets } from '../src/utils/jira.helper.js';
import { requestHelper } from '../src/utils/request.helper.js';

import { EXISTING_TICKET } from '../src/types/types.js';

vi.mock('../src/utils/logger.js');
vi.mock('../src/utils/jira.helper.js');
vi.mock('../src/utils/request.helper.js');

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

const firstTestSetId = `${jiraOptions.jiraProject}-11`;
const secondTestSetId = `${jiraOptions.jiraProject}-12`;
const thirdTestSetId = `${jiraOptions.jiraProject}-13`;

const options = {
    ...jiraOptions,
    ...xrayFieldIds,
    updateTestSetMappings: true,
    testSetMappingDetails: {
        testSet1: {
            tags: '@tag1 or @tag2',
            testSetId: [firstTestSetId, secondTestSetId]
        },
        testSet2: {
            tags: '@tag3',
            testSetId: [thirdTestSetId]
        }
    }
};

const firstTicket = `${jiraOptions.jiraProject}-1`;
const secondTicket = `${jiraOptions.jiraProject}-2`;
const thirdTicket = `${jiraOptions.jiraProject}-3`;
const fourthTicket = `${jiraOptions.jiraProject}-4`;
const fifthTicket = `${jiraOptions.jiraProject}-5`;

const existingTickets = [
    { labels: ['tag1'], issueStatus: 'Open', key: firstTicket },
    { labels: ['tag2'], issueStatus: 'Open', key: secondTicket },
    { labels: ['tag3'], issueStatus: 'Closed', key: thirdTicket },
    { labels: ['tag3'], issueStatus: 'New', key: fourthTicket },
    { labels: ['tag1'], issueStatus: 'New', key: fifthTicket }
] as EXISTING_TICKET[];

describe('syncTestSetMappings', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should synchronize test set mappings correctly', async () => {
        vi.mocked(getExistingTickets).mockResolvedValue(existingTickets);

        await syncTestSetMappings(options);

        expect(requestHelper.put).toBeCalledTimes(3);

        expect(vi.mocked(requestHelper.put).mock.calls[0]).toEqual([
            `${jiraOptions.jiraProtocol}://${jiraOptions.jiraHost}/rest/api/2/issue/${firstTestSetId}`,
            {
                update: {
                    [xrayFieldIds.xrayTestSetFieldId]: [
                        {
                            set: [firstTicket, secondTicket]
                        }
                    ]
                }
            },
            jiraOptions.headers
        ]);
        expect(vi.mocked(requestHelper.put).mock.calls[1]).toEqual([
            `${jiraOptions.jiraProtocol}://${jiraOptions.jiraHost}/rest/api/2/issue/${secondTestSetId}`,
            {
                update: {
                    [xrayFieldIds.xrayTestSetFieldId]: [
                        {
                            set: [fifthTicket]
                        }
                    ]
                }
            },
            jiraOptions.headers
        ]);
        expect(vi.mocked(requestHelper.put).mock.calls[2]).toEqual([
            `${jiraOptions.jiraProtocol}://${jiraOptions.jiraHost}/rest/api/2/issue/${thirdTestSetId}`,
            {
                update: {
                    [xrayFieldIds.xrayTestSetFieldId]: [
                        {
                            set: [fourthTicket]
                        }
                    ]
                }
            },
            jiraOptions.headers
        ]);
    });

    it('should throw error if testSetId value is empty', async () => {
        vi.mocked(getExistingTickets).mockResolvedValue(existingTickets);

        options.testSetMappingDetails.testSet1.testSetId = [];

        try {
            await syncTestSetMappings(options);
        } catch (error) {
            expect(error.message).toContain('testSetId provided in testSetMappingDetails should be an array & should not be empty');
        }
        expect(requestHelper.put).toBeCalledTimes(0);
    });

    it('should throw error if testSetId type is not array', async () => {
        vi.mocked(getExistingTickets).mockResolvedValue(existingTickets);

        // @ts-expect-error validating negative case
        options.testSetMappingDetails.testSet1.testSetId = {};

        try {
            await syncTestSetMappings(options);
        } catch (error) {
            expect(error.message).toContain('testSetId provided in testSetMappingDetails should be an array & should not be empty');
        }
        expect(requestHelper.put).toBeCalledTimes(0);
    });
});

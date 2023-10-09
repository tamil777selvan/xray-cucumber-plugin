import { vi, describe, it, expect, afterEach } from 'vitest';

import { updateTestExecutionResults } from '../src/updateTestExecutionResults.js';
import { getExistingTickets, getTestExecutionIds, updateExecutionResult } from '../src/utils/jira.helper.js';
import logger from '../src/utils/logger.js';

vi.mock('../src/utils/logger.js');
vi.mock('../src/utils/jira.helper.js');

const xrayFieldIds = {
	xrayTestIssueType: 'Xray Test',
	xrayTestId: '4',
	xrayTestSetId: '6',
	xrayTestExecutionId: '8',
	xrayTestTypeFieldId: 'customfield_19011',
	xrayTestTypeId: '33114',
	xrayCucumberTestFieldId: 'customfield_19012',
	xrayCucumberTestTypeMappings: { Scenario: '33116', 'Scenario Outline': '33117' },
	xrayCucumberTestStepFieldId: 'customfield_19013',
	xrayTestSetFieldId: 'customfield_19023',
	xrayTestExecutionFieldId: 'customfield_19026'
};

describe('updateTestExecutionResults', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

	it('should update test execution results from parsedTestResultDetails', async () => {
		const options = {
			...xrayFieldIds,
			jiraProtocol: 'https',
			jiraHost: 'example.com',
			jiraProject: 'PROJECT',
			headers: { Authorization: 'Bearer token' },
			testExecutionIds: ['JIRA-6'],
			parsedTestResultDetails: [
				{
					'Test Scenario 1': 'PASS',
					'Test Scenario 2': 'FAIL'
				}
			]
		};

		const issueKey = `${options.jiraProject}-101`;
		const testExecutionId = "3031305";

		vi.mocked(getExistingTickets).mockResolvedValue([
			{
				summary: 'Test Scenario 1',
				key: issueKey
			}
		] as any);

		vi.mocked(getTestExecutionIds).mockResolvedValue([{ b: issueKey, c: testExecutionId }]);

		await updateTestExecutionResults(options);

		expect(getTestExecutionIds).toBeCalledWith(
			options.jiraProtocol,
			options.jiraHost,
			options.testExecutionIds[0],
			options.xrayTestExecutionFieldId,
			options.headers
		);

		expect(updateExecutionResult).toBeCalledWith(options.jiraProtocol, options.jiraHost, testExecutionId, 'PASS', options.headers);
        expect(logger.info).toHaveBeenCalledWith(`XRAY: Test Execution Result updated for ${issueKey.toString()}`);
	});

    it('should skip updating test execution results if given test in parsedTestResultDetails not found', async () => {
		const options = {
			...xrayFieldIds,
			jiraProtocol: 'https',
			jiraHost: 'example.com',
			jiraProject: 'PROJECT',
			headers: { Authorization: 'Bearer token' },
			testExecutionIds: ['JIRA-6'],
			parsedTestResultDetails: [
				{
					'Test Scenario 2': 'PASS'
				}
			]
		};

		const issueKey = `${options.jiraProject}-1`;
		const testExecutionId = '3031305';

		vi.mocked(getExistingTickets).mockResolvedValue([
			{
				summary: 'Test Scenario 1',
				key: issueKey
			}
		] as any);

		vi.mocked(getTestExecutionIds).mockResolvedValue([{ b: issueKey, c: testExecutionId }]);

		await updateTestExecutionResults(options);

		expect(logger.warn).toHaveBeenCalledWith(`XRAY: Skipping result update as Test Scenario 2 not found in xray tests`);

        expect(updateExecutionResult).not.toBeCalled();
	});

    it('should skip updating result if test execution id not found', async () => {
        const options = {
			...xrayFieldIds,
			jiraProtocol: 'https',
			jiraHost: 'example.com',
			jiraProject: 'PROJECT',
			headers: { Authorization: 'Bearer token' },
			testExecutionIds: ['JIRA-6'],
			parsedTestResultDetails: [
				{
					'Test Scenario 1': 'PASS'
				}
			]
		};

        const issueKey = `${options.jiraProject}-1`;
        const duplicateIssueKey = `${options.jiraProject}-2`;
        const testExecutionId = '3031305';

        vi.mocked(getExistingTickets).mockResolvedValue([
            {
                summary: 'Test Scenario 1',
                key: issueKey
            }
        ] as any);

        vi.mocked(getTestExecutionIds).mockResolvedValue([{ b: duplicateIssueKey, c: testExecutionId }]);

        await updateTestExecutionResults(options);

        expect(logger.warn).toHaveBeenCalledWith(`XRAY: Skipping result update as Test Scenario 1 not found in test execution`);

        expect(updateExecutionResult).not.toBeCalled();
    })

     it('should skip updating result if skipUpdatingFailedCase flag is set', async () => {
			const options = {
				...xrayFieldIds,
				jiraProtocol: 'https',
				jiraHost: 'example.com',
				jiraProject: 'PROJECT',
				headers: { Authorization: 'Bearer token' },
				testExecutionIds: ['JIRA-6'],
				parsedTestResultDetails: [
					{
						'Test Scenario 1': 'FAIL'
					}
				],
				skipUpdatingFailedCase: true
			};

			const issueKey = `${options.jiraProject}-1`;
			const duplicateIssueKey = `${options.jiraProject}-2`;
			const testExecutionId = '3031305';

			vi.mocked(getExistingTickets).mockResolvedValue([
				{
					summary: 'Test Scenario 1',
					key: issueKey
				}
			] as any);

			vi.mocked(getTestExecutionIds).mockResolvedValue([{ b: duplicateIssueKey, c: testExecutionId }]);

			await updateTestExecutionResults(options);

            expect(updateExecutionResult).not.toBeCalled();
		});
});

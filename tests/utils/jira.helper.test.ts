import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';

import { requestHelper } from '../../src/utils/request.helper.js';
import {
	getXrayFieldIds,
	getExistingTickets,
	createNewTicket,
	updateExistingTicket,
	getTransitionId,
	updateIssueTransitions,
	getTestExecutionIds,
	updateExecutionResult
} from '../../src/utils/jira.helper.js';

import { getIssueTypeIdByNameResponse, getIssueTypeMetadataResponse, getExistingTicketsResponse } from '../fixtures/jira.response.js';

// Common Constants
const jiraProtocol = 'https';
const jiraHost = 'example.com';
const jiraProject = 'PROJECT';
const requestHeaders = { Authorization: 'Bearer token' };
const createNewTicketKey = 'NEW-TICKET-KEY';
const issueId = 'TEST-123';
const xrayTestExecutionId = 'TESTEXEC-123';
const xrayTestExecutionIdFieldValue = '3031205';
const xrayTestExecutionFieldId = 'customfield_123';
const xrayTestStatus = 'PASS';

vi.mock('../../src/utils/request.helper.js');

const mockGet = vi.fn().mockImplementation((url) => {
	const uri = new URL(url);

	const pathName = uri.pathname;

	if (pathName === '/rest/api/2/issuetype') {
		return Promise.resolve(getIssueTypeIdByNameResponse);
	}

	if (pathName.includes(`/rest/api/2/issue/createmeta/${jiraProject}/issuetypes`)) {
		const issueTypeId = pathName.substring(pathName.lastIndexOf('/') + 1);
		return Promise.resolve(getIssueTypeMetadataResponse(parseInt(issueTypeId)));
	}

	if (pathName === `/rest/api/2/issue/${issueId}/transitions`) {
		return Promise.resolve({
			transitions: [
				{ name: 'To Do', id: '1' },
				{ name: 'In Progress', id: '2' },
				{ name: 'Done', id: '3' }
			]
		});
	}

	if (pathName === `/rest/api/2/issue/${xrayTestExecutionId}`) {
		return Promise.resolve({
			fields: {
				[xrayTestExecutionFieldId]: [
					{
						b: 'PROJECT-101',
						c: 3031305
					},
					{
						b: 'PROJECT-102',
						c: 3031306
					},
					{
						b: 'PROJECT-103',
						c: 3031307
					}
				]
			}
		});
	}

	return Promise.reject();
});

const mockPost = vi.fn().mockImplementation((url) => {
	const uri = new URL(url);

	const pathName = uri.pathname;

	if (pathName === '/rest/api/2/search') {
		return Promise.resolve({
			issues: getExistingTicketsResponse
		});
	}

	if (pathName === '/rest/api/2/issue') {
		return Promise.resolve({
			key: createNewTicketKey
		});
	}

	if (pathName === `/rest/api/2/issue/${issueId}/transitions` && uri.search === '?expand=transitions.fields') {
		return Promise.resolve();
	}

	return Promise.reject();
});

const mockPut = vi.fn().mockImplementation((url) => {
	const uri = new URL(url);

	const pathName = uri.pathname;

	if (pathName === `/rest/api/2/issue/${issueId}`) {
		return Promise.resolve();
	}

	if (pathName === `/rest/raven/1.0/api/testrun/${xrayTestExecutionIdFieldValue}/status` && uri.search === `?status=${xrayTestStatus}`) {
		return Promise.resolve([]);
	}

	return Promise.reject();
});

describe.only('jiraHelper', () => {
	beforeAll(() => {
		vi.spyOn(requestHelper, 'get').mockImplementation(mockGet);
		vi.spyOn(requestHelper, 'post').mockImplementation(mockPost);
		vi.spyOn(requestHelper, 'put').mockImplementation(mockPut);
	});

	afterAll(() => {
		vi.resetAllMocks();
	});

	it('should retrieve Xray field IDs', async () => {
		const result = await getXrayFieldIds(jiraProtocol, jiraHost, jiraProject, requestHeaders);

		expect(result).toEqual({
			xrayTestIssueType: 'Xray Test',
			xrayTestId: 4,
			xrayTestSetId: 6,
			xrayTestExecutionId: 8,
			xrayTestTypeFieldId: 'customfield_19011',
			xrayTestTypeId: '33114',
			xrayCucumberTestFieldId: 'customfield_19012',
			xrayCucumberTestTypeMappings: { Scenario: '33116', 'Scenario Outline': '33117' },
			xrayCucumberTestStepFieldId: 'customfield_19013',
			xrayTestSetFieldId: 'customfield_19023',
			xrayTestExecutionFieldId: 'customfield_19026'
		});
	});

	it('should get existing tickets', async () => {
		const result = await getExistingTickets(jiraProtocol, jiraHost, jiraProject, 'Xray Test', 'customfield_19012', 'customfield_19013', requestHeaders);
		expect(result).toEqual([
			{
				key: 'PROJECT-0',
				issueId: '100',
				issueType: 'Xray Test',
				issueStatus: 'Open',
				summary: 'Scenario 1',
				labels: [],
				xrayCucumberTestType: 'Scenario',
				xrayCucumberTestStep: '\tGiven a step passes\n\tWhen a step passes\n\tThen a step passes'
			},
			{
				key: 'PROJECT-1',
				issueId: '101',
				issueType: 'Xray Test',
				issueStatus: 'Open',
				summary: 'Scenario Outline 1 (Example - param1:a,param2:b)',
				labels: [],
				xrayCucumberTestType: 'Scenario Outline',
				xrayCucumberTestStep:
					'\tGiven a step passes\n' + '\tWhen a step passes\n' + '\tThen a step passes\t\n' + '\tExamples:\n' + '\t|param1|param2|\n' + '\t|a|b|\n'
			},
			{
				key: 'PROJECT-2',
				issueId: '102',
				issueType: 'Xray Test',
				issueStatus: 'Open',
				summary: 'Scenario Outline 1 (Example - param1:1,param2:2)',
				labels: [],
				xrayCucumberTestType: 'Scenario Outline',
				xrayCucumberTestStep:
					'\tGiven a step passes\n' + '\tWhen a step passes\n' + '\tThen a step passes\t\n' + '\tExamples:\n' + '\t|param1|param2|\n' + '\t|1|2|\n'
			},
			{
				key: 'PROJECT-3',
				issueId: '103',
				issueType: 'Xray Test',
				issueStatus: 'Open',
				summary: 'Scenario 2',
				labels: [],
				xrayCucumberTestType: 'Scenario',
				xrayCucumberTestStep: '\tGiven a step passes\n\tWhen a step passes\n\tThen a step passes'
			},
			{
				key: 'PROJECT-4',
				issueId: '104',
				issueType: 'Xray Test',
				issueStatus: 'Open',
				summary: 'Scenario Outline 2 (Example - param1:a,param2:b)',
				labels: [],
				xrayCucumberTestType: 'Scenario Outline',
				xrayCucumberTestStep:
					'\tGiven a step passes\n' + '\tWhen a step passes\n' + '\tThen a step passes\t\n' + '\tExamples:\n' + '\t|param1|param2|\n' + '\t|a|b|\n'
			},
			{
				key: 'PROJECT-5',
				issueId: '105',
				issueType: 'Xray Test',
				issueStatus: 'Open',
				summary: 'Scenario 3',
				labels: [],
				xrayCucumberTestType: 'Scenario',
				xrayCucumberTestStep: '\tGiven a step passes\n' + '\tWhen a step passes\n' + '\t|params|\n' + '\t|a|\n' + '\t|1|\n' + '\tThen a step passes'
			},
			{
				key: 'PROJECT-6',
				issueId: '106',
				issueType: 'Xray Test',
				issueStatus: 'Open',
				summary: 'Scenario 4',
				labels: ['ff'],
				xrayCucumberTestType: 'Scenario',
				xrayCucumberTestStep: '\tGiven a step passes\n\tWhen a step passes\n\tThen a step passes'
			},
			{
				key: 'PROJECT-7',
				issueId: '107',
				issueType: 'Xray Test',
				issueStatus: 'Open',
				summary: 'Scenario Outline 4 (Example - param1:a,param2:b)',
				labels: ['ff', 'scenarioOutline'],
				xrayCucumberTestType: 'Scenario Outline',
				xrayCucumberTestStep:
					'\tGiven a step passes\n' + '\tWhen a step passes\n' + '\tThen a step passes\t\n' + '\tExamples:\n' + '\t|param1|param2|\n' + '\t|a|b|\n'
			}
		]);
	});

	it('should create a new ticket and return response', async () => {
		const body = {
			fields: {
				summary: 'Test Summary'
			}
		};
		const result = await createNewTicket(jiraProtocol, jiraHost, body, requestHeaders);
		expect(result).toBe(`XRAY: New ticket ${createNewTicketKey} created for ${body.fields.summary}`);
	});

	it('should update an existing ticket', async () => {
		const body = {
			fields: {
				summary: 'Test Summary'
			}
		};
		await updateExistingTicket(jiraProtocol, jiraHost, issueId, body, requestHeaders);
		expect(requestHelper.put).toHaveBeenCalledWith(`${jiraProtocol}://${jiraHost}/rest/api/2/issue/${issueId}`, body, requestHeaders);
	});

	it('should return the ID of the found transition', async () => {
		const result = await getTransitionId(jiraProtocol, jiraHost, issueId, ['To Do'], requestHeaders);
		expect(result).toBe('1');
	});

	it('should return undefined when no matching transition is found', async () => {
		const result = await getTransitionId(jiraProtocol, jiraHost, issueId, ['Invalid'], requestHeaders);
		expect(result).toBeUndefined();
	});

	it('should update transitions for given ticket', async () => {
		const body = { transition: { id: '42' } };
		await updateIssueTransitions(jiraProtocol, jiraHost, issueId, body, requestHeaders);
		expect(requestHelper.post).toHaveBeenCalledWith(
			`${jiraProtocol}://${jiraHost}/rest/api/2/issue/${issueId}/transitions?expand=transitions.fields`,
			body,
			requestHeaders
		);
	});

	it('should get test execution Id', async () => {
		const result = await getTestExecutionIds(jiraProtocol, jiraHost, xrayTestExecutionId, xrayTestExecutionFieldId, requestHeaders);
		expect(requestHelper.get).toHaveBeenCalledWith(`${jiraProtocol}://${jiraHost}/rest/api/2/issue/${xrayTestExecutionId}`, requestHeaders);
		expect(result).toEqual([
			{
				b: 'PROJECT-101',
				c: 3031305
			},
			{
				b: 'PROJECT-102',
				c: 3031306
			},
			{
				b: 'PROJECT-103',
				c: 3031307
			}
		]);
	});

	it('should update result for test execution', async () => {
		await updateExecutionResult(jiraProtocol, jiraHost, xrayTestExecutionIdFieldValue, xrayTestStatus, requestHeaders);
		expect(requestHelper.put).toHaveBeenCalledWith(
			`${jiraProtocol}://${jiraHost}/rest/raven/1.0/api/testrun/${xrayTestExecutionIdFieldValue}/status?status=${xrayTestStatus}`,
			{},
			requestHeaders
		);
	});
});

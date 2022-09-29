import _ from 'lodash';

import { requestHelper } from './request_helper';

export const getXrayFieldIds = async (jiraHost: string, jiraProject: string, requestHeaders: object) => {

    const issueTypeUrl = `https://${jiraHost}/rest/api/2/issuetype`;
    const issueTypeResponse = await requestHelper.get(issueTypeUrl, requestHeaders);

    // Returns the Id which is used to create Jira Tickets with issue type as Xray Tests
    const issueTypeId = _.get(_.find(issueTypeResponse, { 'name': 'Xray Test' }), 'id');

    // Returns the Id which is used to create Jira Tickets with issue type as Test Set
    const testSetIssuetypeId = _.get(_.find(issueTypeResponse, { 'name': 'Test Set' }), 'id') || _.get(_.find(issueTypeResponse, { 'name': 'Xray Test Set' }), 'id');

    // Returns the Id which is used to map the test results with the Test Execution ticktes.
    const testExecutionIssuetypeId = _.get(_.find(issueTypeResponse, { 'name': 'Test Execution' }), 'id') || _.get(_.find(issueTypeResponse, { 'name': 'Xray Test Execution' }), 'id');

    const issueMetaDataUrl = `https://${jiraHost}/rest/api/2/issue/createmeta?projectKeys=${jiraProject}&expand=projects.issuetypes.fields&issuetypeIds=${issueTypeId}`;
    const issueMetaDataResponse = await requestHelper.get(issueMetaDataUrl, requestHeaders);

    const { issuetypes } = issueMetaDataResponse.projects[0];

    const fields = _.get(issuetypes[0], 'fields');

    const schemaMapping = _.omit(_.invert(_.mapValues(fields, 'schema.custom')), 'undefined');

    // Returns the Field Id which is used to specify the type of Xray Tests like Manual / Cucumber / Generic
    const xrayTestTypeId_key = schemaMapping['com.xpandit.plugins.xray:test-type-custom-field'];

    // Returns all allowedValues for ${xrayTestTypeId_key}
    const xrayTestTypeId_allowedValues = _.get(fields, `${xrayTestTypeId_key}.allowedValues`);

    // Returns the value which needs to be mapped with ${xrayTestTypeId_key}. Value here is hardcoded as Cucumber, since we create xray tests for cucumber tests.
    const xrayTestTypeId_value = _.pick(_.find(xrayTestTypeId_allowedValues, { value: 'Cucumber' }), 'id');

    const xrayTestType = {
        [xrayTestTypeId_key]: xrayTestTypeId_value
    }

    // Returns the Field Id which is used to specify the type of Cucumber Tests either Scenario / Scenario_Outline
    const xrayScenarioTypeId_key = schemaMapping['com.xpandit.plugins.xray:automated-test-type-custom-field'];

    // Returns all allowedValues for ${xrayScenarioTypeId_key}
    const xrayScenarioTypeId_allowedValues = _.get(fields, `${xrayScenarioTypeId_key}.allowedValues`);

    // Returns the id value for test type scenario
    const scenario = _.get(_.find(xrayScenarioTypeId_allowedValues, { value: 'Scenario' }), 'id');

    // Returns the id value for test type scenario outline
    const scenarioOutline = _.get(_.find(xrayScenarioTypeId_allowedValues, { value: 'Scenario Outline' }), 'id');

    const xrayScenarioType = {
        id: xrayScenarioTypeId_key,
        scenario,
        scenarioOutline
    }

    // Returns the Field Id which is used to map the Gherkin Steps
    const xrayStepId = schemaMapping['com.xpandit.plugins.xray:steps-editor-custom-field'];

    const { priority } = fields;

    // Returns all allowedValues for ${priority}
    const priority_allowedValues = _.get(priority, 'allowedValues');

    // Returns the id value for medium priority
    const priorityValue = _.get(_.find(priority_allowedValues, { name: 'Medium' }), 'id')

    const testSetIssueMetaDataUrl = `https://${jiraHost}/rest/api/2/issue/createmeta?projectKeys=${jiraProject}&expand=projects.issuetypes.fields&issuetypeIds=${testSetIssuetypeId}`;
    const testSetIssueMetaDataResponse = await requestHelper.get(testSetIssueMetaDataUrl, requestHeaders);

    const testSetIssuetypes = _.get(testSetIssueMetaDataResponse.projects[0], 'issuetypes');
    const testSetIssueFields = _.get(testSetIssuetypes[0], 'fields');

    const testSetIssueSchemaMapping = _.omit(_.invert(_.mapValues(testSetIssueFields, 'schema.custom')), 'undefined');

    // Returns the Field Id which is used to map Xray Tests to Test Set
    const xrayTestSetId = testSetIssueSchemaMapping['com.xpandit.plugins.xray:test-sets-tests-custom-field'];

    const testExecutionIssueMetaDataUrl = `https://${jiraHost}/rest/api/2/issue/createmeta?projectKeys=${jiraProject}&expand=projects.issuetypes.fields&issuetypeIds=${testExecutionIssuetypeId}`;
    const testExecutionIssueMetaDataResponse = await requestHelper.get(testExecutionIssueMetaDataUrl, requestHeaders);

    const testExecutionIssuetypes = _.get(testExecutionIssueMetaDataResponse.projects[0], 'issuetypes');
    const testExecutionIssueFields = _.get(testExecutionIssuetypes[0], 'fields');

    const testExecutionIssueSchemaMapping = _.omit(_.invert(_.mapValues(testExecutionIssueFields, 'schema.custom')), 'undefined');

    // Returns the Field Id which is used to map test execution results to Test Execution ticket
    const xrayTestExecutionId = testExecutionIssueSchemaMapping['com.xpandit.plugins.xray:testexec-tests-custom-field'];

    // 
    return ({
        issueTypeId,
        xrayTestTypeId: xrayTestTypeId_key,
        xrayTestType,
        xrayScenarioType,
        xrayStepId,
        priority: priorityValue,
        xrayTestSetId,
        xrayTestExecutionId
    });
}

export const getExistingTickets = async (jiraHost: string, jiraProject: string, scenarioId: string, cucumberStepId: string, requestHeaders: object) => {
    const url = `https://${jiraHost}/rest/api/2/search`;
    const body = {
        jql: `project = ${jiraProject} AND issuetype = 'Xray Test'`,
        fields: [
            'issuetype',
            'status',
            'summary',
            'labels',
            scenarioId,
            cucumberStepId
        ],
        maxResults: 1000,
        startAt: 0
    };

    let iteration = true;

    const collectiveResponse = [];

    while (iteration) {
        const response = await requestHelper.post(url, body, requestHeaders);
        collectiveResponse.push(response.issues);
        if (response.issues.length !== 1000) {
            iteration = false;
        } else {
            body.startAt += 1000;
        }
    }

    const issues = _.flattenDeep(collectiveResponse);

    return Promise.resolve(issues.map((issue) => {
        if (issue.fields[scenarioId]) {
            return ({
                key: issue.key,
                issueId: issue.id,
                issueType: issue.fields.issuetype,
                issueStatus: issue.fields.status.name,
                summary: issue.fields.summary.toString().trim().replace(/[^a-zA-Z0-9-:,() ]/g, ''),
                labels: issue.fields.labels,
                scenarioId: (issue.fields[scenarioId]).id,
                cucumberSteps: issue.fields[cucumberStepId]
            })
        }
    }));
}

export const createNewTicket = async (jiraHost: string, body: object, requestHeaders: object) => {
    const url = `https://${jiraHost}/rest/api/2/issue`;
    const response = await requestHelper.post(url, body, requestHeaders);
    return Promise.resolve(`XRAY: New ticket ${_.get(response, 'key')} created for ${_.get(body, 'fields.summary')}...`);
}

export const updateExistingTicket = async (jiraHost: string, issueId: string, body: object, requestHeaders: object) => {
    const url = `https://${jiraHost}/rest/api/2/issue/${issueId}`;
    await requestHelper.put(url, body, requestHeaders);
}

export const getTransitionId = async (jiraHost: string, issueId: string, transitionName: string, requestHeaders: object) => {
    const url = `https://${jiraHost}/rest/api/2/issue/${issueId}/transitions`;
    const response = await requestHelper.get(url, requestHeaders);
    const { transitions } = response;
    return Promise.resolve(_.get(_.find(transitions, { name: transitionName }), 'id'));
}

export const openClosedTicket = async (jiraHost: string, issueId: string, body: object, requestHeaders: object) => {
    const url = `https://${jiraHost}/rest/api/2/issue/${issueId}/transitions?expand=transitions.fields`;
    await requestHelper.post(url, body, requestHeaders);
}

export const closeExistingTicket = async (jiraHost: string, issueId: string | number, body: object, requestHeaders: object) => {
    const url = `https://${jiraHost}/rest/api/2/issue/${issueId}/transitions?expand=transitions.fields`;
    await requestHelper.post(url, body, requestHeaders);
}

export const getTestExecutionIds = async (jiraHost: string, executionId: string, xrayTestExecutionId: string, requestHeaders: object) => {
    const url = `https://${jiraHost}/rest/api/2/issue/${executionId}`;
    const response = await requestHelper.get(url, requestHeaders);
    const testExecutionIds = response.fields[xrayTestExecutionId];
    return testExecutionIds;
}

export const updateExecutionResult = async (jiraHost: string, executionId: string, xrayTestStatus: string, requestHeaders: object) => {
    const url = `https://${jiraHost}/rest/raven/1.0/api/testrun/${executionId}/status?status=${xrayTestStatus}`;
    await requestHelper.put(url, {}, requestHeaders);
}

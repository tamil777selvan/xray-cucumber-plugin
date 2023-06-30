import _ from 'lodash';

import { requestHelper } from './request.helper';

import { XRAY_FIELD_IDS, EXISTING_TICKETS } from 'src/types/types';

export const getXrayFieldIds = async (jiraProtocol: string, jiraHost: string, jiraProject: string, requestHeaders: object) => {

    // Get the list of issuetypes available in given jira host
    const issueTypeUrl = `${jiraProtocol}://${jiraHost}/rest/api/2/issuetype`;
    const issueTypeResponse = await requestHelper.get(issueTypeUrl, requestHeaders);

    // Returns the Id of Xray Test (Represents a Test)
    const xrayTestId = _.get(_.find(issueTypeResponse, { 'name': 'Xray Test' }), 'id') || _.get(_.find(issueTypeResponse, { 'name': 'Test' }), 'id');

    // Returns the Id of Xray Test Set (Represents a Test Set)
    const xrayTestSetId = _.get(_.find(issueTypeResponse, { 'name': 'Xray Test Set' }), 'id') || _.get(_.find(issueTypeResponse, { 'name': 'Test Set' }), 'id');

    // Returns the Id of Xray Test Execution (Represents a Test Execution)
    const xrayTestExecutionId = _.get(_.find(issueTypeResponse, { 'name': 'Xray Test Execution' }), 'id') || _.get(_.find(issueTypeResponse, { 'name': 'Test Execution' }), 'id');

    // Get the meta data information for the Xray Test (`${xrayTestId}`) of given jira project (`${jiraProject}`)
    const xrayTestMetaDataUrl = `${jiraProtocol}://${jiraHost}/rest/api/2/issue/createmeta/${jiraProject}/issuetypes/${xrayTestId}`;
    const xrayTestMetaDataResponse = await requestHelper.get(xrayTestMetaDataUrl, requestHeaders);

    // Get the allowedValues for fieldId which has "issuetype"
    // This would be used to specify which type of issue, the plugin would be manupulating
    const { allowedValues } = xrayTestMetaDataResponse.values.find((item: { fieldId: string; }) => item.fieldId === 'issuetype');
    const xrayTestIssueType = _.get(_.first(allowedValues), 'name');

    // Get the fieldId & allowedValues for schema.custom which has "com.xpandit.plugins.xray:test-type-custom-field"
    // This would be used to specify which type of Xray Test (Manual / Cucumber / Generic), the plugin would be creating
    const { fieldId: xrayTestTypeFieldId, allowedValues: xrayTestType } = xrayTestMetaDataResponse.values.find((item: { schema: { custom: string; }; }) => item.schema.custom === 'com.xpandit.plugins.xray:test-type-custom-field');

    // Get the Id from ${allowedValues} which has "Cucumber" as it's value
    const xrayTestTypeId = _.get(_.find(xrayTestType, { 'value': 'Cucumber' }), 'id');

    // Get the fieldId & allowedValues for schema.custom which has "com.xpandit.plugins.xray:automated-test-type-custom-field"
    // This would be used to specify which type of Xray Cucumber Test (Scenario / Scenario Outline), the plugin would be creating
    const { fieldId: xrayCucumberTestFieldId, allowedValues: xrayCucumberTestType } = xrayTestMetaDataResponse.values.find((item: { schema: { custom: string; }; }) => item.schema.custom === 'com.xpandit.plugins.xray:automated-test-type-custom-field');

    // Reduce ${xrayCucumberTestType} by iterating each entry and returing an object with "{[value]: id}" mapping
    const xrayCucumberTestTypeMappings = _.reduce(xrayCucumberTestType, (acc, obj) => {
        acc[obj.value] = obj.id;
        return acc;
    }, {});

    // Get the fieldId for schema.custom which has "com.xpandit.plugins.xray:steps-editor-custom-field"
    // This would be used to add the cucumber steps
    const { fieldId: xrayCucumberTestStepFieldId } = xrayTestMetaDataResponse.values.find((item: { schema: { custom: string; }; }) => item.schema.custom === 'com.xpandit.plugins.xray:steps-editor-custom-field');

    // Get the meta data information for the Xray Test Set (`${xrayTestSetId}`) of given jira project (`${jiraProject}`)
    const xrayTestSetMetaDataUrl = `${jiraProtocol}://${jiraHost}/rest/api/2/issue/createmeta/${jiraProject}/issuetypes/${xrayTestSetId}`;
    const xrayTestSetMetaDataResponse = await requestHelper.get(xrayTestSetMetaDataUrl, requestHeaders);

    // Get the fieldId for schema.custom which has "com.xpandit.plugins.xray:test-sets-tests-custom-field"
    // This would be used to map the xray tests to it's test sets
    const { fieldId: xrayTestSetFieldId } = xrayTestSetMetaDataResponse.values.find((item: { schema: { custom: string; }; }) => item.schema.custom === 'com.xpandit.plugins.xray:test-sets-tests-custom-field');

    // Get the meta data information for the Xray Test Execution (`${xrayTestExecutionId}`) of given jira project (`${jiraProject}`)
    const xrayTestExecutionMetaDataUrl = `${jiraProtocol}://${jiraHost}/rest/api/2/issue/createmeta/${jiraProject}/issuetypes/${xrayTestExecutionId}`;
    const xrayTestExecutionMetaDataResponse = await requestHelper.get(xrayTestExecutionMetaDataUrl, requestHeaders);

    // Get the fieldId for schema.custom which has "com.xpandit.plugins.xray:testexec-tests-custom-field"
    // This would be used to map test sets to it's test execution
    const { fieldId: xrayTestExecutionFieldId } = xrayTestExecutionMetaDataResponse.values.find((item: { schema: { custom: string; }; }) => item.schema.custom === 'com.xpandit.plugins.xray:testexec-tests-custom-field');

    return ({
        xrayTestIssueType,
        xrayTestId,
        xrayTestSetId,
        xrayTestExecutionId,
        xrayTestTypeFieldId,
        xrayTestTypeId,
        xrayCucumberTestFieldId,
        xrayCucumberTestTypeMappings,
        xrayCucumberTestStepFieldId,
        xrayTestSetFieldId,
        xrayTestExecutionFieldId
    } as XRAY_FIELD_IDS);
}

export const getExistingTickets = async (jiraProtocol: string, jiraHost: string, jiraProject: string, xrayTestIssueType: string, xrayCucumberTestFieldId: string, xrayCucumberTestStepFieldId: string, requestHeaders: object) => {
    const url = `${jiraProtocol}://${jiraHost}/rest/api/2/search`;
    const body = {
        jql: `project = ${jiraProject} AND issuetype = '${xrayTestIssueType}'`,
        fields: [
            'issuetype',
            'status',
            'summary',
            'labels',
            xrayCucumberTestFieldId,
            xrayCucumberTestStepFieldId
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
        if (issue.fields[xrayCucumberTestFieldId]) {
            return ({
                key: issue.key,
                issueId: issue.id,
                issueType: xrayTestIssueType,
                issueStatus: issue.fields.status.name,
                summary: issue.fields.summary.toString().trim().replace(/[^a-zA-Z0-9-:,() ]/g, ''),
                labels: issue.fields.labels,
                xrayCucumberTestType: issue.fields[xrayCucumberTestFieldId].value,
                xrayCucumberTestStep: issue.fields[xrayCucumberTestStepFieldId]
            })
        }
    }) as EXISTING_TICKETS[]);
}

export const createNewTicket = async (jiraProtocol: string, jiraHost: string, body: object, requestHeaders: object) => {
    const url = `${jiraProtocol}://${jiraHost}/rest/api/2/issue`;
    const response = await requestHelper.post(url, body, requestHeaders);
    return Promise.resolve(`XRAY: New ticket ${_.get(response, 'key')} created for ${_.get(body, 'fields.summary')}`);
}

export const updateExistingTicket = async (jiraProtocol: string, jiraHost: string, issueId: string, body: object, requestHeaders: object) => {
    const url = `${jiraProtocol}://${jiraHost}/rest/api/2/issue/${issueId}`;
    await requestHelper.put(url, body, requestHeaders);
}

export const getTransitionId = async (jiraProtocol: string, jiraHost: string, issueId: string, transitionNames: string[], requestHeaders: object) => {
    const url = `${jiraProtocol}://${jiraHost}/rest/api/2/issue/${issueId}/transitions`;
    const response = await requestHelper.get(url, requestHeaders);
    const { transitions } = response;
    return Promise.resolve(_.get(_.find(transitions, (transition) => transitionNames.includes(transition.name)), 'id'));
}

export const updateIssueTransitions = async (jiraProtocol: string, jiraHost: string, issueId: string, body: object, requestHeaders: object) => {
    const url = `${jiraProtocol}://${jiraHost}/rest/api/2/issue/${issueId}/transitions?expand=transitions.fields`;
    await requestHelper.post(url, body, requestHeaders);
}

export const getTestExecutionIds = async (jiraProtocol: string, jiraHost: string, xrayTestExecutionId: string, xrayTestExecutionFieldId: string, requestHeaders: object) => {
    const url = `${jiraProtocol}://${jiraHost}/rest/api/2/issue/${xrayTestExecutionId}`;
    const response = await requestHelper.get(url, requestHeaders);    
    const testExecutionIds = response.fields[xrayTestExecutionFieldId];
    return testExecutionIds;
}

export const updateExecutionResult = async (jiraProtocol: string, jiraHost: string, xrayTestExecutionId: string, xrayTestStatus: string, requestHeaders: object) => {
    const url = `${jiraProtocol}://${jiraHost}/rest/raven/1.0/api/testrun/${xrayTestExecutionId}/status?status=${xrayTestStatus}`;
    await requestHelper.put(url, {}, requestHeaders);
}

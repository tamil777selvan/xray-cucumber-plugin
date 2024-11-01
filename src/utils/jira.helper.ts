import _ from 'lodash';

import { requestHelper } from './request.helper.js';
import { XRAY_FIELD_IDS, EXISTING_TICKET } from '../types/types.js';

/**
 * Represents the response structure for issue types.
 */
interface IssueTypeResponse {
    self: string;
    id: string;
    description: string;
    iconUrl: string;
    name: string;
    subtask: boolean;
    avatarId: number;
}

/**
 * Represents the response structure for issue type metadata.
 */
interface CreateMetaResponse {
    maxResults: number;
    startAt: number;
    total: number;
    isLast: boolean;
    values: {
        required: boolean;
        schema: {
            type: string;
            system?: string;
            custom?: string;
            customId?: number;
        };
        name: string;
        fieldId: string;
        hasDefaultValue: boolean;
        operations: Array<string>;
        allowedValues: {
            self: string;
            id: string;
            description: string;
            iconUrl: string;
            name: string;
            subtask: boolean;
            avatarId: number;
            value?: string;
            disabled?: boolean;
        }[];
    }[];
}

/**
 * Get the ID of an issue type by name.
 *
 * @param {string} jiraProtocol - The protocol for the Jira host (e.g., 'https').
 * @param {string} jiraHost - The hostname of the Jira instance.
 * @param {object} requestHeaders - Headers for the HTTP request.
 * @param {string[]} issueTypeNames - An array of issue type names to search for.
 * @returns {Promise<string|null>} The ID of the found issue type, or null if not found.
 */
const getIssueTypeIdByName = async (jiraProtocol: string, jiraHost: string, requestHeaders: object, issueTypeNames: string[]): Promise<string | null> => {
    const url = `${jiraProtocol}://${jiraHost}/rest/api/2/issuetype`;
    const response: IssueTypeResponse[] = await requestHelper.get(url, requestHeaders);
    const foundIssue = response.find(({ name }) => issueTypeNames.includes(name));
    return foundIssue ? foundIssue.id : null;
};

/**
 * Retrieve the issue type metadata for a project with a specific issue type ID.
 *
 * @param {string} jiraProtocol - The protocol for the Jira host (e.g., 'https').
 * @param {string} jiraHost - The hostname of the Jira instance.
 * @param {string} jiraProject - The Jira project key.
 * @param {string} issueTypeId - The issue type ID to retrieve metadata for.
 * @param {object} requestHeaders - Headers for the HTTP request.
 * @returns {Promise<CreateMetaResponse>} The issue type metadata response.
 */
const getIssueTypeMetadata = async (
    jiraProtocol: string,
    jiraHost: string,
    jiraProject: string,
    issueTypeId: string,
    requestHeaders: object
): Promise<CreateMetaResponse> => {
    const xrayTestMetaDataUrl = `${jiraProtocol}://${jiraHost}/rest/api/2/issue/createmeta/${jiraProject}/issuetypes/${issueTypeId}`;
    return await requestHelper.get(xrayTestMetaDataUrl, requestHeaders);
};

/**
 * Get the name of an allowed value by field ID.
 *
 * @param {CreateMetaResponse} issueTypeResponse - The issue type response object.
 * @param {string} fieldId - The field ID to search for in issueTypeResponse.
 * @returns {string|null} The name of the allowed value, or null if not found.
 */
const getAllowedValueNameByFieldId = (issueTypeResponse: CreateMetaResponse, fieldId: string): string | null => {
    const field = issueTypeResponse.values.find((item) => item.fieldId === fieldId);
    if (field && field.allowedValues) {
        return _.get(_.first(field.allowedValues), 'name', null);
    }
    return null;
};

/**
 * Get the ID of an issue type by schema name.
 *
 * @param {CreateMetaResponse} issueTypeResponse - The issue type response object.
 * @param {string} schemaName - The name of the custom field in schema.
 * @returns {string|null} The ID of the issue type, or null if not found.
 */
const getFieldIdByCustomSchema = (issueTypeResponse: CreateMetaResponse, schemaName: string): string | null => {
    const field = issueTypeResponse.values.find((item) => item.schema.custom === schemaName);
    return field ? field.fieldId : null;
};

/**
 * Get the ID of an allowed value by schema name and allowed value.
 *
 * @param {CreateMetaResponse} issueTypeResponse - The issue type response object.
 * @param {string} schemaName - The name of the custom field in schema.
 * @param {string} allowedValue - The value to match in allowedValues.
 * @returns {string|null} The ID of the allowed value, or null if not found.
 */
const getAllowedValueIdByCustomSchemaAndAllowedValue = (issueTypeResponse: CreateMetaResponse, schemaName: string, allowedValue: string): string | null => {
    const field = issueTypeResponse.values.find((item) => item.schema.custom === schemaName);
    if (field && field.allowedValues) {
        const foundAllowedValue = field.allowedValues.find((value) => value.value === allowedValue);
        return foundAllowedValue ? foundAllowedValue.id : null;
    }
    return null;
};

/**
 * Get a mapping of Xray Cucumber Test types.
 *
 * @param {CreateMetaResponse} issueTypeResponse - The issue type response object.
 * @param {string} xrayCucumberTestFieldId - The field ID for Xray Cucumber Test types.
 * @returns {object} An object mapping Xray Cucumber Test types.
 */
const getXrayCucumberTestTypeMappings = (issueTypeResponse: CreateMetaResponse, xrayCucumberTestFieldId: string): object => {
    const field = issueTypeResponse.values.find((item) => item.schema.custom === xrayCucumberTestFieldId);
    if (field && field.allowedValues) {
        return field.allowedValues.reduce((acc, obj) => {
            acc[obj.value] = obj.id;
            return acc;
        }, {});
    }
    return {};
};

/**
 * Get Xray field IDs for a Jira project.
 *
 * @param {string} jiraProtocol - The protocol for the Jira host (e.g., 'https').
 * @param {string} jiraHost - The hostname of the Jira instance.
 * @param {string} jiraProject - The Jira project key.
 * @param {object} requestHeaders - Headers for the HTTP request.
 * @returns {Promise<XRAY_FIELD_IDS>} An object containing various Xray field IDs.
 */
export const getXrayFieldIds = async (jiraProtocol: string, jiraHost: string, jiraProject: string, requestHeaders: object): Promise<XRAY_FIELD_IDS> => {
    const xrayTestId = await getIssueTypeIdByName(jiraProtocol, jiraHost, requestHeaders, ['Xray Test', 'Test']);

    const xrayTestIdCreateMetaResponse = await getIssueTypeMetadata(jiraProtocol, jiraHost, jiraProject, xrayTestId, requestHeaders);

    const xrayTestIssueType = getAllowedValueNameByFieldId(xrayTestIdCreateMetaResponse, 'issuetype');

    const xrayTestTypeFieldId = getFieldIdByCustomSchema(xrayTestIdCreateMetaResponse, 'com.xpandit.plugins.xray:test-type-custom-field');

    const xrayTestTypeId = getAllowedValueIdByCustomSchemaAndAllowedValue(
        xrayTestIdCreateMetaResponse,
        'com.xpandit.plugins.xray:test-type-custom-field',
        'Cucumber'
    );

    const xrayCucumberTestFieldId = getFieldIdByCustomSchema(xrayTestIdCreateMetaResponse, 'com.xpandit.plugins.xray:automated-test-type-custom-field');

    const xrayCucumberTestTypeMappings = getXrayCucumberTestTypeMappings(
        xrayTestIdCreateMetaResponse,
        'com.xpandit.plugins.xray:automated-test-type-custom-field'
    );

    const xrayCucumberTestStepFieldId = getFieldIdByCustomSchema(xrayTestIdCreateMetaResponse, 'com.xpandit.plugins.xray:steps-editor-custom-field');

    const xrayTestSetId = await getIssueTypeIdByName(jiraProtocol, jiraHost, requestHeaders, ['Xray Test Set', 'Test Set']);

    const xrayTestSetIdCreateMetaResponse = await getIssueTypeMetadata(jiraProtocol, jiraHost, jiraProject, xrayTestSetId, requestHeaders);

    const xrayTestSetFieldId = getFieldIdByCustomSchema(xrayTestSetIdCreateMetaResponse, 'com.xpandit.plugins.xray:test-sets-tests-custom-field');

    const xrayTestExecutionId = await getIssueTypeIdByName(jiraProtocol, jiraHost, requestHeaders, ['Xray Test Execution', 'Test Execution']);

    const xrayTestExecutionIdCreateMetaResponse = await getIssueTypeMetadata(jiraProtocol, jiraHost, jiraProject, xrayTestExecutionId, requestHeaders);

    const xrayTestExecutionFieldId = getFieldIdByCustomSchema(xrayTestExecutionIdCreateMetaResponse, 'com.xpandit.plugins.xray:testexec-tests-custom-field');

    return {
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
    } as XRAY_FIELD_IDS;
};

/**
 * Get existing tickets of a specific issue type within a Jira project.
 *
 * @param {string} jiraProtocol - The protocol for the Jira host (e.g., 'https').
 * @param {string} jiraHost - The hostname of the Jira instance.
 * @param {string} jiraProject - The Jira project key.
 * @param {string} xrayTestIssueType - The issue type to filter by.
 * @param {string} xrayCucumberTestFieldId - The field ID for Xray Cucumber Test types.
 * @param {string} xrayCucumberTestStepFieldId - The field ID for Xray Cucumber Test steps.
 * @param {object} requestHeaders - Headers for the HTTP request.
 * @returns {Promise<EXISTING_TICKET[]>} A promise that resolves to an array of existing tickets of the specified issue type.
 */
export const getExistingTickets = async (
    jiraProtocol: string,
    jiraHost: string,
    jiraProject: string,
    xrayTestIssueType: string,
    xrayCucumberTestFieldId: string,
    xrayCucumberTestStepFieldId: string,
    requestHeaders: object
): Promise<EXISTING_TICKET[]> => {
    const url = `${jiraProtocol}://${jiraHost}/rest/api/2/search`;
    const fields = ['issuetype', 'status', 'summary', 'labels', xrayCucumberTestStepFieldId];
    const body = {
        jql: `project = ${jiraProject} AND issuetype = '${xrayTestIssueType}'`,
        fields: _.isEmpty(xrayCucumberTestFieldId) ? fields : fields.push(xrayCucumberTestFieldId),
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

    return Promise.resolve(
        _.remove(
            issues.map((issue) => {
                if (issue.fields[xrayCucumberTestStepFieldId]) {
                    return {
                        key: issue.key,
                        issueId: issue.id,
                        issueType: xrayTestIssueType,
                        issueStatus: issue.fields.status.name,
                        summary: issue.fields.summary
                            .toString()
                            .trim()
                            .replace(/[^a-zA-Z0-9-:,() ]/g, ''),
                        labels: issue.fields.labels,
                        xrayCucumberTestType: issue.fields[xrayCucumberTestFieldId]?.value || 'Cucumber Scenario',
                        xrayCucumberTestStep: issue.fields[xrayCucumberTestStepFieldId]
                    };
                }
            }) as EXISTING_TICKET[]
        )
    );
};

/**
 * Create a new Jira ticket.
 *
 * @param {string} jiraProtocol - The protocol for the Jira host (e.g., 'https').
 * @param {string} jiraHost - The hostname of the Jira instance.
 * @param {object} body - The request body containing ticket details.
 * @param {object} requestHeaders - Headers for the HTTP request.
 * @returns {Promise<string>} A promise that resolves to a message indicating the creation of the new ticket.
 */
export const createNewTicket = async (jiraProtocol: string, jiraHost: string, body: object, requestHeaders: object): Promise<string> => {
    const url = `${jiraProtocol}://${jiraHost}/rest/api/2/issue`;
    const response = await requestHelper.post(url, body, requestHeaders);
    return Promise.resolve(`XRAY: New ticket ${_.get(response, 'key')} created for ${_.get(body, 'fields.summary')}`);
};

/**
 * Update an existing Jira ticket.
 *
 * @param {string} jiraProtocol - The protocol for the Jira host (e.g., 'https').
 * @param {string} jiraHost - The hostname of the Jira instance.
 * @param {string} issueId - The ID of the Jira ticket to update.
 * @param {object} body - The request body containing the updated ticket details.
 * @param {object} requestHeaders - Headers for the HTTP request.
 */
export const updateExistingTicket = async (jiraProtocol: string, jiraHost: string, issueId: string, body: object, requestHeaders: object) => {
    const url = `${jiraProtocol}://${jiraHost}/rest/api/2/issue/${issueId}`;
    await requestHelper.put(url, body, requestHeaders);
};

/**
 * Get the ID of a Jira ticket's transition by name.
 *
 * @param {string} jiraProtocol - The protocol for the Jira host (e.g., 'https').
 * @param {string} jiraHost - The hostname of the Jira instance.
 * @param {string} issueId - The ID of the Jira ticket.
 * @param {string[]} transitionNames - An array of transition names to search for.
 * @param {object} requestHeaders - Headers for the HTTP request.
 * @returns {Promise<string|undefined>} A promise that resolves to the ID of the found transition or null if not found.
 */
export const getTransitionId = async (
    jiraProtocol: string,
    jiraHost: string,
    issueId: string,
    transitionNames: string[],
    requestHeaders: object
): Promise<string | undefined> => {
    const url = `${jiraProtocol}://${jiraHost}/rest/api/2/issue/${issueId}/transitions`;
    const response = await requestHelper.get(url, requestHeaders);
    const { transitions } = response;
    return Promise.resolve(
        _.get(
            _.find(transitions, (transition) => transitionNames.includes(transition.name)),
            'id'
        )
    );
};

/**
 * Update issue transitions for a Jira ticket.
 *
 * @param {string} jiraProtocol - The protocol for the Jira host (e.g., 'https').
 * @param {string} jiraHost - The hostname of the Jira instance.
 * @param {string} issueId - The ID of the Jira ticket.
 * @param {object} body - The request body containing transition details.
 * @param {object} requestHeaders - Headers for the HTTP request.
 */
export const updateIssueTransitions = async (jiraProtocol: string, jiraHost: string, issueId: string, body: object, requestHeaders: object) => {
    const url = `${jiraProtocol}://${jiraHost}/rest/api/2/issue/${issueId}/transitions?expand=transitions.fields`;
    await requestHelper.post(url, body, requestHeaders);
};

interface TestExecutionIds {
    b: string;
    c: number;
}
/**
 * Get the test execution IDs associated with a specific Xray Test Execution.
 *
 * @param {string} jiraProtocol - The protocol for the Jira host (e.g., 'https').
 * @param {string} jiraHost - The hostname of the Jira instance.
 * @param {string} xrayTestExecutionId - The ID of the Xray Test Execution.
 * @param {string} xrayTestExecutionFieldId - The field ID for test execution data.
 * @param {object} requestHeaders - Headers for the HTTP request.
 * @returns {Promise<TestExecutionIds[]>} A promise that resolves to the test execution IDs.
 */
export const getTestExecutionIds = async (
    jiraProtocol: string,
    jiraHost: string,
    xrayTestExecutionId: string,
    xrayTestExecutionFieldId: string,
    requestHeaders: object
): Promise<any> => {
    const url = `${jiraProtocol}://${jiraHost}/rest/api/2/issue/${xrayTestExecutionId}`;
    const response = await requestHelper.get(url, requestHeaders);
    const testExecutionIds = response.fields[xrayTestExecutionFieldId];
    return testExecutionIds as TestExecutionIds[];
};

/**
 * Update the execution result of a specific Xray Test Execution.
 *
 * @param {string} jiraProtocol - The protocol for the Jira host (e.g., 'https').
 * @param {string} jiraHost - The hostname of the Jira instance.
 * @param {string} xrayTestExecutionId - The ID of the Xray Test Execution.
 * @param {string} xrayTestStatus - The new status for the test execution.
 * @param {object} requestHeaders - Headers for the HTTP request.
 */
export const updateExecutionResult = async (
    jiraProtocol: string,
    jiraHost: string,
    xrayTestExecutionId: string,
    xrayTestStatus: string,
    requestHeaders: object
) => {
    const url = `${jiraProtocol}://${jiraHost}/rest/raven/1.0/api/testrun/${xrayTestExecutionId}/status?status=${xrayTestStatus}`;
    await requestHelper.put(url, {}, requestHeaders);
};

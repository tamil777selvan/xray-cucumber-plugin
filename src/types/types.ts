export interface JIRA_OPTIONS {
    /**
	 * Protocol of JIRA.
	 * @default 'https'
	 */
    jiraProtocol: string;
    /**
	 * Host address of JIRA.
	 */
    jiraHost: string;
    /**
	 * JIRA Project Key to which XRAY tests need to be updated.
	 */
    jiraProject: string;
    /**
	 * JIRA Username for authentication.
	 * @default process.env.JIRA_USERNAME
	 */
    jiraUsername?: string;
    /**
	 * JIRA Password for authentication.
	 * @default process.env.JIRA_PASSWORD
	 */
    jiraPassword?: string;
    /**
	 * JIRA Token for authentication.
	 * @default process.env.JIRA_TOKEN
	 */
    jiraToken?: string;
    /**
	 * Authorization Token.
	 * @default null
	 */
    headers?: {
        Authorization?: string | null;
    };
}

interface XRAY_TEST_SET {
    /**
	 * Tag expression with which Xray Tests would be mapped with test sets.
	 */
    tags: string;
    /**
	 * List of Xray Test Set Ids to which the Xray Tests need to be added.
	 */
    testSetId: string[];
    /**
	 * Internal parameter that holds the mapping details of Xray Test Set Id with Xray Test Case Ids.
	 */
    tests?: any[];
}

export interface XRAY_TEST_SET_MAPPING {
    [key: string]: XRAY_TEST_SET;
}

export interface INIT_OPTIONS extends JIRA_OPTIONS {
    /**
	 * Root folder path where the feature files are located.
	 */
    featureFolderPath?: string;
    /**
	 * Filter feature files from a specific folder, which should be a child of `featureFolderPath`.
	 * @default '/'
	 */
    featureFolderFilter?: string;
    /**
	 * Filter features based on Cucumber tag expressions.
	 * @default ''
	 */
    featureTagFilter?: string;
    /**
	 * Regex Pattern used to identify specific text from the scenario's description for replacement.
	 * @default undefined
	 */
    scenarioDescriptionRegex?: RegExp;
    /**
	 * Value to be replaced for the identified regex pattern from `scenarioDescriptionRegex`.
	 * @default undefined
	 */
    scenarioDescriptionRegexReplaceValue?: string;
    /**
	 * Set to true to update test sets based on the mapping given in `testSetMappingDetails`.
	 * @default false
	 */
    updateTestSetMappings?: boolean;
    /**
	 * Map Xray Tests to Test Sets based on tags.
	 * @default undefined
	 */
    testSetMappingDetails?: XRAY_TEST_SET_MAPPING;
}

export interface XRAY_FIELD_IDS {
    /**
	 * Type of Xray Test Issue Ex., Xray Test / Test
	 */
    xrayTestIssueType: string;
    /**
	 * ID of Xray Test / Test
	 */
    xrayTestId: string;
    /**
	 * ID of Xray Test Set / Test Set
	 */
    xrayTestSetId: string;
    /**
	 * ID of Xray Test Execution / Test Execution
	 */
    xrayTestExecutionId: string;

    /**
	 * Field Id to specify which type of Xray Test (Manual / Cucumber / Generic)
	 */
    xrayTestTypeFieldId: string;
    /**
	 * ID of Xray Cucumber Test
	 */
    xrayTestTypeId: string;

    /**
	 * Field Id to specify which type of Xray Cucumber Test (Scenario / Scenario Outline)
	 */
    xrayCucumberTestFieldId: string;
    /**
	 * Mapping Object contains the Id of each Xray Cucumber Test
	 */
    xrayCucumberTestTypeMappings: { Scenario: string; 'Scenario Outline': string };

    /**
	 * Field Id used to add the cucumber steps
	 */
    xrayCucumberTestStepFieldId: string;

    /**
	 * Field Id used to map the xray tests to it's test sets
	 */
    xrayTestSetFieldId: string;

    /**
	 * Field Id used to map test sets to it's test execution
	 */
    xrayTestExecutionFieldId: string;
}

export interface PARSED_DATA {
    /**
	 * Tags from Feature File which include both feature & scenario level
	 */
    tags: string;
    /**
	 * Type of scenario (Scenario / Scenario Outline)
	 */
    scenarioType: string;
    /**
	 * Name of the scenario
	 */
    scenarioName: string;
    /**
	 * Gherkin steps of the scenario
	 */
    scenarioSteps: string;
}

export interface EXISTING_TICKET {
    /**
	 * Issue Key
	 */
    key: string;
    /**
	 * Issue Id
	 */
    issueId: string;
    /**
	 * Issue Type
	 */
    issueType: string;
    /**
	 * Issue Status
	 */
    issueStatus: string;
    /**
	 * Issue Summary
	 */
    summary: string;
    /**
	 * Issue Labels
	 */
    labels: string[];
    /**
	 * Type of Xray Test (Scenario / Scenario Outline)
	 */
    xrayCucumberTestType: string;
    /**
	 * Gherkin steps of the Xray Test
	 */
    xrayCucumberTestStep: string;
}

interface PARSED_TEST_RESULT {
    [scenarioName: string]: string;
}

export interface TEST_EXECUTION_OPTION extends JIRA_OPTIONS {
    /**
	 * List of Test Execution IDs to which reports need to be updated.
	 */
    testExecutionIds?: string[];
    /**
	 * Root folder path where the cucumber JSON output files are stored.
	 * @default undefined
	 */
    cucumberJsonReportFolderPath?: string;
    /**
	 * Parsed test result details list.
	 * @default undefined
	 */
    parsedTestResultDetails?: PARSED_TEST_RESULT[];
    /**
	 * Skip updating execution tickets for failed test cases.
	 * @default false
	 */
    skipUpdatingFailedCase?: boolean;
}

export interface LINT_OPTIONS {
    /**
	 * Root folder path where the feature files are located.
	 */
    featureFolderPath?: string;
    /**
	 * Filter feature files from a specific folder, which should be a child of `featureFolderPath`.
	 * @default '/'
	 */
    featureFolderFilter?: string;
}

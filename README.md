# Xray Cucumber Plugin - Streamline Your Testing Workflow

The Xray Cucumber Plugin is a robust tool that seamlessly integrates your **Xray Tests** and **Xray Test Sets** with your source code. It offers a comprehensive range of features to simplify your testing process and effortlessly update test results back to the **Xray Test Executions**.

## Key Features

-   **Automated Test Management:** Automatically create, update, and close Xray Tests based on your code changes.
-   **Duplicate Test Handling:** Detect and close duplicate Xray Tests to maintain data accuracy.
-   **Scenario Outline Handling:** Simplify scenario outlines by converting them into a scenario.
-   **Scenario Name and Description Validation:** Check for duplicate scenario names and enforce a description length limit of 250 characters.
-   **Selective Syncing:** Allows syncing tests by filtering based on "Cucumber tags" or specific "folder" names.
-   **Efficient Test Set Mapping:** Map Xray Tests to Xray Test Sets seamlessly.
-   **Result Updates:** Effortlessly update test results to Xray from Cucumber JSON reports.
-   **Linting:** Independently lint feature files for proper formatting and adherence to standards.

## Installation

You can install the Xray Cucumber Plugin using npm:

```bash
npm i xray-cucumber-plugin
```

## Prerequisite: Optimize Scenario Outlines

Before using the plugin, optimize feature files containing "Scenario Outline." Append example parameters to scenario descriptions to improve test result accuracy. For example:

### Existing Approach

```cucumber
Feature: Test

Scenario Outline: PreRequisite Document
	Given ......
	......
	......

	Examples:
	| title1 | title2 |
	| value0 | value1 |
	| value2 | value3 |
```

### Optimized Integration

```cucumber
Feature: Test

Scenario Outline: PreRequisite Document (Example - title1: <title1>, title2: <title2>)
	Given ......
	......
	......

	Examples:
	| title1 | title2 |
	| value0 | value1 |
	| value2 | value3 |
```

This adjustment ensures accurate Cucumber JSON reports for updating test results in XRAY.

## Streamlined Xray Test Management and Result Updates

### Configuration

Configure the Xray Cucumber Plugin to streamline your testing workflow with Xray. Import the `XrayCucumberPlugin` module and specify your options:

```javascript
import XrayCucumberPlugin from 'xray-cucumber-plugin';

const options = {
    featureFolderPath: './features',
    featureFolderFilter: 'OptimizedE2EPack',
    featureTagFilter: '',
    scenarioDescriptionRegex: /TC_\d\d /gm,
    scenarioDescriptionRegexReplaceValue: 'XCP ',
    jiraHost: 'jira.********.com',
    jiraProject: 'JIRA',
    jiraUsername: 'demo.jira',
    jiraPassword: 'StrongPassword#1',
    jiraToken: 'StrongToken#1',
    updateTestSetMappings: true,
    testSetMappingDetails: {
        testSet1: {
            tags: '@sanity and @manual',
            testSetId: ['JIRA-1'],
            tests: []
        }
    }
};

XrayCucumberPlugin.init(options);
```

### Exposed Options (Init Method)

-   `featureFolderPath`: Root folder path for feature files.
-   `featureFolderFilter`: Filter feature files by folder (Default: '/')
-   `featureTagFilter`: Filter scenarios using tag expressions (Default: '')
-   `scenarioDescriptionRegex`: Regular expression for specific scenario description content.
-   `scenarioDescriptionRegexReplaceValue`: Value to replace matched content in scenario descriptions.
-   `jiraHost`: JIRA endpoint.
-   `jiraProject`: JIRA project key.
-   `jiraUsername`: Authorized JIRA username (Default: process.env.JIRA_USERNAME).
-   `jiraPassword`: JIRA password for the specified username (Default: process.env.JIRA_PASSWORD).
-   `jiraToken`: JIRA token for authentication and authorization (Default: process.env.JIRA_TOKEN).
-   `updateTestSetMappings`: Enable mapping Xray Tests to Xray Test Sets (Default: false).
-   `testSetMappingDetails`: Mapping details for tests and test sets based on Cucumber tag expressions.

**Note:**

-   Options provided in `init` override default values.
-   Either `jiraUsername` & `jiraPassword` or `jiraToken` is required.

### Structure of `testSetMappingDetails`

```javascript
{
	testSet1: {
		tags: '@sanity and @manual',
		testSetId: ['JIRA-1']
	},
	testSet2: {
		tags: '@sanity and not @manual',
		testSetId: ['JIRA-2', 'JIRA-3']
	}
}
```

-   `testSet1 / testSet2`: Unique identifiers for test sets.
-   `tags`: Filter Xray Tests based on tag expressions.
-   `testSetId`: Xray Test Set IDs for mapping tests.

**Note:** The `testSetMappingDetails` object can contain multiple nested objects.

## Updating Test Execution Results

Ensure your test execution results are accurately updated in Xray. Import the `XrayCucumberPlugin` module and provide your options:

```javascript
import XrayCucumberPlugin from 'xray-cucumber-plugin';

const options = {
    jiraHost: 'jira.********.com',
    jiraProject: 'JIRA',
    jiraUsername: 'demo.jira',
    jiraPassword: 'StrongPassword#1',
    jiraToken: 'StrongToken#1',
    testExecutionIds: ['JIRA-6'],
    cucumberJsonReportFolderPath: './json_report'
};

XrayCucumberPlugin.updateTestExecutionResults(options);
```

### Exposed Options (UpdateTestExecutionResults Method)

-   `jiraProtocol`: Protocol for JIRA connection (HTTP/HTTPS) (Default: HTTPS).
-   `jiraHost`: JIRA endpoint.
-   `jiraProject`: JIRA project key.
-   `jiraUsername`: Authorized JIRA username (Default: process.env.JIRA_USERNAME).
-   `jiraPassword`: JIRA password for the specified username (Default: process.env.JIRA_PASSWORD).
-   `jiraToken`: JIRA token for authentication and authorization (Default: process.env.JIRA_TOKEN).
-   `testExecutionIds`: List of Xray Test Execution IDs for result updates.
-   `cucumberJsonReportFolderPath`: Root folder path for Cucumber JSON reports.
-   `parsedTestResultDetails`: Optional custom-formed result list for updating test execution results.
-   `skipUpdatingFailedCase`: Skip updating failed test cases in corresponding test execution tickets (Default: false).

**Note:**

-   Options provided in `updateTestExecutionResults` override default values.
-   Either `jiraUsername` & `jiraPassword` or `jiraToken` is required.

### Structure of `parsedTestResultDetails`

```javascript
[
    {
        'Test Scenario One': 'PASS',
        'Test Scenario Two': 'PASS',
        'Test Scenario Outline One': 'PASS',
        'Test Scenario Outline Two': 'Fail'
    }
];
```

**Note:**

-   `parsedTestResultDetails` is an array of objects where each object should have a key-value pair of `scenarioName` and `scenarioStatus`.

With these streamlined configurations, you can effectively manage Xray Tests, Test Sets, and ensure accurate test execution result updates. Remember to replace placeholder values with your specific project details. Modify the configurations as needed to suit your requirements. The Xray Cucumber Plugin simplifies your testing workflow and keeps Xray in sync with your source code.

## Lint Feature File

You can independently lint feature files for proper formatting and adherence to standards.

```javascript
import XrayCucumberPlugin from 'xray-cucumber-plugin';

const options = {
    featureFolderPath: './features',
    featureFolderFilter: 'OptimizedE2EPack',
    scenarioDescriptionRegex: /TC_\d\d /gm,
    scenarioDescriptionRegexReplaceValue: ''
};

void XrayCucumberPlugin.lintFeatureFiles(options);
```

### Exposed Options (lintFeatureFiles Method)

-   `featureFolderPath`: Root folder path for feature files.
-   `featureFolderFilter`: Filter feature files by folder (Default: '/')
-   `scenarioDescriptionRegex`: Regular expression for specific scenario description content.
-   `scenarioDescriptionRegexReplaceValue`: Value to replace matched content in scenario descriptions.

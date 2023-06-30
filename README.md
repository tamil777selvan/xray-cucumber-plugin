# Xray Cucumber Plugin

The Xray Cucumber Plugin is a powerful tool that seamlessly synchronizes your **Xray Tests** and **Xray Test Sets** with your source code. It provides a comprehensive set of features to streamline your testing workflow and effortlessly update test results back to the **Xray Test Executions**.

## Key Features

- Automatic creation of new Xray Tests when scenarios are added.
- Updating existing Xray Tests if scenarios are modified.
- Closure of Xray Tests when scenarios are removed from the codebase.
- Detection and closure of duplicate Xray Tests, if any.
- Reopening closed Xray Tests when removed scenarios are added back to the codebase.
- Conversion of scenario outlines with multiple examples into a single example.
- Duplicate scenario name checks before syncing to ensure data accuracy.
- Enforcement of a scenario description length limit of 250 characters.
- Test filtering based on "cucumber tags" or specific "folder" names for selective syncing.
- Unique splitting of Xray Tests when mapping to Xray Test Sets.
- Seamless update of test results to the execution tickets from Cucumber JSON reports or a parsed test result list.
- Independent linting of feature files to ensure proper formatting and adherence to standards.

## Installation

```bash
npm i xray-cucumber-plugin
```

## Prerequisite

Before using the plugin, a one-time manual configuration is required for feature files containing "Scenario Outline". The description of each Scenario Outline must have a postfix with its example parameters.

Here is an example of the existing approach:

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

To optimize integration with the Cucumber JSON report, update the scenario outline description as follows:

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

This minor adjustment to the scenario outline ensures that the Cucumber JSON report contains the compiled examples, which improves the accuracy of updating test results in XRAY.

---

# Xray Tests & Xray Test Sets 

## Configuration

To configure the plugin, import the `XrayCucumberPlugin` module and specify the desired options:

```javascript
import XrayCucumberPlugin from 'xray-cucumber-plugin'

const options = {
	featureFolderPath: './features',
	featureFolderFilter: 'OptimisedE2EPack',
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
}
 
XrayCucumberPlugin.init(options);
```

## Exposed Options

The plugin provides the following options for configuration:

| Option | Description |
| :---:  | :--- |
| featureFolderPath | The relative path of the root folder that holds the feature files. |
| featureFolderFilter | Filter the feature files based on the specified folder.  `Default: '/'` |
| featureTagFilter | Filter the scenarios based on the provided tag expression. `Default: ''` | 
| scenarioDescriptionRegex | A regular expression used to find specific content in the scenario description. |
| scenarioDescriptionRegexReplaceValue | The value to replace the matched content in the scenario description. |
| jiraProtocol| The protocol for JIRA connection (HTTP/HTTPS). `Default: HTTPS` |
| jiraHost | The JIRA endpoint. |
| jiraProject | The key of the JIRA project to interact with. |
| jiraUsername | The authorized JIRA username with permissions for the selected project. `Default: process.env.JIRA_USERNAME` |
| jiraPassword | The JIRA password for the specified username. `Default: process.env.JIRA_PASSWORD` |
| jiraToken | The JIRA token for authentication and authorization. `Default: process.env.JIRA_TOKEN` |
| updateTestSetMappings | A boolean flag indicating whether to map Xray Tests with Xray Test Sets. `Default: false` |
| testSetMappingDetails | Mapping details of tests and test sets based on cucumber tag expressions. See the structure details below. |

**Note:** 
- When using the `init` function, the provided options override the default values.
- Either `jiraUsername` & `jiraPassword` or `jiraToken` is required.

## Structure of `testSetMappingDetails`

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

- `testSet1 / testSet2`: Unique names for identifying test sets. These names serve for understanding and syntax purposes.
- `tags`: Used to filter Xray Tests based on the specified tag expression.
- `testSetId`: A list of Xray Test Set IDs to which the tests will be mapped. The number of Xray Tests is divided equally based on the number of test sets provided.

**Note:** The `testSetMappingDetails` object can have any number of nested objects with the specified structure.

---

# Update Test Execution Results

## Configuration

To update test execution results, import the `XrayCucumberPlugin` module and provide the relevant options:

```javascript
import XrayCucumberPlugin from 'xray-cucumber-plugin'

const options = {
	jiraHost: 'jira.********.com',
	jiraProject: 'JIRA',
	jiraUsername: 'demo.jira',
	jiraPassword: 'StrongPassword#1',
    jiraToken: 'StrongToken#1',
	testExecutionIds: ['JIRA-6'],
	cucumberJsonReportFolderPath: './json_report'
}

XrayCucumberPlugin.updateTestExecutionResults(options);
```

## Exposed Options

The plugin provides the following options for updating test execution results:

| Option | Description |
| :---:  | :--- |
| jiraProtocol | The protocol for JIRA connection (HTTP/HTTPS). `Default: HTTPS` |
| jiraHost | The JIRA endpoint. |
| jiraProject | The key of the JIRA project to interact with. |
| jiraUsername | The authorized JIRA username with permissions for the selected project. `Default: process.env.JIRA_USERNAME` |
| jiraPassword | The JIRA password for the specified username. `Default: process.env.JIRA_PASSWORD` |
| jiraToken | The JIRA token for authentication and authorization. `Default: process.env.JIRA_TOKEN` |
| testExecutionIds | A list of Xray Test Execution IDs to which the results should be updated. |
| cucumberJsonReportFolderPath | The root folder path where the cucumber JSON report is stored. |
| parsedTestResultDetails | An optional custom-formed result list for updating test execution results. See the structure details below. |
| skipUpdatingFailedCase | Skip updating failed test cases to the corresponding test execution tickets. `Default: false` |

**Note:** 
- When using the `updateTestExecutionResults` function, the provided options override the default values.
- Either `jiraUsername` & `jiraPassword` or `jiraToken` is required.

## Structure of `parsedTestResultDetails`

```javascript
[
	{
		'Test Scenario One': 'PASS',
        'Test Scenario Two': 'PASS',
        'Test Scenario Outline One': 'PASS',
        'Test Scenario Outline Two': 'Fail',
	}
]
```

**Note:** 
 - `parsedTestResultDetails` is an array of objects where each object should have a key-value pair of `scenarioName` and `scenarioStatus`.

# Lint Feature Files

## Configuration

To lint the feature files independently regardless of other features of the plugin, import the `XrayCucumberPlugin` module and provide the relevant options:

```javascript
import XrayCucumberPlugin from 'xray-cucumber-plugin'

const options = {
	featureFolderPath: './features',
}

XrayCucumberPlugin.lintFeatureFiles(options);
```

## Exposed Options

The plugin provides the following options for linting the feature files independently:

| Option | Description |
| :---:  | :--- |
| featureFolderPath | The relative path of the root folder that holds the feature files. |
| featureFolderFilter | Filter the feature files based on the specified folder.  `Default: '/'` |

## Usage

1. Install the Xray Cucumber Plugin using the provided npm command.
2. Configure the plugin using the available options.
3. Use the plugin to synchronize Xray Tests and Test Sets with your source code.
4. Update test execution results by providing the relevant configuration options.

Remember to replace the placeholder values in the configuration examples with the appropriate information for your project. Feel free to modify the configurations to suit your specific needs.

With these improvements, the Xray Cucumber Plugin offers enhanced functionality and flexibility for managing and synchronizing your tests and test results with Xray.
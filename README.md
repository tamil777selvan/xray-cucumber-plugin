# Xray Cucumber Plugin

A Customised Xray Cucumber plugin that provides feature to **sync "Xray Tests" & "Xray Test Sets"** against your source code.

This plugin utilise JIRA Reset API's to achieve the synchronisations. 

# Features

- Create new Xray Tests when ever a scenario is added.
- Update existing Xray Tests if the scenario gets modified.
- Closes the Xray Tests if the scenario is removed from codebase.
- Closes duplicate Xray Tests if found.
- Re Opens the closed Xray Tests if the removed scenario is added back to codebase.
- Converts scenario outline with multiple examples into scenario outline with single example.
- Checks for duplicate scenario names before syncing.
- Lints for scenario's description length if more than 250 chars.
- Filter tests which needs to synced based on "cucumber tags" or specific "folder" name.
- Unique split of Xray Tests when mapping to Xray Test Sets.

## Installation

```bash
npm i xray-cucumber-plugin
```

## Configuration

```javascript
import XrayCucumberPlugin from 'xray-cucumber-plugin'

const  options = {
	featureFolderPath:  './features',
	featureFileFilter:  'OptimisedE2EPack',
	featureTagFilter:  '',
	jiraHost:  'jira.********.com',
	jiraProject:  'JIRA',
	jiraUsername:  'demo.jira',
	jiraPassword:  'StrongPassword#1',
	updateTestSetMappings:  true,
	testSetMappingDetails: {
		testSet1: {
			tags:  '@sanity and @manual',
			testSetId: ['JIRA-1'],
			tests: []
		}
	}
}
 
XrayCucumberPlugin.init(options);
```

## Exposed Options

| Option | Description |
| :---:  | :---: |
| featureFolderPath | Relative path of Root Folder which holds the Feature Files |
| featureFolderFilter | Once the Feature files are loaded from ${featureFolderPath}, filter files which are specific from given folder |
| featureTagFilter | Filter Scenario's based on the given tagExpression | 
| jiraHost | JIRA endpoint |
| jiraProject | JIRA Key of the project to interact with |
| jiraUsername | Authorized JIRA Username with permissions over the selected ProjectKey |
| jiraPassword | JIRA Password of given ${jiraUsername} |
| updateTestSetMappings | Boolean param, which takes care of mapping Xray Tests with Xray Tests Sets |
| testSetMappingDetails| Mapping details of the tests and test set based on cucumber tagExpression |

## Default Options

| Option | Default Value |
| :---:  | :---: |
| featureFolderFilter | '/' |
| featureTagFilter | ' ' |
| jiraUsername | process.env.JIRA_USERNAME |
| jiraPassword | process.env.JIRA_PASSWORD |
| updateTestSetMappings | false |

**Note :** Passing options via the `init` function takes precedence and overrides the default values.

## Structure of testSetMappingDetails

```javascript
{
	testSet1: {
		tags:  '@sanity and @manual',
		testSetId: ['JIRA-1'],
		tests: []
	},
	testSet2: {
		tags:  '@sanity and not @manual',
		testSetId: ['JIRA-2', 'JIRA-3'],
		tests: []
	}
}
```

- `testSet1 / testSet2` --> Unique name to identify your test sets easily. This can be of any name which is mainly used for our understanding and syntax purpose.  
- `tags` --> Used to filter Xray Tests based on the tagExpression given
- `testSetId` --> List of Xray Test Set Id's between which the tests needs to be mapped. Number of Xray Tests splits equally based on the number of tests sets provided and gets mapped.
- `tests` --> Used to store the equally spliced test Id's by the code. Just kept the syntax here by thinking a way to map the tests from different JIRA projects which can be a future requirement. Meanwhile keep this as empty and should not modify.

**Note :** `testSetMappingDetails` object can have "n number" of nested objects with it's defined structure.

## Debugging

Since this plugin consumes JIRA Rest API's to operate, those API logs are enabled only in debugging mode. 

The debugging mode doens't expose the endpoint details, rather just console the statuscode and the method of API call made.

To enable the debugging logs, below environment variable should be turned on as,

```bash
export XRAY_CUCUMBER_PLUGIN_DEBUG=true
```
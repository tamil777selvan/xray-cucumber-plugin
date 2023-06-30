import { INIT_OPTIONS, TEST_EXECUTION_OPTION, LINT_OPTIONS } from './types/types';

import { getXrayFieldIds } from './utils/jira.helper';
import { syncCucumberTests } from './syncCucumberTests';
import { syncTestSetMappings } from './syncTestSetMappings';
import { updateTestExecutionResults } from './updateTestExecutionResults';
import generateFeaturesToImport from './utils/featureFileParser';

const generateInputs = async (inputOptions: INIT_OPTIONS | TEST_EXECUTION_OPTION) => {
    const headers = {
        'Authorization': null
    }

    if (inputOptions.jiraUsername && inputOptions.jiraPassword) {
        headers.Authorization = `Basic ${Buffer.from(`${inputOptions.jiraUsername}:${inputOptions.jiraPassword}`).toString('base64')}`;
    }

    if (inputOptions.jiraToken) {
        headers.Authorization = `Bearer ${inputOptions.jiraToken}`;
    }

    const xrayFieldIds = await getXrayFieldIds(inputOptions.jiraProtocol, inputOptions.jiraHost, inputOptions.jiraProject, headers);

    return {
        ...inputOptions,
        ...xrayFieldIds,
        headers
    }
}

export default {
    init: async (options: INIT_OPTIONS) => {
        try {
            const defaults = {
                jiraProtocol: 'https',
                jiraUsername: process.env.JIRA_USERNAME,
                jiraPassword: process.env.JIRA_PASSWORD,
                jiraToken: process.env.JIRA_TOKEN,
                featureFolderFilter: '/',
                featureTagFilter: '',
                scenarioDescriptionRegex: undefined,
                scenarioDescriptionRegexReplaceValue: undefined,
                updateTestSetMappings: false,
                testSetMappingDetails: undefined
            }

            const inputOptions = {
                ...defaults,
                ...options
            }

            const opts = await generateInputs(inputOptions);
            
            await syncCucumberTests(opts);

            if (inputOptions.updateTestSetMappings && inputOptions.testSetMappingDetails) {
                await syncTestSetMappings(opts);
            }
        } catch (error) {
            return error;
        }
    },
    updateTestExecutionResults: async (options: TEST_EXECUTION_OPTION) => {
        try {
            const defaults = {
                jiraProtocol: 'https',
                jiraUsername: process.env.JIRA_USERNAME,
                jiraPassword: process.env.JIRA_PASSWORD,
                jiraToken: process.env.JIRA_TOKEN,
                cucumberJsonReportFolderPath: undefined,
                parsedTestResultDetails: undefined,
                skipUpdatingFailedCase: false
            }
    
            const inputOptions = {
                ...defaults,
                ...options
            }
    
            const opts = await generateInputs(inputOptions);
    
            await updateTestExecutionResults(opts);
        } catch (error) {
            return error;
        }
    },
    lintFeatureFiles: async (options: LINT_OPTIONS) => {
        try {
            const defaults = {
                featureFolderFilter: '/'
            }

            const inputOptions = {
                ...defaults,
                ...options
            }

            await generateFeaturesToImport(inputOptions.featureFolderPath, inputOptions.featureFolderFilter, '');
        } catch (error) {
            /* eslint no-console: "off" */
            console.error(error);
            process.exit(1);
        }
    }
}

import { INIT_OPTIONS, TEST_EXECUTION_OPTION, LINT_OPTIONS } from './types/types.js';
import { getXrayFieldIds } from './utils/jira.helper.js';
import { syncCucumberTests } from './syncCucumberTests.js';
import { syncTestSetMappings } from './syncTestSetMappings.js';
import { updateTestExecutionResults as _updateTestExecutionResults } from './updateTestExecutionResults.js';
import generateFeaturesToImport from './utils/featureFileParser.js';

/**
 * Represents the headers for making HTTP requests.
 * @interface
 */
interface Headers {
    Authorization: string | null;
}

/**
 * Generates headers based on the provided input options.
 *
 * @param {INIT_OPTIONS | TEST_EXECUTION_OPTION} inputOptions - The input options.
 * @returns {Headers} The generated headers.
 */
const generateHeaders = (inputOptions: INIT_OPTIONS | TEST_EXECUTION_OPTION): Headers => {
    const headers: Headers = {
        Authorization: null
    };

    if (inputOptions.jiraUsername && inputOptions.jiraPassword) {
        headers.Authorization = `Basic ${Buffer.from(`${inputOptions.jiraUsername}:${inputOptions.jiraPassword}`).toString('base64')}`;
    }

    if (inputOptions.jiraToken) {
        headers.Authorization = `Bearer ${inputOptions.jiraToken}`;
    }

    return headers;
};

/**
 * Generates input options including headers and Xray field IDs.
 *
 * @param {INIT_OPTIONS | TEST_EXECUTION_OPTION} inputOptions - The input options.
 * @returns {Promise<INIT_OPTIONS | TEST_EXECUTION_OPTION & XRAY_FIELD_IDS>} The generated input options.
 */
const generateInputs = async (inputOptions: INIT_OPTIONS | TEST_EXECUTION_OPTION) => {
    const headers = generateHeaders(inputOptions);

    const xrayFieldIds = await getXrayFieldIds(inputOptions.jiraProtocol, inputOptions.jiraHost, inputOptions.jiraProject, headers);

    return {
        ...inputOptions,
        ...xrayFieldIds,
        headers
    };
};

/**
 * Default options for Jira configurations.
 */
const jiraDefaults = {
    jiraProtocol: 'https',
    jiraUsername: process.env.JIRA_USERNAME,
    jiraPassword: process.env.JIRA_PASSWORD,
    jiraToken: process.env.JIRA_TOKEN
};

/**
 * Initializes the Xray Cucumber Plugin with the specified options.
 *
 * @param {INIT_OPTIONS} options - The initialization options.
 * @returns {Promise<void | Error>} A Promise that resolves if successful, or an Error if an error occurs.
 */
const init = async (options: INIT_OPTIONS): Promise<void | Error> => {
    try {
        const defaults = {
            featureFolderFilter: '/',
            featureTagFilter: '',
            scenarioDescriptionRegex: undefined,
            scenarioDescriptionRegexReplaceValue: undefined,
            updateTestSetMappings: false,
            testSetMappingDetails: undefined
        };

        const inputOptions = {
            ...jiraDefaults,
            ...defaults,
            ...options
        };

        const opts = await generateInputs(inputOptions);

        await syncCucumberTests(opts);

        if (inputOptions.updateTestSetMappings && inputOptions.testSetMappingDetails) {
            await syncTestSetMappings(opts);
        }
    } catch (error) {
        return error;
    }
};

/**
 * Updates test execution results in Xray for the specified test execution.
 *
 * @param {TEST_EXECUTION_OPTION} options - The test execution options.
 * @returns {Promise<void | Error>} A Promise that resolves if successful, or an Error if an error occurs.
 */
const updateTestExecutionResults = async (options: TEST_EXECUTION_OPTION): Promise<void | Error> => {
    try {
        const defaults = {
            cucumberJsonReportFolderPath: undefined,
            parsedTestResultDetails: undefined,
            skipUpdatingFailedCase: false
        };

        const inputOptions = {
            ...jiraDefaults,
            ...defaults,
            ...options
        };

        const opts = await generateInputs(inputOptions);

        await _updateTestExecutionResults(opts);
    } catch (error) {
        return error;
    }
};

/**
 * Lints feature files in the specified folder.
 *
 * @param {LINT_OPTIONS} options - The linting options.
 * @returns {Promise<void>} A Promise that resolves when linting is complete.
 */
const lintFeatureFiles = async (options: LINT_OPTIONS): Promise<void> => {
    try {
        const defaults = {
            featureFolderFilter: '/'
        };

        const inputOptions = {
            ...defaults,
            ...options
        };

        await generateFeaturesToImport(inputOptions.featureFolderPath, inputOptions.featureFolderFilter, '');
    } catch (error) {
        /* eslint no-console: "off" */
        console.error(error);
        process.exit(1);
    }
};

export default {
    init,
    updateTestExecutionResults,
    lintFeatureFiles
};

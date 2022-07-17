import { Options, TestExecutionResults } from './types/types';

import { getXrayFieldIds } from './utils/jira_xray_helper';
import { syncCucumberTests } from './syncCucumberTests';
import { syncTestSetMappings } from './syncTestSetMappings';
import { updateTestExecutionResults } from './updateTestExecutionResults';

const generateInputs = async (inputOptions: any) => {
    const headers = {
        'Authorization': `Basic ${Buffer.from(`${inputOptions.jiraUsername}:${inputOptions.jiraPassword}`).toString('base64')}`
    }

    const xrayFieldIds = await getXrayFieldIds(inputOptions.jiraHost, inputOptions.jiraProject, headers);

    return {
        ...inputOptions,
        ...xrayFieldIds,
        headers
    }
}

export default {
    init: async (options: Options) => {
        try {
            const defaults = {
                featureFolderFilter: '/',
                featureTagFilter: '',
                jiraUsername: process.env.JIRA_USERNAME,
                jiraPassword: process.env.JIRA_PASSWORD,
                updateTestSetMappings: false
            }

            const inputOptions = {
                ...defaults,
                ...options
            }

            const opts = await generateInputs(inputOptions);

            await syncCucumberTests(opts);

            if (inputOptions.updateTestSetMappings) {
                await syncTestSetMappings(opts);
            }
        } catch (error) {
            return;
        }
    },
    updateTestExecutionResults: async (options: TestExecutionResults) => {
        const defaults = {
            jiraUsername: process.env.JIRA_USERNAME,
            jiraPassword: process.env.JIRA_PASSWORD
        }

        const inputOptions = {
            ...defaults,
            ...options
        }

        const opts = await generateInputs(inputOptions);

        await updateTestExecutionResults(opts);
    }
}
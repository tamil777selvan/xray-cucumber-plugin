import { Options } from './types/types';

import { importCucumberTests } from './importCucumberTests';
import { updateTestSetMappings } from './updateTestSetMappings';

export default {
    init: async (options: Options) => {
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

        await importCucumberTests(inputOptions);

        if (inputOptions.updateTestSetMappings) {
            await updateTestSetMappings(inputOptions);
        }
    }
}
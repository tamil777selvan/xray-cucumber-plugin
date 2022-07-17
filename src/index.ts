import {Options} from './types/types';

import {syncCucumberTests} from './syncCucumberTests';
import {syncTestSetMappings} from './syncTestSetMappings';

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

        await syncCucumberTests(inputOptions);

        if (inputOptions.updateTestSetMappings) {
            await syncTestSetMappings(inputOptions);
        }
    }
}
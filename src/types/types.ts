export interface Options {
    /**
     * Root folder path where the feature file lies
    */
    featureFolderPath: string;
    /**
     * Filter feature files only from a specific folder
     * @default '/'
    */
    featureFolderFilter?: string;
    /**
     * Filter features based on tag conditions
     * @default ''
    */
    featureTagFilter?: string;
    /**
     * Host address of JIRA
    */
    jiraHost: string;
    /**
     * JIRA Project Key to which XRAY tests needs to be updated
    */
    jiraProject: string;
    /**
     * JIRA Username to authenticate
     * @default process.env.JIRA_USERNAME
    */
    jiraUsername?: string;
    /**
     * JIRA Password to authenticate
     * @default process.env.JIRA_PASSWORD
    */
    jiraPassword?: string;
    /**
     * Set to true to update tests sets based on the mapping given in testSetMappingDetails
     * @default false
    */
    updateTestSetMappings?: boolean;
    /**
     * Map Xray Tests to Tests Sets based on tags
     * @default false
    */
    testSetMappingDetails?: object;
}
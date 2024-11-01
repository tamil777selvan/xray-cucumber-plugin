const issueTypes = [
    {
        name: 'Bug',
        isSubTask: false
    },
    {
        name: 'Task',
        isSubTask: false
    },
    {
        name: 'Sub-Task',
        isSubTask: true
    },
    {
        name: 'Story',
        isSubTask: false
    },
    {
        name: 'Xray Test',
        isSubTask: false
    },
    {
        name: 'Epic',
        isSubTask: false
    },
    {
        name: 'Xray Test Set',
        isSubTask: false
    },
    {
        name: 'Defect',
        isSubTask: false
    },
    {
        name: 'Xray Test Execution',
        isSubTask: false
    },
    {
        name: 'Query',
        isSubTask: false
    },
    {
        name: 'Idea',
        isSubTask: false
    }
];

const getIssueTypeIdByNameResponse = issueTypes.map((issueType, index) => ({
    self: `https://example.com/rest/api/2/issuetype/${index}`,
    id: index,
    description: `Represent a ${issueType.name}`,
    iconUrl: `https://example.com/viewavatar?size=xsmall&avatarId=${index}&avatarType=issueType`,
    name: issueType.name,
    subtask: issueType.isSubTask ? true : false,
    avatarId: index
}));

const getIssueTypeMetadataResponse = (issueTypeId: number) => {
    const issueType = issueTypes[issueTypeId];

    const issueTypeValues = {
        // values to be returned specifically when calling Xray Test.
        'Xray Test': [
            {
                required: false,
                schema: {
                    type: 'option',
                    custom: 'com.xpandit.plugins.xray:test-type-custom-field',
                    customId: 19011
                },
                name: 'Test Type',
                fieldId: 'customfield_19011',
                hasDefaultValue: true,
                operations: ['set'],
                allowedValues: [
                    {
                        self: '',
                        value: 'Manual',
                        id: '33113',
                        disabled: false
                    },
                    {
                        self: '',
                        value: 'Cucumber',
                        id: '33114',
                        disabled: false
                    },
                    {
                        self: '',
                        value: 'Generic',
                        id: '33115',
                        disabled: false
                    }
                ],
                defaultValue: {
                    self: '',
                    value: 'Manual',
                    id: '33113',
                    disabled: false
                }
            },
            {
                required: false,
                schema: {
                    type: 'option',
                    custom: 'com.xpandit.plugins.xray:automated-test-type-custom-field',
                    customId: 19012
                },
                name: 'Cucumber Test Type',
                fieldId: 'customfield_19012',
                hasDefaultValue: true,
                operations: ['set'],
                allowedValues: [
                    {
                        self: '',
                        value: 'Scenario',
                        id: '33116',
                        disabled: false
                    },
                    {
                        self: '',
                        value: 'Scenario Outline',
                        id: '33117',
                        disabled: false
                    }
                ],
                defaultValue: {
                    self: '',
                    value: 'Scenario',
                    id: '33116',
                    disabled: false
                }
            },
            {
                required: false,
                schema: {
                    type: 'string',
                    custom: 'com.xpandit.plugins.xray:steps-editor-custom-field',
                    customId: 19013
                },
                name: 'Cucumber Scenario',
                fieldId: 'customfield_19013',
                hasDefaultValue: false,
                operations: ['set']
            },
            {
                required: false,
                schema: {
                    type: 'string',
                    custom: 'com.xpandit.plugins.xray:path-editor-custom-field',
                    customId: 19014
                },
                name: 'Generic Test Definition',
                fieldId: 'customfield_19014',
                hasDefaultValue: false,
                operations: ['set']
            },
            {
                required: false,
                schema: {
                    type: 'any',
                    custom: 'com.xpandit.plugins.xray:manual-test-steps-custom-field',
                    customId: 19015
                },
                name: 'Manual Test Steps',
                fieldId: 'customfield_19015',
                hasDefaultValue: true,
                operations: ['set']
            },
            {
                required: false,
                schema: {
                    type: 'array',
                    custom: 'com.xpandit.plugins.xray:test-sets-custom-field',
                    customId: 19018
                },
                name: 'Test Sets association with a Test',
                fieldId: 'customfield_19018',
                hasDefaultValue: false,
                operations: ['set']
            },
            {
                required: false,
                schema: {
                    type: 'array',
                    custom: 'com.xpandit.plugins.xray:test-precondition-custom-field',
                    customId: 19019
                },
                name: 'Pre-Conditions association with a Test',
                fieldId: 'customfield_19019',
                hasDefaultValue: false,
                operations: ['set']
            },
            {
                required: false,
                schema: {
                    type: 'array',
                    custom: 'com.xpandit.plugins.xray:test-plans-associated-with-test-custom-field',
                    customId: 19020
                },
                name: 'Test Plans associated with a Test',
                fieldId: 'customfield_19020',
                hasDefaultValue: false,
                operations: ['set']
            },
            {
                required: false,
                schema: {
                    type: 'any',
                    custom: 'com.xpandit.plugins.xray:test-repository-path-custom-field',
                    customId: 19022
                },
                name: 'Test Repository Path',
                fieldId: 'customfield_19022',
                hasDefaultValue: false,
                operations: ['set']
            }
        ],
        // values to be returned specifically when calling Xray Test Set.
        'Xray Test Set': [
            {
                required: false,
                schema: {
                    type: 'array',
                    custom: 'com.xpandit.plugins.xray:test-sets-tests-custom-field',
                    customId: 19023
                },
                name: 'Tests association with a Test Set',
                fieldId: 'customfield_19023',
                hasDefaultValue: false,
                operations: ['set']
            }
        ],
        // values to be returned specifically when calling Xray Test Execution.
        'Xray Test Execution': [
            {
                required: false,
                schema: {
                    type: 'array',
                    items: 'string',
                    custom: 'com.xpandit.plugins.xray:test-environments-custom-field',
                    customId: 19036
                },
                name: 'Test Environments',
                fieldId: 'customfield_19036',
                hasDefaultValue: false,
                operations: ['add', 'set', 'remove']
            },
            {
                required: false,
                schema: {
                    type: 'array',
                    custom: 'com.xpandit.plugins.xray:testexec-tests-custom-field',
                    customId: 19026
                },
                name: 'Tests association with a Test Execution',
                fieldId: 'customfield_19026',
                hasDefaultValue: false,
                operations: ['set']
            },
            {
                required: false,
                schema: {
                    type: 'array',
                    custom: 'com.xpandit.plugins.xray:test-plan-custom-field',
                    customId: 19038
                },
                name: 'Test Plan',
                fieldId: 'customfield_19038',
                hasDefaultValue: false,
                operations: ['set']
            }
        ]
    };

    // common values to be returned.
    const common = [
        {
            required: true,
            schema: { type: 'string', system: 'summary' },
            name: 'Summary',
            fieldId: 'summary',
            hasDefaultValue: false,
            operations: ['set']
        },
        {
            required: false,
            schema: { type: 'string', system: 'description' },
            name: 'Description',
            fieldId: 'description',
            hasDefaultValue: false,
            operations: ['set']
        },
        {
            required: true,
            schema: { type: 'user', system: 'reporter' },
            name: 'Reporter',
            fieldId: 'reporter',
            hasDefaultValue: false,
            operations: ['set']
        },
        {
            required: false,
            schema: { type: 'priority', system: 'priority' },
            name: 'Priority',
            fieldId: 'priority',
            hasDefaultValue: true,
            operations: ['set'],
            allowedValues: [
                {
                    name: 'Highest',
                    id: '5'
                },
                {
                    name: 'High',
                    id: '4'
                },
                {
                    name: 'Medium',
                    id: '3'
                },
                {
                    name: 'Low',
                    id: '2'
                },
                {
                    name: 'Lowest',
                    id: '1'
                }
            ],
            defaultValue: {
                name: 'Medium',
                id: '3'
            }
        },
        {
            required: true,
            schema: { type: 'array', items: 'string', system: 'labels' },
            name: 'Labels',
            fieldId: 'labels',
            hasDefaultValue: false,
            operations: ['add', 'set', 'remove']
        },
        {
            required: true,
            schema: { type: 'issuetype', system: 'issuetype' },
            name: 'Issue Type',
            fieldId: 'issuetype',
            hasDefaultValue: false,
            operations: [],
            allowedValues: [
                {
                    description: `Represents a ${issueType.name}`,
                    name: issueType.name,
                    subTask: false
                }
            ]
        }
    ];

    const values = [...issueTypeValues[issueType.name], ...common];

    return {
        maxResults: 50,
        startAt: 0,
        total: values.length,
        isLast: true,
        values
    };
};

const scenarios = [
    {
        name: 'Scenario #1',
        tags: [],
        type: 'Scenario',
        steps: '\tGiven a step passes\n\tWhen a step passes\n\tThen a step passes'
    },
    {
        name: 'Scenario Outline #1 (Example - "param1":"a","param2":"b")',
        tags: [],
        type: 'Scenario Outline',
        steps: '\tGiven a step passes\n' + '\tWhen a step passes\n' + '\tThen a step passes\t\n' + '\tExamples:\n' + '\t|param1|param2|\n' + '\t|a|b|\n'
    },
    {
        name: 'Scenario Outline #1 (Example - "param1":"1","param2":"2")',
        tags: [],
        type: 'Scenario Outline',
        steps: '\tGiven a step passes\n' + '\tWhen a step passes\n' + '\tThen a step passes\t\n' + '\tExamples:\n' + '\t|param1|param2|\n' + '\t|1|2|\n'
    },
    {
        name: 'Scenario #2',
        tags: [],
        type: 'Scenario',
        steps: '\tGiven a step passes\n\tWhen a step passes\n\tThen a step passes'
    },
    {
        name: 'Scenario Outline #2 (Example - "param1":"a","param2":"b")',
        tags: [],
        type: 'Scenario Outline',
        steps: '\tGiven a step passes\n' + '\tWhen a step passes\n' + '\tThen a step passes\t\n' + '\tExamples:\n' + '\t|param1|param2|\n' + '\t|a|b|\n'
    },
    {
        name: 'Scenario #3',
        tags: [],
        type: 'Scenario',
        steps: '\tGiven a step passes\n' + '\tWhen a step passes\n' + '\t|params|\n' + '\t|a|\n' + '\t|1|\n' + '\tThen a step passes'
    },
    {
        name: 'Scenario #4',
        tags: ['ff'],
        type: 'Scenario',
        steps: '\tGiven a step passes\n\tWhen a step passes\n\tThen a step passes'
    },
    {
        name: 'Scenario Outline #4 (Example - "param1":"a","param2":"b")',
        tags: ['ff', 'scenarioOutline'],
        type: 'Scenario Outline',
        steps: '\tGiven a step passes\n' + '\tWhen a step passes\n' + '\tThen a step passes\t\n' + '\tExamples:\n' + '\t|param1|param2|\n' + '\t|a|b|\n'
    }
];

const getExistingTicketsResponse = scenarios.map((scenario, index) => ({
    key: `PROJECT-${index}`,
    id: `10${index}`,
    fields: {
        issueType: 'Xray Test',
        status: {
            name: 'Open'
        },
        summary: scenario.name,
        labels: scenario.tags,
        customfield_19012: {
            value: scenario.type
        },
        customfield_19013: scenario.steps
    }
}));

export { getIssueTypeIdByNameResponse, getIssueTypeMetadataResponse, getExistingTicketsResponse };

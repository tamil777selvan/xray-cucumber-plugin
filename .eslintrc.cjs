module.exports = {
    root: true,
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        project: ['./tsconfig.json']
    },
    plugins: ['@stylistic/ts', '@typescript-eslint'],
    rules: {
        'default-case': 'error',
        'default-case-last': 'error',
        'arrow-body-style': 'error',
        'no-console': 'error',
        'eol-last': 'error',
        'no-mixed-operators': 'error',
        'guard-for-in': 'error',
        'max-len': [
            'error',
            {
                code: 160,
                tabWidth: 4,
                ignoreComments: false,
                ignoreTrailingComments: false,
                ignoreUrls: false,
                ignoreStrings: true,
                ignoreTemplateLiterals: false,
                ignoreRegExpLiterals: true
            }
        ],
        'no-underscore-dangle': [
            'error',
            {
                allow: ['_id']
            }
        ],
        'object-curly-newline': [
            'error',
            {
                consistent: true
            }
        ],
        'no-param-reassign': [
            'error',
            {
                props: false
            }
        ],
        'no-return-assign': ['error', 'except-parens'],
        'prefer-destructuring': [
            'error',
            {
                object: true,
                array: false
            }
        ],
        'function-paren-newline': ['error', 'consistent'],
        quotes: [
            'error',
            'single',
            {
                avoidEscape: true
            }
        ],

        '@typescript-eslint/no-explicit-any': 0,
        '@stylistic/ts/comma-dangle': ['error', 'never'],
        '@stylistic/ts/indent': [
            'error',
            4,
            {
                SwitchCase: 1
            }
        ],
        '@stylistic/ts/object-curly-spacing': ['error', 'always'],
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-use-before-define': 'error',
        '@typescript-eslint/promise-function-async': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/require-await': 'error',
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/consistent-type-exports': 'error',
        '@typescript-eslint/no-for-in-array': 'error',
        '@typescript-eslint/prefer-as-const': 'error',
        '@typescript-eslint/prefer-for-of': 'error',
        '@typescript-eslint/prefer-includes': 'error',
        '@typescript-eslint/prefer-string-starts-ends-with': 'error',
        '@stylistic/ts/padding-line-between-statements': 'error'
    },
    ignorePatterns: ['/dist', '/node_modules', '/tests', 'vitest.config.ts', '.eslintrc.cjs']
};

import { vi, describe, it, expect } from 'vitest';
import url from 'node:url';
import { join } from 'path';

const dirname = url.fileURLToPath(new URL('.', import.meta.url));

const fixtures = join(dirname, '..', 'fixtures');

import generateFeaturesToImport, { parseFeatureFile, validateScenarioNames } from '../../src/utils/featureFileParser.js';

vi.mock('../../src/utils/logger.js');

describe('parseFeatureFile', () => {
    it('should parse a feature file with no examples', async () => {
        const file = `${fixtures}/feature-without-examples.feature`;
        const scenarioDescriptionRegex = new RegExp('');
        const scenarioDescriptionRegexReplaceValue = '';

        const parsedData = await parseFeatureFile(file, scenarioDescriptionRegex, scenarioDescriptionRegexReplaceValue);

        expect(parsedData).toEqual([
            {
                tags: '',
                scenarioType: 'Scenario',
                scenarioName: 'Scenario #1',
                scenarioSteps: '\tGiven a step passes\n\tWhen a step passes\n\tThen a step passes'
            }
        ]);
    });

    it('should parse a feature file with examples', async () => {
        const file = `${fixtures}/feature-with-examples.feature`;
        const scenarioDescriptionRegex = new RegExp('');
        const scenarioDescriptionRegexReplaceValue = '';

        const parsedData = await parseFeatureFile(file, scenarioDescriptionRegex, scenarioDescriptionRegexReplaceValue);
        expect(parsedData).toEqual([
            {
                tags: '',
                scenarioType: 'Scenario Outline',
                scenarioName: 'Scenario Outline #1 (Example - "param1":"a","param2":"b")',
                scenarioSteps:
                    '\tGiven a step passes\n' + '\tWhen a step passes\n' + '\tThen a step passes\t\n' + '\tExamples:\n' + '\t|param1|param2|\n' + '\t|a|b|\n'
            },
            {
                tags: '',
                scenarioType: 'Scenario Outline',
                scenarioName: 'Scenario Outline #1 (Example - "param1":"1","param2":"2")',
                scenarioSteps:
                    '\tGiven a step passes\n' + '\tWhen a step passes\n' + '\tThen a step passes\t\n' + '\tExamples:\n' + '\t|param1|param2|\n' + '\t|1|2|\n'
            }
        ]);
    });

    it('should parse a feature file with a scenario description regex', async () => {
        const file = `${fixtures}/feature-with-description-regex.feature`;
        const scenarioDescriptionRegex = /TC_\d\d /gm;
        const scenarioDescriptionRegexReplaceValue = '';

        const parsedData = await parseFeatureFile(file, scenarioDescriptionRegex, scenarioDescriptionRegexReplaceValue);
        expect(parsedData).toEqual([
            {
                tags: '',
                scenarioType: 'Scenario',
                scenarioName: 'Scenario #2',
                scenarioSteps: '\tGiven a step passes\n\tWhen a step passes\n\tThen a step passes'
            },
            {
                tags: '',
                scenarioType: 'Scenario Outline',
                scenarioName: 'Scenario Outline #2 (Example - "param1":"a","param2":"b")',
                scenarioSteps:
                    '\tGiven a step passes\n' + '\tWhen a step passes\n' + '\tThen a step passes\t\n' + '\tExamples:\n' + '\t|param1|param2|\n' + '\t|a|b|\n'
            }
        ]);
    });

    it('should parse a feature file with data table', async () => {
        const file = `${fixtures}/feature-with-data-table.feature`;
        const scenarioDescriptionRegex = new RegExp('');
        const scenarioDescriptionRegexReplaceValue = '';

        const parsedData = await parseFeatureFile(file, scenarioDescriptionRegex, scenarioDescriptionRegexReplaceValue);
        expect(parsedData).toEqual([
            {
                tags: '',
                scenarioType: 'Scenario',
                scenarioName: 'Scenario #3',
                scenarioSteps: '\tGiven a step passes\n' + '\tWhen a step passes\n' + '\t|params|\n' + '\t|a|\n' + '\t|1|\n' + '\tThen a step passes'
            }
        ]);
    });

    it('should parse a feature file with tags', async () => {
        const file = `${fixtures}/feature-with-tags.feature`;
        const scenarioDescriptionRegex = new RegExp('');
        const scenarioDescriptionRegexReplaceValue = '';

        const parsedData = await parseFeatureFile(file, scenarioDescriptionRegex, scenarioDescriptionRegexReplaceValue);
        expect(parsedData).toEqual([
            {
                tags: '@ff',
                scenarioType: 'Scenario',
                scenarioName: 'Scenario #4',
                scenarioSteps: '\tGiven a step passes\n\tWhen a step passes\n\tThen a step passes'
            },
            {
                tags: '@ff @scenarioOutline',
                scenarioType: 'Scenario Outline',
                scenarioName: 'Scenario Outline #4 (Example - "param1":"a","param2":"b")',
                scenarioSteps:
                    '\tGiven a step passes\n' + '\tWhen a step passes\n' + '\tThen a step passes\t\n' + '\tExamples:\n' + '\t|param1|param2|\n' + '\t|a|b|\n'
            }
        ]);
    });
});

describe('generateFeaturesToImport', () => {
    it('should generate features to import with valid input', async () => {
        const featureFolderPath = fixtures;
        const featureFolderFilter = '';
        const featureTagFilter = '@scenarioOutline';
        const scenarioDescriptionRegex = /TC_\d\d /gm;
        const scenarioDescriptionRegexReplaceValue = '';

        const featuresToImport = await generateFeaturesToImport(
            featureFolderPath,
            featureFolderFilter,
            featureTagFilter,
            scenarioDescriptionRegex,
            scenarioDescriptionRegexReplaceValue
        );

        expect(featuresToImport).toHaveLength(1);
    });

    it('should handle if no feature files in the folder', async () => {
        const featureFolderPath = './';
        const featureFolderFilter = 'my-feature';
        const featureTagFilter = '@myTag';

        expect(generateFeaturesToImport(featureFolderPath, featureFolderFilter, featureTagFilter)).rejects.toThrowError(
            new Error('XRAY: Fix the feature folder path to proceed')
        );
    });
});

describe('validateScenarioNames', () => {
    it('Valid scenario names should not throw an error', () => {
        const parsedData = [
            {
                tags: '',
                scenarioType: 'Scenario',
                scenarioName: 'Scenario 1',
                scenarioSteps: ''
            },
            {
                tags: '',
                scenarioType: 'Scenario',
                scenarioName: 'Scenario 2',
                scenarioSteps: ''
            }
        ];
        expect(() => validateScenarioNames(parsedData)).not.toThrow();
    });

    it('Duplicate scenario names should throw an error', () => {
        const parsedData = [
            {
                tags: '',
                scenarioType: 'Scenario',
                scenarioName: 'Scenario 1',
                scenarioSteps: ''
            },
            {
                tags: '',
                scenarioType: 'Scenario',
                scenarioName: 'Scenario 1',
                scenarioSteps: ''
            }
        ];
        expect(() => validateScenarioNames(parsedData)).toThrowError(new Error('XRAY: Fix the duplicate scenario names to proceed'));
    });

    it('Scenario names with more than 250 characters should throw an error', () => {
        const parsedData = [
            {
                tags: '',
                scenarioType: 'Scenario',
                scenarioName: 'A'.repeat(251),
                scenarioSteps: ''
            }
        ];
        expect(() => validateScenarioNames(parsedData)).toThrowError(new Error('XRAY: Fix the scenario names to proceed'));
    });

    it('Empty parsed data should not throw an error', () => {
        const parsedData = [];
        expect(() => validateScenarioNames(parsedData)).not.toThrow();
    });
});

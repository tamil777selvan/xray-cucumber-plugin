import _ from 'lodash';
import { readFile } from 'node:fs/promises';
import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { GherkinDocument, IdGenerator, FeatureChild, Step, Examples, TableRow } from '@cucumber/messages';
import TagExpressionParser from '@cucumber/tag-expressions';

import logger from './logger';
import { getAllFilesInDir } from './files';
import { PARSED_DATA } from '../types/types';

/**
 * Delimiter for lines in text.
 */
const lineDelimiter = '\n';

/**
 * Delimiter for steps in a scenario.
 */
const stepDelimiter = '\t';

/**
 * Gherkin parser for feature files.
 */
const parser = new Parser(new AstBuilder(IdGenerator.incrementing()), new GherkinClassicTokenMatcher());

/**
 * Gets the text representation of data table rows.
 *
 * @param {any[]} rows - Rows of a data table.
 * @returns {string} Text representation of data table rows.
 */
const getDataTableText = (rows: readonly TableRow[]): string =>
    rows.map((row) => row.cells.map((cell) => `|${cell.value.trim()}`).join('')).join(lineDelimiter);

/**
 * Gets the text representation of scenario steps.
 *
 * @param {Step[]} steps - Steps of a scenario.
 * @returns {string} Text representation of scenario steps.
 */
const getScenarioStepsText = (steps: readonly Step[]): string =>
    steps
        .map((step) =>
            step.dataTable
                ? `${stepDelimiter}${step.keyword}${step.text}${lineDelimiter}${stepDelimiter}${getDataTableText(step.dataTable.rows)}`
                : `${stepDelimiter}${step.keyword}${step.text}`)
        .join(lineDelimiter);

/**
 * Validates scenario names for duplicates and length.
 *
 * @param {PARSED_DATA[]} parsedData - Parsed data containing scenarios.
 */
const validateScenarioNames = (parsedData: PARSED_DATA[]) => {
    const scenarioNames = parsedData.map(
        (data) => data.scenarioName.replace(/[^a-zA-Z0-9-:(), ]/g, '') // Remove invalid characters
    );

    const duplicateScenarioNames = _.filter(scenarioNames, (val, i, iteratee) => _.includes(iteratee, val, i + 1));

    if (duplicateScenarioNames.length > 0) {
        logger.error('XRAY: Below are duplicate scenario names found');
        duplicateScenarioNames.forEach((scenario, index) => logger.error(`${stepDelimiter} ${index + 1}. ${scenario}`));
        throw new Error('XRAY: Fix the duplicate scenario names to proceed');
    }

    const longScenarioNames = _.filter(scenarioNames, (name) => name.length > 250);

    if (longScenarioNames.length > 0) {
        logger.error('XRAY: Below scenario names have more than 250 characters');
        longScenarioNames.forEach((scenario, index) => logger.error(`${stepDelimiter} ${index + 1}. ${scenario}`));
        throw new Error('XRAY: Fix the scenario names to proceed');
    }
};

/**
 * Filters scenarios based on feature tags.
 *
 * @param {PARSED_DATA[]} parsedData - Parsed data containing scenarios.
 * @param {string} featureTagFilter - Feature tag filter expression.
 * @returns {PARSED_DATA[]} Filtered scenarios.
 */
const filterScenariosByTag = (parsedData: PARSED_DATA[], featureTagFilter: string): PARSED_DATA[] => {
    const tagExpression = TagExpressionParser(featureTagFilter);

    return parsedData.filter((data) => {
        const tags = data.tags.split(' ');
        return tagExpression.evaluate(tags);
    });
};

/**
 * Parses a feature file and extracts scenarios.
 *
 * @param {string} file - Path to the feature file.
 * @param {RegExp} scenarioDescriptionRegex - Regex for scenario descriptions.
 * @param {string} scenarioDescriptionRegexReplaceValue - Replacement value for scenario descriptions.
 * @returns {Promise<PARSED_DATA[]>} Parsed data extracted from the feature file.
 */
const parseFeatureFile = async (file: string, scenarioDescriptionRegex: RegExp, scenarioDescriptionRegexReplaceValue: string): Promise<PARSED_DATA[]> => {
    const raw = await readFile(file);
    const gherkinDocument: GherkinDocument = parser.parse(raw.toString());

    const featureLevelTags = gherkinDocument.feature.tags.map((tag) => tag.name).join(' ');

    const backgroundSteps = gherkinDocument.feature.children
        .filter((child) => child.background)
        .map((child) => child.background.steps.map((step) => `${step.keyword}${step.text}`).join(lineDelimiter))
        .join(stepDelimiter);

    const parsedData: PARSED_DATA[] = [];

    gherkinDocument.feature.children
        .filter((child) => child.scenario)
        .forEach((featureChild: FeatureChild) => {
            const scenarioLevelTags = featureChild.scenario.tags.map((tag) => tag.name).join(' ');

            const scenarios: PARSED_DATA[] = [];
            const scenarioName = featureChild.scenario.name.toString().trim();

            if (featureChild.scenario.examples) {
                featureChild.scenario.examples.forEach((example: Examples) => {
                    const exampleHeader = example.tableHeader.cells.map((cell) => cell.value).join(' | ');
                    const exampleBody = example.tableBody.map((body) => body.cells.map((cell) => cell.value).join(' | ')).join(lineDelimiter);

                    // eslint-disable-next-line max-len
                    const exampleScenarioSteps = `${stepDelimiter}Examples:${lineDelimiter}${stepDelimiter}${exampleHeader}${lineDelimiter}${stepDelimiter}${exampleBody}${lineDelimiter}`;

                    let updatedScenarioName = scenarioName.replace(/( \(Example - \{.*\}\))/g, '');

                    if (scenarioDescriptionRegex) {
                        updatedScenarioName = scenarioName.replace(scenarioDescriptionRegex, scenarioDescriptionRegexReplaceValue);
                    }

                    const data: PARSED_DATA = {
                        tags: `${featureLevelTags} ${scenarioLevelTags}`.trim(),
                        scenarioType: updatedScenarioName.split(':')[0].trim(),
                        scenarioName: updatedScenarioName.split(':')[1].trim(),
                        scenarioSteps: backgroundSteps + getScenarioStepsText(featureChild.scenario.steps) + exampleScenarioSteps
                    };

                    scenarios.push(data);
                });
            } else {
                let updatedScenarioName = scenarioName;
                if (scenarioDescriptionRegex) {
                    updatedScenarioName = scenarioName.replace(scenarioDescriptionRegex, scenarioDescriptionRegexReplaceValue);
                }
                const data: PARSED_DATA = {
                    tags: `${featureLevelTags} ${scenarioLevelTags}`.trim(),
                    scenarioType: scenarioName.split(':')[0].trim(),
                    scenarioName: updatedScenarioName.split(':')[1].trim(),
                    scenarioSteps: backgroundSteps + getScenarioStepsText(featureChild.scenario.steps)
                };

                scenarios.push(data);
            }

            parsedData.push(...scenarios);
        });

    return parsedData;
};

/**
 * Generates a list of features to import based on various filters.
 *
 * @param {string} featureFolderPath - Path to the folder containing feature files.
 * @param {string} featureFolderFilter - Filter for feature file names.
 * @param {string} featureTagFilter - Feature tag filter expression.
 * @param {RegExp} scenarioDescriptionRegex - Regex for scenario descriptions.
 * @param {string} scenarioDescriptionRegexReplaceValue - Replacement value for scenario descriptions.
 * @returns {Promise<PARSED_DATA[]>} List of features to import.
 */
const generateFeaturesToImport = async (
    featureFolderPath: string,
    featureFolderFilter: string,
    featureTagFilter: string,
    scenarioDescriptionRegex?: RegExp,
    scenarioDescriptionRegexReplaceValue?: string
): Promise<PARSED_DATA[]> => {
    const featureFiles = await getAllFilesInDir(featureFolderPath, '.feature');
    const filteredFiles = featureFiles.filter((file) => file.includes(featureFolderFilter));

    if (filteredFiles.length === 0) {
        logger.error('XRAY: Given path does not have any feature files');
        throw new Error('XRAY: Fix the feature folder path to proceed');
    }

    const parsedData = await Promise.all(
        filteredFiles.map(async (file) => parseFeatureFile(file, scenarioDescriptionRegex, scenarioDescriptionRegexReplaceValue))
    );

    const flattenedParsedData = _.flattenDeep(parsedData);

    validateScenarioNames(flattenedParsedData);

    return filterScenariosByTag(flattenedParsedData, featureTagFilter);
};

export default generateFeaturesToImport;

import _ from 'lodash';
import { readFile } from 'node:fs/promises';

import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { GherkinDocument, IdGenerator, FeatureChild, Step, Examples } from '@cucumber/messages';
import TagExpressionParser from '@cucumber/tag-expressions';

import logger from './logger';
import { getAllFilesInDir } from './files';
import { PARSED_DATA } from '../types/types';

const lineDelimiter = '\n';
const stepDelimiter = '\t';

const parser = new Parser(new AstBuilder(IdGenerator.incrementing()), new GherkinClassicTokenMatcher());

const parseFeatureFiles = async (files: string[], scenarioDescriptionRegex: RegExp, scenarioDescriptionRegexReplaceValue: string) => {
    const parsedData: PARSED_DATA[][] = [];
    for await (const file of files) {
        const raw = await readFile(file);

        const gherkinDocument: GherkinDocument = parser.parse(raw.toString());

        let featureLevelTags = '';
        gherkinDocument.feature.tags.forEach((tag) => {
            featureLevelTags += `${tag.name} `;
        });

        let backgroundSteps = '';

        gherkinDocument.feature.children.forEach((featureChild: FeatureChild) => {
            let scenarioLevelTags = '';

            if (featureChild.background) {
                featureChild.background.steps.forEach((step: Step) => {
                    backgroundSteps += stepDelimiter;
                    backgroundSteps += step.keyword + step.text + lineDelimiter;
                });
            }

            if (featureChild.scenario) {

                featureChild.scenario.tags.forEach((tag) => {
                    scenarioLevelTags += `${tag.name} `;
                });

                let exampleHeader = [];
                const exampleBody = [];
                const examples = [];
                if (featureChild.scenario.examples) {
                    featureChild.scenario.examples.forEach((example: Examples) => {
                        exampleHeader = example.tableHeader.cells.map((cell) => cell.value);
                        example.tableBody.forEach((body) => {
                            exampleBody.push(body.cells.map((cell) => cell.value));
                        });
                    });
                    exampleBody.forEach((body) => {
                        const exampleObject = {};
                        exampleHeader.forEach((header, index) => {
                            exampleObject[header] = body[index];
                        });
                        examples.push(exampleObject);
                    });
                }

                const scenarios = [];

                let scenarioName = featureChild.scenario.name.toString().trim();

                if (examples.length > 0) {
                    examples.forEach((example) => {
                        if (scenarioName.includes('(Example -')) {
                            scenarioName = scenarioName.substring(0, scenarioName.indexOf('(Example -')).trim();
                        }
                        scenarioName += ` (Example - ${JSON.stringify(example)})`;
                        scenarioName = scenarioName.toString().replace(/[{}]/g, '');

                        if (scenarioDescriptionRegex) {
                            scenarioName = scenarioName.replace(scenarioDescriptionRegex, scenarioDescriptionRegexReplaceValue);
                        }

                        scenarios.push(`${lineDelimiter} ${featureChild.scenario.keyword}: ${scenarioName}`);
                    });
                } else {
                    if (scenarioDescriptionRegex) {
                        scenarioName = scenarioName.replace(scenarioDescriptionRegex, scenarioDescriptionRegexReplaceValue);
                    }
                    scenarios.push(`${lineDelimiter} ${featureChild.scenario.keyword}: ${scenarioName}`);
                }

                let scenarioSteps = '';

                featureChild.scenario.steps.forEach((step) => {
                    scenarioSteps = scenarioSteps + stepDelimiter + step.keyword + step.text + lineDelimiter;
                    if (step.dataTable) {
                        step.dataTable.rows.forEach((row) => {
                            row.cells.forEach((cell) => {
                                scenarioSteps = `${scenarioSteps + stepDelimiter}|${cell.value}`;
                            });
                            scenarioSteps = `${scenarioSteps}|${lineDelimiter}`;
                        });
                    }
                });

                const output: PARSED_DATA[] = scenarios.map((scenario, index) => {
                    if (examples.length > 0) {
                        let exampleScenarioSteps = '';
                        exampleScenarioSteps += `${stepDelimiter}Examples:${lineDelimiter}${stepDelimiter}`;
                        Object.keys(examples[index]).forEach((key) => {
                            exampleScenarioSteps += `|${key.trim()}`;
                        });
                        exampleScenarioSteps += `|${lineDelimiter}${stepDelimiter}`;
                        Object.values(examples[index]).forEach((value: string) => {
                            exampleScenarioSteps += `|${value.trim()}`;
                        });
                        exampleScenarioSteps += `|${lineDelimiter}`;
                        return {
                            tags: (`${featureLevelTags + scenarioLevelTags}`).trim(),
                            scenarioType: scenario.trim().substring(0, scenario.trim().indexOf(':')).trim(),
                            scenarioName: scenario.trim().substring(scenario.trim().indexOf(':') + 1).trim(),
                            scenarioSteps: backgroundSteps + scenarioSteps + exampleScenarioSteps
                        }
                    }
                    return {
                        tags: (`${featureLevelTags + scenarioLevelTags}`).trim(),
                        scenarioType: scenario.trim().substring(0, scenario.trim().indexOf(':')).trim(),
                        scenarioName: scenario.trim().substring(scenario.trim().indexOf(':') + 1).trim(),
                        scenarioSteps: backgroundSteps + scenarioSteps
                    }
                });

                parsedData.push(output);
            }
        });

    }
    return _.flattenDeep(parsedData);
};

const generateFeaturesToImport = async (featureFolderPath: string, featureFolderFilter: string, featureTagFilter: string, scenarioDescriptionRegex?: RegExp, scenarioDescriptionRegexReplaceValue?: string) => {

    const featureFiles = await getAllFilesInDir(featureFolderPath, '.feature');
    const filteredFiles = featureFiles.filter(file => file.includes(featureFolderFilter));

    if (filteredFiles.length > 0) {
        const parsedData = await parseFeatureFiles(filteredFiles.sort(), scenarioDescriptionRegex, scenarioDescriptionRegexReplaceValue);

        const scenarioName = parsedData.map((data) => data.scenarioName.replace(/[^a-zA-Z0-9-:,() ]/g, ''));

        const nonUniqueScenarioName = _.filter(scenarioName, (val, i, iteratee) => _.includes(iteratee, val, i + 1));
        if (nonUniqueScenarioName.length > 0) {
            logger.error('XRAY: Below are duplicate scenario name found');
            nonUniqueScenarioName.map((scenario, index) => logger.error(`${stepDelimiter} ${index + 1}. ${scenario}`));
            throw new Error('XRAY: Fix the duplicate scenario names to proceed');
        }

        const noScenarioNameLength = _.filter(scenarioName, (name) => name.length > 250);
        if (noScenarioNameLength.length > 0) {
            logger.error('XRAY: Below scenario names has more than 250 Char');
            noScenarioNameLength.map((scenario, index) => logger.error(`${stepDelimiter} ${index + 1}. ${scenario}`));
            throw new Error('XRAY: Fix the scenario names to proceed');
        }

        return _.remove(parsedData.map(data => {
            const tags = data.tags.split(' ');
            const tagExpression = TagExpressionParser(featureTagFilter);
            if (tagExpression.evaluate(tags)) {
                return data;
            } else {
                return undefined;
            }
        }));

    } else {
        logger.error('XRAY: Given path does not have any feature files');
        throw new Error('XRAY: Fix the feature folder path to proceed');
    }
};


export default generateFeaturesToImport;
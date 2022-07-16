import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import denodeify from 'denodeify';
import recursiveReadDir from 'recursive-readdir';

import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { IdGenerator } from '@cucumber/messages';
import TagExpressionParser from '@cucumber/tag-expressions';

const lineDelimiter = '\n';
const stepDelimiter = '\t';

const readdir = denodeify(recursiveReadDir);
const readFile = denodeify(fs.readFile);

import logger from './logger';

const parseFeatureFiles = async (files: string[]) => {
    const parsedData: any = [];
    for await (const file of files) {
        // @ts-ignore
        const rawData = await readFile(file).then((raw: string) => raw.toString());
        const gherkinParser = new Parser(new AstBuilder(IdGenerator.incrementing()), new GherkinClassicTokenMatcher());
        const gherkinParsedData: any = gherkinParser.parse(rawData);
        let featureLevelTags = '';
        gherkinParsedData.feature.tags.forEach((tagDetail: {name: any;}) => {
            featureLevelTags += `${tagDetail.name} `;
        });
        let backgroundSteps = '';
        gherkinParsedData.feature.children.forEach((featureChild: any) => {
            let isBackground = false;
            let scenarioLevelTags = '';
            let scenarios: {scenarioType: string; scenarioName: string; tags: string; steps: string;}[] = [];
            if (featureChild.background) {
                isBackground = true;
                featureChild.background.steps.forEach((step: {keyword: any; text: any;}) => {
                    backgroundSteps += stepDelimiter;
                    backgroundSteps += step.keyword + step.text + lineDelimiter;
                });
            }
            if (featureChild.scenario) {
                let steps = '';
                const examplesArray: ({[s: string]: unknown;} | ArrayLike<unknown>)[] = [];
                let exampleHeaders: any[] = [];
                const exampleSection: any[] = [];
                if (featureChild.scenario.examples) {
                    featureChild.scenario.examples.forEach((examples: {tableHeader: {cells: any[];}; tableBody: any[];}) => {
                        exampleHeaders = examples.tableHeader.cells.map((value) => value.value);
                        examples.tableBody.forEach((exampleBody) => {
                            exampleSection.push(exampleBody.cells.map((value: {value: any;}) => value.value));
                        });
                    });
                    exampleSection.forEach((value) => {
                        const exampleObject: any = {};
                        exampleHeaders.forEach((value1, index) => {
                            exampleObject[value1] = value[index];
                        });
                        examplesArray.push(exampleObject);
                    });
                }
                const scenarioArray: any = [];
                if (examplesArray.length > 0) {
                    examplesArray.forEach((example) => {
                        let scenarioName = featureChild.scenario.name.toString();
                        scenarioName += ` (Example - ${JSON.stringify(example)})`;
                        scenarioName = scenarioName.toString().replace(/[^a-zA-Z0-9-:,() ]/g, '');
                        scenarioArray.push(`${lineDelimiter} ${featureChild.scenario.keyword}: ${scenarioName}`);
                    });
                } else {
                    scenarioArray.push(`${lineDelimiter} ${featureChild.scenario.keyword}: 
                    ${featureChild.scenario.name.toString().substring(featureChild.scenario.name.toString().indexOf(' ')).trim()}`);
                }
                featureChild.scenario.tags.forEach((tagDetail: {name: any;}) => {
                    scenarioLevelTags += `${tagDetail.name} `;
                });
                featureChild.scenario.steps.forEach((step: {keyword: string; text: string; dataTable: {rows: any[];};}) => {
                    steps = steps + stepDelimiter + step.keyword + step.text + lineDelimiter;
                    if (step.dataTable) {
                        step.dataTable.rows.forEach((dataTableValue) => {
                            dataTableValue.cells.forEach((dataTableCellValue: {value: any;}) => {
                                steps = `${steps + stepDelimiter}|${dataTableCellValue.value}`;
                            });
                            steps = `${steps}|${lineDelimiter}`;
                        });
                    }
                });
                scenarios = scenarioArray.map((scenarioDescription: any, index: number) => {
                    if (examplesArray.length > 0) {
                        let examples = '';
                        examples += `${stepDelimiter}Examples:  ${lineDelimiter}${stepDelimiter}`;
                        Object.keys(examplesArray[index]).forEach((key) => {
                            examples += `|${key.trim()}`;
                        });
                        examples += `|${lineDelimiter}${stepDelimiter}`;
                        Object.values(examplesArray[index]).forEach((value: any) => {
                            examples += `|${value.trim()}`;
                        });
                        examples += `|${lineDelimiter}`;
                        return {
                            scenarioType: scenarioDescription.trim().substring(0, scenarioDescription.trim().indexOf(':')).trim(),
                            scenarioName: scenarioDescription.trim().substring(scenarioDescription.trim().indexOf(':') + 1).trim(),
                            tags: (`${featureLevelTags + scenarioLevelTags}`).trim(),
                            steps: `${backgroundSteps + steps} ${examples}`
                        };
                    }
                    return {
                        scenarioType: scenarioDescription.trim().substring(0, scenarioDescription.trim().indexOf(':')).trim(),
                        scenarioName: scenarioDescription.trim().substring(scenarioDescription.trim().indexOf(':') + 1).trim(),
                        tags: (`${featureLevelTags + scenarioLevelTags}`).trim(),
                        steps: `${backgroundSteps + steps}`
                    };
                });
            }
            if (!isBackground) {
                parsedData.push(scenarios);
            }
        });
    }
    return _.flattenDeep(parsedData);
};

const generateFeaturesToImport = async (featureFilePath: string, fileFilters: string, tagFilter: string) => {        
    const basePath = path.resolve(featureFilePath);
    // @ts-ignore
    const files: string[] = await readdir(path.resolve(basePath), ['!*.feature']);
    const optimisedFiles = files.filter((file: string | string[]) => (file.includes(fileFilters)));
    optimisedFiles.map((file) => (logger.info(`XRAY: File "${file.substring(file.indexOf(featureFilePath))}" imported...`)));

    if (optimisedFiles.length > 0) {
        const parsedData: any = await parseFeatureFiles(optimisedFiles.sort());
        const scenarioName = parsedData.map((data: any) => data.scenarioName.replace(/[^a-zA-Z0-9-:,() ]/g, ''));
         // @ts-ignore
        const nonUniqueScenarioName = _.filter(scenarioName, (val, i, iteratee) => _.includes(iteratee, val, i + 1));
        const noScenarioNameLength = _.filter(scenarioName, (name) => name.length > 250);
        if (nonUniqueScenarioName.length > 0) {
            logger.error('XRAY: Below are duplicate scenario name found...');
            nonUniqueScenarioName.map((scenario, index) => logger.error(`${stepDelimiter} ${index + 1}. ${scenario}`));
            throw new Error('XRAY: Fix the duplicate scenario names to proceed...');
        }
        if (noScenarioNameLength.length > 0) {
            logger.error('XRAY: Below scenario names has more than 250 Char...');
            noScenarioNameLength.map((scenario, index) => logger.error(`${stepDelimiter} ${index + 1}. ${scenario}`));
            throw new Error('XRAY: Fix the scenario names to proceed...');
        }

        const outputParsedData: any = _.remove(parsedData.map((data: any) => {
            const tags = data.tags.split(' ');
            const tagExpression =  TagExpressionParser(tagFilter);
            if (tagExpression.evaluate(tags)) {
                return data;
            } else {
                return undefined;
            }
        }));
    
        return outputParsedData;
    } else {
        logger.error('XRAY: Given path does not have any feature files...');
        throw new Error('XRAY: Fix the feature folder path to proceed...');
    }  
};


export default generateFeaturesToImport;
import type { ObjectSchema } from 'yup';
import { setVariableSchema } from './setVariableSchema';
import { logSchema } from './logSchema';
import { ifSchema } from './ifSchema';
import { fetchDBSchema } from './fetchDBSchema';
import { codeSchema } from './codeSchema';
import { customFunctionSchema } from './customFunctionSchema';
import { createRuleSchema } from './rulesSchema';
import { loopSchema } from './loopSchema';
import { exitSchema } from './exitSchema';
import { importSchema } from './importSchema';
import { ternarySchema } from './ternarySchema';
import { objectOpSchema } from './objectOpSchema';
import { stringFuncSchema } from './stringFuncSchema';
import { destructureSchema } from './destructureSchema';
import { mathSchema } from './mathSchema';
import { arrayOpSchema } from './arrayOpSchema';
import { typeDefinitionSchema } from './typeDefinitionSchema';
import { customTestSchema } from './customTestSchema';
import { describeSchema } from './describeSchema';
import { determineOutcomeSchema } from './determineOutcomeSchema';
import {
  testNodeSchema,
  testNodeNoDbDataSchema,
  errorTestDualExpectSchema,
  errorTestDualExpectNoDbDataSchema,
  errorTestToleranceSchema,
} from './testNodeSchema';
import {
  ruleRequestScenarioSchema,
  factoryWithDataSchema,
  ruleConfigFactorySchema,
  ruleResultFactorySchema,
  dataCacheFactorySchema,
} from './factorySchema';
import { serviceSchema } from './serviceSchema';

export const nodeSchemas: Record<string, ObjectSchema<Record<string, unknown>>> = {
  SetVariable: setVariableSchema,
  Log: logSchema,
  If: ifSchema,
  FetchDB: fetchDBSchema,
  ThrowError: logSchema,
  Code: codeSchema,
  CustomFunction: customFunctionSchema,
  Loop: loopSchema,
  Exit: exitSchema,
  Import: importSchema,
  Ternary: ternarySchema,
  objectOp: objectOpSchema,
  stringFunc: stringFuncSchema,
  destructure: destructureSchema,
  math: mathSchema,
  arrayOp: arrayOpSchema,
  TypeDefinition: typeDefinitionSchema,
  StandardDeviation: customFunctionSchema,
  HaversineDistance: customFunctionSchema,
  CustomTest: customTestSchema,
  Describe: describeSchema,
  DetermineOutcome: determineOutcomeSchema,
  OutcomeTestBand01: testNodeSchema,
  OutcomeTestBand02: testNodeSchema,
  OutcomeTestBand02MaxQueryRangeOmitted: testNodeSchema,
  OutcomeTestExitX00: testNodeNoDbDataSchema,
  OutcomeTestExitX01: testNodeSchema,
  ErrorTestEmptyRows: testNodeNoDbDataSchema,
  ErrorTestArrayIsntNumbers: testNodeSchema,
  ErrorTestMissingBandsThrows: testNodeSchema,
  ErrorTestMissingExitConditions: testNodeSchema,
  ErrorTestBadOrMissingSubRuleRefX00: errorTestDualExpectNoDbDataSchema,
  ErrorTestBadOrMissingSubRuleRefX01: errorTestDualExpectSchema,
  ErrorTestNoTolerance: testNodeSchema,
  ErrorTestToleranceNotNumber: errorTestToleranceSchema,
  RuleRequestScenario: ruleRequestScenarioSchema,
  RuleRequestFactory: factoryWithDataSchema,
  RuleConfigFactory: ruleConfigFactorySchema,
  RuleResultFactory: ruleResultFactorySchema,
  DataCacheFactory: dataCacheFactorySchema,
  LoggerService: serviceSchema,
  DatabaseManager: serviceSchema,
};

export const ruleSchemas: Record<string, unknown> = {
  createRule: createRuleSchema
}

export type ValidatableNodeType = keyof typeof nodeSchemas;

export const hasValidation = (nodeType: string): boolean => {
  return nodeType in nodeSchemas;
};

export const getSchemaForNode = (nodeType: string): ObjectSchema<Record<string, unknown>> | null => {
  return nodeSchemas[nodeType] || null;
};

export const getSchemaForRules = (ruleType: string): unknown => {
  return ruleSchemas[ruleType];
};

export * from './setVariableSchema';
export * from './logSchema';
export * from './ifSchema';
export * from './fetchDBSchema';
export * from './codeSchema';
export * from './customFunctionSchema';
export * from './rulesSchema';
export * from './loopSchema';
export * from './exitSchema';
export * from './importSchema';
export * from './ternarySchema';
export * from './objectOpSchema';
export * from './stringFuncSchema';
export * from './destructureSchema';
export * from './mathSchema';
export * from './arrayOpSchema';
export * from './typeDefinitionSchema';
export * from './customTestSchema';
export * from './describeSchema';
export * from './testNodeSchema';
export * from './factorySchema';
export * from './serviceSchema';
export * from './determineOutcomeSchema';

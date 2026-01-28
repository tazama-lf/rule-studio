import type { ObjectSchema } from 'yup';
import { setVariableSchema } from './setVariableSchema';
import { logSchema } from './logSchema';
import { ifSchema } from './ifSchema';
import { fetchDBSchema } from './fetchDBSchema';
import { codeSchema } from './codeSchema';
import { customFunctionSchema } from './customFunctionSchema';
import { createRuleSchema } from './rulesSchema';

export const nodeSchemas: Record<string, ObjectSchema<Record<string, unknown>>> = {
  SetVariable: setVariableSchema,
  Log: logSchema,
  If: ifSchema,
  FetchDB: fetchDBSchema,
  ThrowError: logSchema, // Same validation as Log
  Code: codeSchema,
  CustomFunction: customFunctionSchema,
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

import {
  getSchemaForNode,
  getSchemaForRules,
  hasValidation,
  nodeSchemas,
  ruleSchemas,
  type ValidatableNodeType,
} from '../../../src/validation/schemas';
import * as schemaExports from '../../../src/validation/schemas';

describe('validation schemas index', () => {
  it('contains expected schema registry entries', () => {
    const knownNodeType: ValidatableNodeType = 'SetVariable';

    expect(nodeSchemas[knownNodeType]).toBeDefined();
    expect(nodeSchemas.ThrowError).toBe(nodeSchemas.Log);
    expect(ruleSchemas.createRule).toBeDefined();
  });

  it('normalizes lower-case node names and checks availability', () => {
    expect(hasValidation('SetVariable')).toBe(true);
    expect(hasValidation('objectOp')).toBe(true);
    expect(hasValidation('stringFunc')).toBe(true);
    expect(hasValidation('destructure')).toBe(true);
    expect(hasValidation('math')).toBe(true);
    expect(hasValidation('arrayOp')).toBe(true);

    expect(hasValidation('DoesNotExist')).toBe(false);
  });

  it('returns schemas for nodes and rules, and null/undefined for unknown entries', () => {
    expect(getSchemaForNode('SetVariable')).toBe(nodeSchemas.SetVariable);
    expect(getSchemaForNode('objectOp')).toBe(nodeSchemas.ObjectOp);
    expect(getSchemaForNode('DoesNotExist')).toBeNull();

    expect(getSchemaForRules('createRule')).toBe(ruleSchemas.createRule);
    expect(getSchemaForRules('unknownRule')).toBeUndefined();
  });

  it('re-exports all concrete schemas', () => {
    expect(schemaExports.setVariableSchema).toBeDefined();
    expect(schemaExports.logSchema).toBeDefined();
    expect(schemaExports.ifSchema).toBeDefined();
    expect(schemaExports.fetchDBSchema).toBeDefined();
    expect(schemaExports.codeSchema).toBeDefined();
    expect(schemaExports.customFunctionSchema).toBeDefined();
    expect(schemaExports.createRuleSchema).toBeDefined();
    expect(schemaExports.loopSchema).toBeDefined();
    expect(schemaExports.exitSchema).toBeDefined();
    expect(schemaExports.importSchema).toBeDefined();
    expect(schemaExports.ternarySchema).toBeDefined();
    expect(schemaExports.objectOpSchema).toBeDefined();
    expect(schemaExports.stringFuncSchema).toBeDefined();
    expect(schemaExports.destructureSchema).toBeDefined();
    expect(schemaExports.mathSchema).toBeDefined();
    expect(schemaExports.arrayOpSchema).toBeDefined();
    expect(schemaExports.typeDefinitionSchema).toBeDefined();
    expect(schemaExports.customTestSchema).toBeDefined();
    expect(schemaExports.describeSchema).toBeDefined();
    expect(schemaExports.testNodeSchema).toBeDefined();
    expect(schemaExports.ruleRequestScenarioSchema).toBeDefined();
    expect(schemaExports.serviceSchema).toBeDefined();
    expect(schemaExports.determineOutcomeSchema).toBeDefined();
  });
});

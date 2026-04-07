import type { AnyObjectSchema } from 'yup';
import { ValidationError } from 'yup';

import { arrayOpSchema } from '../../../src/validation/schemas/arrayOpSchema';
import { loginValidation } from '../../../src/validation/schemas/authSchema';
import { codeSchema } from '../../../src/validation/schemas/codeSchema';
import { customFunctionSchema } from '../../../src/validation/schemas/customFunctionSchema';
import { customTestSchema } from '../../../src/validation/schemas/customTestSchema';
import { describeSchema } from '../../../src/validation/schemas/describeSchema';
import { destructureSchema } from '../../../src/validation/schemas/destructureSchema';
import { determineOutcomeSchema } from '../../../src/validation/schemas/determineOutcomeSchema';
import { exitSchema } from '../../../src/validation/schemas/exitSchema';
import {
  dataCacheFactorySchema,
  factorySchema,
  factoryWithDataSchema,
  ruleConfigFactorySchema,
  ruleRequestScenarioSchema,
  ruleResultFactorySchema,
} from '../../../src/validation/schemas/factorySchema';
import { fetchDBSchema } from '../../../src/validation/schemas/fetchDBSchema';
import { ifSchema } from '../../../src/validation/schemas/ifSchema';
import { importSchema } from '../../../src/validation/schemas/importSchema';
import { logSchema } from '../../../src/validation/schemas/logSchema';
import { loopSchema } from '../../../src/validation/schemas/loopSchema';
import { mathSchema } from '../../../src/validation/schemas/mathSchema';
import { objectOpSchema } from '../../../src/validation/schemas/objectOpSchema';
import { createRuleSchema } from '../../../src/validation/schemas/rulesSchema';
import { serviceSchema } from '../../../src/validation/schemas/serviceSchema';
import { setVariableSchema } from '../../../src/validation/schemas/setVariableSchema';
import { stringFuncSchema } from '../../../src/validation/schemas/stringFuncSchema';
import { ternarySchema } from '../../../src/validation/schemas/ternarySchema';
import {
  errorTestDualExpectNoDbDataSchema,
  errorTestDualExpectSchema,
  errorTestToleranceSchema,
  testNodeNoDbDataSchema,
  testNodeSchema,
} from '../../../src/validation/schemas/testNodeSchema';
import { typeDefinitionSchema } from '../../../src/validation/schemas/typeDefinitionSchema';

import { validateSQLQuery } from '../../../src/utils/Common/queryValidation';

jest.mock('../../../src/utils/Common/queryValidation', () => ({
  validateSQLQuery: jest.fn(),
}));

const mockValidateSQLQuery = validateSQLQuery as jest.MockedFunction<typeof validateSQLQuery>;

type InternalFieldTest = {
  OPTIONS: {
    name?: string;
    test: (this: unknown, value: unknown) => unknown;
  };
};

type SchemaWithFieldTests = {
  fields: Record<string, { tests: InternalFieldTest[] }>;
};

const expectValid = async (schema: AnyObjectSchema, value: Record<string, unknown>) => {
  await expect(schema.validate(value)).resolves.toBeTruthy();
};

const expectInvalid = async (
  schema: AnyObjectSchema,
  value: Record<string, unknown>,
  messageIncludes?: string
) => {
  const validatePromise = schema.validate(value, { abortEarly: false });
  await expect(validatePromise).rejects.toBeInstanceOf(ValidationError);

  if (messageIncludes) {
    const error = await validatePromise.catch((err: unknown) => err as ValidationError);
    const messages = [error.message, ...error.errors].join(' | ');
    expect(messages).toContain(messageIncludes);
  }
};

const getFieldTest = (
  schema: unknown,
  fieldName: string,
  testName: string
): InternalFieldTest | undefined => {
  const withFieldTests = schema as SchemaWithFieldTests;
  const tests = withFieldTests.fields[fieldName]?.tests || [];
  return tests.find((test) => test.OPTIONS.name === testName);
};

describe('validation schemas - core behavior', () => {
  describe('arrayOpSchema', () => {
    it('validates template and variable names', async () => {
      await expectValid(arrayOpSchema, {
        array: '{{items}}',
        operation: 'push',
        resultVar: 'res',
      });
      await expectValid(arrayOpSchema, { array: 'obj.items[0]', operation: 'length' });
      await expectInvalid(arrayOpSchema, { array: '1bad', operation: 'push' }, 'Must be a valid array reference');
      await expectInvalid(arrayOpSchema, { array: 'items', operation: 'unknown' }, 'Must be a valid array operation');
      await expectInvalid(arrayOpSchema, { array: 'items', operation: 'push', resultVar: '9x' }, 'Must be a valid identifier');
    });
  });

  describe('authSchema', () => {
    it('validates login form fields and email custom test', async () => {
      await expectValid(loginValidation, { username: 'user@example.com', password: 'secret1' });
      await expectInvalid(loginValidation, { username: 'user@domain', password: 'secret1' }, 'Email must contain a dot');
      await expectInvalid(loginValidation, { username: 'nodomain', password: 'secret1' }, 'A valid email address is required');
      await expectInvalid(loginValidation, { username: 'not-email', password: 'secret1' }, 'A valid email address is required');
      await expectInvalid(loginValidation, { username: 'user@example.com', password: '123' }, 'Must be at least 6 characters');
    });
  });

  describe('code/custom text schemas', () => {
    it('validates code, custom test, and describe payloads', async () => {
      await expectValid(codeSchema, { code: 'return 1;' });
      await expectInvalid(codeSchema, { code: '' }, 'Code cannot be empty');

      await expectValid(customTestSchema, { testCode: 'expect(1).toBe(1)' });
      await expectInvalid(customTestSchema, { testCode: '   ' }, 'cannot be empty or just whitespace');

      await expectValid(describeSchema, { describeName: 'suite' });
      await expectInvalid(describeSchema, { describeName: '   ' }, 'cannot be empty or just whitespace');
    });
  });

  describe('customFunctionSchema', () => {
    it('supports definition mode constraints', async () => {
      await expectInvalid(
        customFunctionSchema,
        { mode: 'definition', function_name: '', code_template: 'return 1;' },
        'Function name is required'
      );
      await expectInvalid(
        customFunctionSchema,
        { mode: 'definition', function_name: 'bad-name', code_template: 'return 1;' },
        'Must be a valid function name'
      );
      await expectInvalid(
        customFunctionSchema,
        { mode: 'definition', function_name: 'buildFn', code_template: ' ' },
        'Function code is required'
      );
      await expectValid(customFunctionSchema, {
        mode: 'definition',
        function_name: 'buildFn',
        code_template: 'return 1;',
      });
    });

    it('supports call mode constraints and generation_type fallback', async () => {
      await expectInvalid(
        customFunctionSchema,
        { mode: 'call', storeResult: 'true', resultVariable: '' },
        'Result variable is required'
      );
      await expectInvalid(
        customFunctionSchema,
        { generation_type: 'call', storeResult: 'true', resultVariable: 'bad-name' },
        'Must be a valid identifier'
      );
      await expectValid(customFunctionSchema, {
        mode: 'call',
        storeResult: 'false',
        resultVariable: '',
      });
      await expectValid(customFunctionSchema, {
        generation_type: 'call',
        storeResult: 'true',
        resultVariable: 'outVar',
      });
    });
  });

  describe('destructure/determineOutcome/exit', () => {
    it('validates destructure shape', async () => {
      await expectValid(destructureSchema, { source: '{{obj}}', keys: 'a, b' });
      await expectValid(destructureSchema, { source: 'obj.path[0]', keys: 'a,b' });
      await expectInvalid(destructureSchema, { source: '123', keys: 'a,b' }, 'Must be a valid object reference');
      await expectInvalid(destructureSchema, { source: 'obj', keys: 'a,1b' }, 'Must be valid comma-separated identifiers');
    });

    it('validates determine outcome arguments', async () => {
      await expectValid(determineOutcomeSchema, {
        argument1: '{{obj.value}}',
        argument2: "user['name']",
        argument3: 'result.path',
      });
      await expectInvalid(determineOutcomeSchema, {
        argument1: 'bad-value!',
        argument2: 'okValue',
        argument3: 'okValue',
      });
    });

    it('validates exit node', async () => {
      await expectValid(exitSchema, { exitType: 'break' });
      await expectInvalid(exitSchema, { exitType: 'stop' }, 'Must be break, continue, or return');
    });
  });

  describe('factory schemas', () => {
    it('validates factory identifiers and json payloads', async () => {
      await expectValid(factorySchema, { factoryName: 'MyFactory' });
      await expectInvalid(factorySchema, { factoryName: 'bad name' }, 'Must be a valid identifier');
      await expectInvalid(factorySchema, { factoryName: '   ' }, 'cannot be empty');

      await expectValid(ruleRequestScenarioSchema, { factoryName: 'Factory1', modifications: '{}' });
      await expectValid(factoryWithDataSchema, { factoryName: 'Factory1', ruleRequestData: '{}' });
      await expectValid(ruleConfigFactorySchema, { factoryName: 'Factory1', ruleConfigData: '{}' });
      await expectValid(ruleResultFactorySchema, { factoryName: 'Factory1', ruleResultData: '{}' });

      await expectValid(dataCacheFactorySchema, {
        variableName: 'cache',
        dataCacheData: '{"a":1}',
      });
      await expectInvalid(dataCacheFactorySchema, {
        variableName: 'cache',
        dataCacheData: '{bad',
      }, 'Must be valid JSON');
      await expectInvalid(dataCacheFactorySchema, {
        variableName: 'cache',
        dataCacheData: ' ',
      }, 'Must be valid JSON');
    });
  });

  describe('fetchDBSchema', () => {
    beforeEach(() => {
      mockValidateSQLQuery.mockReset();
      mockValidateSQLQuery.mockReturnValue({ isValid: true, error: '' });
    });

    it('validates SQL query and identifier fields', async () => {
      await expectValid(fetchDBSchema, {
        query: 'SELECT * FROM table',
        variable: 'rows',
      });
      expect(mockValidateSQLQuery).toHaveBeenCalledWith('SELECT * FROM table');

      mockValidateSQLQuery.mockReturnValue({ isValid: false, error: 'Bad SQL' });
      await expectInvalid(fetchDBSchema, {
        query: 'drop',
        variable: 'rows',
      }, 'Bad SQL');

      await expectInvalid(fetchDBSchema, {
        query: 'SELECT 1',
      }, 'Result variable name is required');

      await expectInvalid(fetchDBSchema, {
        query: 'SELECT 1',
        resultVar: '1bad',
      }, 'Must be a valid identifier');

      await expectInvalid(fetchDBSchema, {
        query: 'SELECT 1',
        variable: 'bad-name',
      }, 'Must be a valid identifier');
    });
  });

  describe('if/import/log', () => {
    it('validates if schema conditions', async () => {
      await expectValid(ifSchema, {
        conditions: JSON.stringify([
          { type: 'if', condition: 'x > 1' },
          { type: 'else', condition: '' },
        ]),
      });
      await expectInvalid(ifSchema, { conditions: 'not-json' }, 'Invalid conditions format');
      await expectInvalid(ifSchema, { conditions: JSON.stringify([]) }, 'Must have at least one "if" condition');
      await expectInvalid(
        ifSchema,
        { conditions: JSON.stringify([{ type: 'else', condition: '' }]) },
        'Must have at least one "if" condition'
      );
      await expectInvalid(
        ifSchema,
        { conditions: JSON.stringify([{ type: 'if', condition: '   ' }]) },
        'All conditions must have valid text'
      );
    });

    it('validates import and log schema', async () => {
      await expectValid(importSchema, { importStatement: "import { x } from 'y';" });
      await expectInvalid(importSchema, { importStatement: '/* import x from y */' }, 'Must contain at least one valid import statement');

      await expectValid(logSchema, { text: 'hello', message: 'alias' });
      await expectInvalid(logSchema, { text: '' }, 'Message is required');
    });
  });

  describe('loop/math/object/string/ternary', () => {
    it('validates loop schema conditional branches', async () => {
      await expectValid(loopSchema, { loopType: 'forEach', arrayVariable: 'items' });
      await expectValid(loopSchema, { loopType: 'forEach', arrayVariable: '{{items}}' });
      await expectInvalid(loopSchema, { loopType: 'forEach', arrayVariable: '' }, 'Array variable is required');

      await expectValid(loopSchema, {
        loopType: 'while',
        loopCondition: 'i < 10',
      });

      await expectInvalid(loopSchema, {
        loopType: 'while',
        loopCondition: 'i < 10',
        arrayVariable: '1bad',
      }, 'Must be a valid variable name or template');
      await expectValid(loopSchema, {
        loopType: 'while',
        loopCondition: 'i < 10',
        arrayVariable: '{{arr}}',
      });
      await expectValid(loopSchema, {
        loopType: 'while',
        loopCondition: 'i < 10',
        arrayVariable: 'arr.items',
      });

      await expectInvalid(loopSchema, {
        loopType: 'while',
        arrayVariable: '',
      }, 'Array variable is required');
    });

    it('validates math/object/string/ternary schemas', async () => {
      await expectValid(mathSchema, { method: 'abs', value: '{{num}}', resultVar: 'out' });
      await expectValid(mathSchema, { method: 'sqrt', value: 'obj.value', resultVar: 'out' });
      await expectValid(mathSchema, { method: 'sin', value: '5.2', resultVar: 'out' });
      await expectInvalid(mathSchema, { method: 'sin', value: '#bad', resultVar: 'out' }, 'Must be a valid number or variable');

      await expectValid(objectOpSchema, { object: 'obj.path', operation: 'keys', resultVar: 'res' });
      await expectInvalid(objectOpSchema, { object: '1bad', operation: 'keys', resultVar: 'res' }, 'Must be a valid object reference');
      await expectInvalid(objectOpSchema, { object: 'obj', operation: 'bad', resultVar: 'res' }, 'Must be a valid object operation');

      await expectValid(stringFuncSchema, { text: 'abc', method: 'trim', resultVar: 'res' });
      await expectInvalid(stringFuncSchema, { text: '', method: 'trim', resultVar: 'res' }, 'String is required');

      await expectValid(ternarySchema, {
        ternaryTree: JSON.stringify({ condition: 'x>1', trueValue: 'a', falseValue: 'b' }),
        resultVar: 'res',
      });
      await expectInvalid(ternarySchema, { ternaryTree: 'bad-json', resultVar: 'res' }, 'Must be a valid JSON object');
      await expectInvalid(ternarySchema, { ternaryTree: JSON.stringify({ condition: 'x', trueValue: 'a' }) }, 'Must be a valid JSON object');
      await expectInvalid(ternarySchema, {
        ternaryTree: JSON.stringify({ condition: 'x', trueValue: 'a', falseValue: 'b' }),
        resultVar: 'bad-name',
      }, 'Must be a valid identifier');
    });
  });

  describe('rules/service/setVariable/typeDefinition/testNode', () => {
    it('validates create rule schema and service schema', async () => {
      await expectValid(createRuleSchema, {
        rule_name: 'Rule',
        description: 'Desc',
        txtp: { label: 'l', value: 'v' },
        txtpVersion: { label: 'l', value: 'v' },
        version: '1.2.3',
        rule_config_id: { label: 'l', value: 'v' },
        rule_type: { label: 'l', value: 'v' },
      });

      await expectInvalid(createRuleSchema, {
        rule_name: 'Rule',
        description: 'Desc',
        txtp: null,
        txtpVersion: null,
        version: '1',
        rule_config_id: null,
        rule_type: null,
      }, 'TxTp is required');

      await expectValid(serviceSchema, { variableName: 'svcVar' });
      await expectInvalid(serviceSchema, { variableName: '  ' }, 'cannot be empty');
    });

    it('validates setVariable schema branches including defaults', async () => {
      expect(setVariableSchema.cast({ name: 'x' })).toEqual(
        expect.objectContaining({ declarationType: 'var', dataType: 'any' })
      );

      await expectInvalid(setVariableSchema, { name: 'if', dataType: 'string' }, 'Cannot use reserved keywords');

      await expectValid(setVariableSchema, { name: 'n1', dataType: 'number', value: '42' });
      await expectValid(setVariableSchema, { name: 'n1', dataType: 'number', value: '{{num}}' });
      await expectInvalid(setVariableSchema, { name: 'n1', dataType: 'number', value: 'NaNabc' }, 'Value must be a valid number');

      await expectValid(setVariableSchema, { name: 'b1', dataType: 'boolean', value: 'true' });
      await expectValid(setVariableSchema, { name: 'b1', dataType: 'boolean', value: '{{flag}}' });
      await expectInvalid(setVariableSchema, { name: 'b1', dataType: 'boolean', value: 'yes' }, 'Value must be true or false');

      await expectValid(setVariableSchema, { name: 'a1', dataType: 'array', value: '[1,2]' });
      await expectValid(setVariableSchema, { name: 'a1', dataType: 'array', value: '{{arr}}' });
      await expectInvalid(setVariableSchema, { name: 'a1', dataType: 'array', value: 'x' }, 'Value must be a valid JSON array');
      await expectInvalid(setVariableSchema, { name: 'a1', dataType: 'array', value: '[1,2' }, 'Value must be a valid JSON array');

      await expectValid(setVariableSchema, { name: 'o1', dataType: 'object', value: '{"a":1}' });
      await expectValid(setVariableSchema, { name: 'o1', dataType: 'object', value: '{{obj}}' });
      await expectInvalid(setVariableSchema, { name: 'o1', dataType: 'object', value: 'x' }, 'Value must be a valid JSON object');
      await expectInvalid(setVariableSchema, { name: 'o1', dataType: 'object', value: '{bad' }, 'Value must be a valid JSON object');
      await expectInvalid(setVariableSchema, { name: 'o1', dataType: 'object', value: '[1,2]' }, 'Value must be a valid JSON object');

      await expectValid(setVariableSchema, { name: 'u1', dataType: 'undefined', value: '' });
      await expectInvalid(setVariableSchema, { name: 'u1', dataType: 'undefined', value: 'x' }, 'Value should be empty for undefined type');
    });

    it('validates typeDefinition schema and test-node schemas', async () => {
      await expectValid(typeDefinitionSchema, {});
      await expectInvalid(typeDefinitionSchema, { typeKind: 'type', typeName: '' }, 'Type name is required');
      await expectInvalid(typeDefinitionSchema, { typeKind: 'type', typeName: 'badName' }, 'PascalCase');
      await expectInvalid(typeDefinitionSchema, { typeKind: 'interface', typeName: 'GoodName', typeDefinition: '' }, 'Type definition is required');
      await expectValid(typeDefinitionSchema, {
        typeKind: 'type',
        typeName: 'GoodName',
        typeDefinition: '{ a: number }',
        variableName: 'myVar',
      });
      await expectInvalid(typeDefinitionSchema, { variableName: '9bad' }, 'valid variable name');

      await expectValid(testNodeSchema, {
        testName: 'my test',
        dbData: '[]',
        expectStatement: 'expect(x).toBe(1)',
      });
      await expectInvalid(testNodeSchema, {
        testName: ' ',
        dbData: '[]',
        expectStatement: 'x',
      }, 'Test name cannot be empty');
      await expectInvalid(testNodeSchema, {
        testName: 'ok',
        dbData: '',
        expectStatement: 'x',
      }, 'DB data array is required');
      await expectInvalid(testNodeSchema, {
        testName: 'ok',
        dbData: 'x',
        expectStatement: 'x',
      }, 'Must be a valid array format');
      await expectInvalid(testNodeSchema, {
        testName: 'ok',
        dbData: '[]',
        expectStatement: ' ',
      }, 'Expect statement cannot be empty');

      await expectValid(testNodeNoDbDataSchema, {
        testName: 'ok',
        expectStatement: 'x',
      });
      await expectInvalid(testNodeNoDbDataSchema, { testName: ' ', expectStatement: 'x' }, 'Test name cannot be empty');

      await expectValid(errorTestDualExpectSchema, {
        testName: 'ok',
        dbData: '[]',
        successExpectStatement: 'a',
        errorExpectStatement: 'b',
      });
      await expectInvalid(errorTestDualExpectSchema, {
        testName: 'ok',
        dbData: '',
        successExpectStatement: 'a',
        errorExpectStatement: 'b',
      }, 'DB data array is required');
      await expectInvalid(errorTestDualExpectSchema, {
        testName: 'ok',
        dbData: '[',
        successExpectStatement: 'a',
        errorExpectStatement: 'b',
      }, 'Must be a valid array format');

      await expectValid(errorTestDualExpectNoDbDataSchema, {
        testName: 'ok',
        successExpectStatement: 'a',
        errorExpectStatement: 'b',
      });

      await expectValid(errorTestToleranceSchema, {
        testName: 'ok',
        dbData: '[]',
        toleranceValue: '0.1',
        expectStatement: 'x',
      });
      await expectInvalid(errorTestToleranceSchema, {
        testName: 'ok',
        dbData: 'x',
        toleranceValue: '0.1',
        expectStatement: 'x',
      }, 'Must be a valid array format');
      await expectInvalid(errorTestToleranceSchema, {
        testName: 'ok',
        dbData: '[]',
        toleranceValue: ' ',
        expectStatement: 'x',
      }, 'Tolerance value cannot be empty');
    });
  });

  describe('branch edge coverage', () => {
    it('covers required/empty branches and optional false paths', async () => {
      await expectInvalid(arrayOpSchema, { array: '', operation: 'push' }, 'Array is required');
      await expectInvalid(loginValidation, { password: 'secret1' }, 'This Field is Required');
      await expectInvalid(customTestSchema, {}, 'Test code is required');
      await expectInvalid(describeSchema, {}, 'Describe name is required');
      await expectInvalid(destructureSchema, { source: '', keys: '' }, 'Source object is required');
      await expectInvalid(determineOutcomeSchema, {
        argument1: '',
        argument2: 'a',
        argument3: 'b',
      }, 'Argument 1 is required');

      await expectInvalid(ruleRequestScenarioSchema, { factoryName: ' ' }, 'cannot be empty');
      await expectInvalid(factoryWithDataSchema, { factoryName: ' ' }, 'cannot be empty');
      await expectInvalid(ruleConfigFactorySchema, { factoryName: ' ' }, 'cannot be empty');
      await expectInvalid(ruleResultFactorySchema, { factoryName: ' ' }, 'cannot be empty');
      await expectInvalid(dataCacheFactorySchema, { variableName: ' ', dataCacheData: '{}' }, 'Variable name cannot be empty');

      await expectInvalid(importSchema, { importStatement: '' }, 'Import statement is required');
      await expectInvalid(loopSchema, { loopType: 'forEach', arrayVariable: '1bad' }, 'Must be a valid variable name or template');
      await expectInvalid(mathSchema, { method: 'sin', value: '', resultVar: 'x' }, 'Value is required');
      await expectValid(objectOpSchema, { object: '{{obj}}', operation: 'keys', resultVar: 'res' });
      await expectInvalid(objectOpSchema, { object: '', operation: 'keys', resultVar: 'res' }, 'Object is required');
      await expectInvalid(serviceSchema, {}, 'Variable name is required');

      await expectInvalid(setVariableSchema, { dataType: 'string' }, 'Variable name is required');
      await expectValid(setVariableSchema, { name: 'n2', dataType: 'number', value: '' });
      await expectValid(setVariableSchema, { name: 'b2', dataType: 'boolean', value: '' });
      await expectValid(setVariableSchema, { name: 'a2', dataType: 'array', value: '' });
      await expectValid(setVariableSchema, { name: 'o2', dataType: 'object', value: '' });

      await expectInvalid(ternarySchema, { ternaryTree: '' }, 'Ternary tree structure is required');
      await expectInvalid(errorTestToleranceSchema, {
        testName: 'ok',
        dbData: '[]',
        expectStatement: 'x',
      }, 'Tolerance value is required');
    });

    it('covers internal catch/fallback branches in custom tests', () => {
      const throwingValue = { trim: () => { throw new Error('trim boom'); } } as unknown as string;

      // A non-empty string-like that causes JSON.parse to throw inside Yup chained tests
      const badJsonString = '{bad-json' as string;

      const authDotAfterAt = getFieldTest(loginValidation, 'username', 'dot-after-at');
      expect(authDotAfterAt?.OPTIONS.test.call({}, undefined)).toBe(true);
      expect(authDotAfterAt?.OPTIONS.test.call({}, 'nodomain')).toBe(false);

      const customTestNotEmpty = getFieldTest(customTestSchema, 'testCode', 'not-empty');
      const describeNotEmpty = getFieldTest(describeSchema, 'describeName', 'not-empty');
      expect(customTestNotEmpty?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(describeNotEmpty?.OPTIONS.test.call({}, undefined)).toBe(false);

      const factoryNotEmpty = getFieldTest(factorySchema, 'factoryName', 'not-empty');
      const requestNotEmpty = getFieldTest(ruleRequestScenarioSchema, 'factoryName', 'not-empty');
      const withDataNotEmpty = getFieldTest(factoryWithDataSchema, 'factoryName', 'not-empty');
      const ruleConfigNotEmpty = getFieldTest(ruleConfigFactorySchema, 'factoryName', 'not-empty');
      const ruleResultNotEmpty = getFieldTest(ruleResultFactorySchema, 'factoryName', 'not-empty');
      const serviceNotEmpty = getFieldTest(serviceSchema, 'variableName', 'not-empty');

      expect(factoryNotEmpty?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(requestNotEmpty?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(withDataNotEmpty?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(ruleConfigNotEmpty?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(ruleResultNotEmpty?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(serviceNotEmpty?.OPTIONS.test.call({}, undefined)).toBe(false);

      const ifValidJson = getFieldTest(ifSchema, 'conditions', 'valid-json');
      const fetchDbQueryTest = getFieldTest(fetchDBSchema, 'query', 'valid-sql-query');
      const fetchDbResult = fetchDbQueryTest?.OPTIONS.test.call({}, undefined);
      expect(fetchDbResult).toBe(true);

      const ifHasIfCondition = getFieldTest(ifSchema, 'conditions', 'has-if-condition');
      const ifValidConditionText = getFieldTest(ifSchema, 'conditions', 'valid-condition-text');
      expect(ifValidJson?.OPTIONS.test.call({}, JSON.stringify([{ type: 'if', condition: 'x' }]))).toBe(true);
      expect(ifValidJson?.OPTIONS.test.call({}, JSON.stringify([]))).toBe(false);
      // Trigger the `value || '[]'` fallback branches (right-hand side of ||) in each test
      expect(ifValidJson?.OPTIONS.test.call({}, '')).toBe(false);
      expect(ifValidJson?.OPTIONS.test.call({}, null)).toBe(false);
      expect(ifHasIfCondition?.OPTIONS.test.call({}, 'not-json')).toBe(false);
      expect(ifHasIfCondition?.OPTIONS.test.call({}, JSON.stringify([{ type: 'if', condition: 'x' }]))).toBe(true);
      // Trigger the `value || '[]'` fallback branches in has-if-condition and valid-condition-text
      expect(ifHasIfCondition?.OPTIONS.test.call({}, '')).toBe(false);
      expect(ifHasIfCondition?.OPTIONS.test.call({}, null)).toBe(false);
      expect(ifValidConditionText?.OPTIONS.test.call({}, 'not-json')).toBe(false);
      expect(ifValidConditionText?.OPTIONS.test.call({}, JSON.stringify([{ type: 'if', condition: 'x' }, { type: 'else' }]))).toBe(true);
      expect(ifValidConditionText?.OPTIONS.test.call({}, '')).toBe(true);
      expect(ifValidConditionText?.OPTIONS.test.call({}, null)).toBe(true);
      // Cover catch branches in has-if-condition and valid-condition-text by injecting invalid JSON
      expect(ifHasIfCondition?.OPTIONS.test.call({}, badJsonString)).toBe(false);
      expect(ifValidConditionText?.OPTIONS.test.call({}, badJsonString)).toBe(false);

      const setVariableNotReserved = getFieldTest(setVariableSchema, 'name', 'not-reserved');
      expect(setVariableNotReserved?.OPTIONS.test.call({}, undefined)).toBe(true);

      const testNodeValidArray = getFieldTest(testNodeSchema, 'dbData', 'valid-array');
      const dualExpectValidArray = getFieldTest(errorTestDualExpectSchema, 'dbData', 'valid-array');
      const toleranceValidArray = getFieldTest(errorTestToleranceSchema, 'dbData', 'valid-array');

      expect(testNodeValidArray?.OPTIONS.test.call({}, throwingValue)).toBe(false);
      expect(dualExpectValidArray?.OPTIONS.test.call({}, throwingValue)).toBe(false);
      expect(toleranceValidArray?.OPTIONS.test.call({}, throwingValue)).toBe(false);
      expect(toleranceValidArray?.OPTIONS.test.call({}, undefined)).toBe(false);
      // verify toleranceValidArray was actually found and called (not undefined)
      expect(toleranceValidArray).toBeDefined();

      // Cover the `false` side of all not-empty ternaries in testNodeSchema exports
      const tNodeTestNameOk = getFieldTest(testNodeSchema, 'testName', 'not-empty');
      const tNodeExpectOk = getFieldTest(testNodeSchema, 'expectStatement', 'not-empty');
      const tNodeNoDbTestName = getFieldTest(testNodeNoDbDataSchema, 'testName', 'not-empty');
      const tNodeNoDbExpect = getFieldTest(testNodeNoDbDataSchema, 'expectStatement', 'not-empty');
      const dualTestName = getFieldTest(errorTestDualExpectSchema, 'testName', 'not-empty');
      const dualSuccess = getFieldTest(errorTestDualExpectSchema, 'successExpectStatement', 'not-empty');
      const dualError = getFieldTest(errorTestDualExpectSchema, 'errorExpectStatement', 'not-empty');
      const dualNoDbTestName = getFieldTest(errorTestDualExpectNoDbDataSchema, 'testName', 'not-empty');
      const dualNoDbSuccess = getFieldTest(errorTestDualExpectNoDbDataSchema, 'successExpectStatement', 'not-empty');
      const dualNoDbError = getFieldTest(errorTestDualExpectNoDbDataSchema, 'errorExpectStatement', 'not-empty');
      const tolTestName = getFieldTest(errorTestToleranceSchema, 'testName', 'not-empty');
      const tolTolerance = getFieldTest(errorTestToleranceSchema, 'toleranceValue', 'not-empty');
      const tolExpect = getFieldTest(errorTestToleranceSchema, 'expectStatement', 'not-empty');

      expect(tNodeTestNameOk?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(tNodeTestNameOk?.OPTIONS.test.call({}, 'suite')).toBe(true);
      expect(tNodeExpectOk?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(tNodeExpectOk?.OPTIONS.test.call({}, 'x')).toBe(true);
      expect(tNodeNoDbTestName?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(tNodeNoDbExpect?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(dualTestName?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(dualSuccess?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(dualError?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(dualNoDbTestName?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(dualNoDbSuccess?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(dualNoDbError?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(tolTestName?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(tolTolerance?.OPTIONS.test.call({}, undefined)).toBe(false);
      expect(tolExpect?.OPTIONS.test.call({}, undefined)).toBe(false);

      // Cover dataCacheFactorySchema.variableName not-empty false branch
      const dataCacheVarNotEmpty = getFieldTest(dataCacheFactorySchema, 'variableName', 'not-empty');
      expect(dataCacheVarNotEmpty?.OPTIONS.test.call({}, undefined)).toBe(false);
    });
  });
});

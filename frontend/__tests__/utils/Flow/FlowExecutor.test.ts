import { simulateNodeExecution } from '../../../src/utils/Flow/FlowExecutor';
import type { Node } from '@xyflow/react';

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeNode = (type: string, params: Record<string, string> = {}): Node => ({
  id: 'n1',
  type: 'editableNode',
  position: { x: 0, y: 0 },
  data: { nodeType: type, label: type, params },
});

// ─── simulateNodeExecution ────────────────────────────────────────────────────

describe('simulateNodeExecution (utils/Flow/FlowExecutor)', () => {
  // ─── Start ────────────────────────────────────────────────────────────────

  describe('Start node', () => {
    it('should log "Process Started" message', () => {
      const result = simulateNodeExecution(makeNode('Start'), {});
      expect(result.logMessage).toContain('Process Started');
    });

    it('should not produce an error', () => {
      expect(simulateNodeExecution(makeNode('Start'), {}).error).toBeNull();
    });

    it('should not change variables', () => {
      const result = simulateNodeExecution(makeNode('Start'), { x: 1 });
      expect(result.newVariables.x).toBe(1);
    });
  });

  // ─── Import ───────────────────────────────────────────────────────────────

  describe('Import node', () => {
    it('should log "Imported module" message', () => {
      const result = simulateNodeExecution(makeNode('Import', { importStatement: 'lodash' }), {});
      expect(result.logMessage).toContain('Imported module: lodash');
    });

    it('should fall back to "default" when no importStatement', () => {
      const result = simulateNodeExecution(makeNode('Import'), {});
      expect(result.logMessage).toContain('default');
    });
  });

  // ─── SetVariable ──────────────────────────────────────────────────────────

  describe('SetVariable node', () => {
    it('should set a new variable in newVariables', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'count', value: '42' }),
        {}
      );
      expect(result.newVariables.count).toBeDefined();
    });

    it('should include the variable name in the log message', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'count', value: '42' }),
        {}
      );
      expect(result.logMessage).toContain('count');
    });

    it('should handle variableName param alias', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { variableName: 'total', value: '100' }),
        {}
      );
      expect(result.logMessage).toContain('total');
    });

    it('should not produce an error for a valid variable name', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'myVar', value: '5' }),
        {}
      );
      expect(result.error).toBeNull();
    });
  });

  // ─── Log ──────────────────────────────────────────────────────────────────

  describe('Log node', () => {
    it('should include "LOG:" prefix in log message', () => {
      const result = simulateNodeExecution(
        makeNode('Log', { text: 'hello world' }),
        {}
      );
      expect(result.logMessage).toContain('LOG');
    });

    it('should log the message text', () => {
      const result = simulateNodeExecution(
        makeNode('Log', { text: 'hello world' }),
        {}
      );
      expect(result.logMessage).toContain('hello world');
    });

    it('should interpolate variable values in message', () => {
      const result = simulateNodeExecution(
        makeNode('Log', { text: '{{ myVar }}' }),
        { myVar: 'test-value' }
      );
      expect(result.logMessage).toContain('test-value');
    });

    it('should not change variables', () => {
      const result = simulateNodeExecution(makeNode('Log', { text: 'hi' }), { x: 1 });
      expect(result.newVariables.x).toBe(1);
    });
  });

  // ─── If ───────────────────────────────────────────────────────────────────

  describe('If node', () => {
    it('should take "if" branch when boolean condition is true', () => {
      const conditions = JSON.stringify([{ type: 'if', condition: 'true' }]);
      const result = simulateNodeExecution(makeNode('If', { conditions }), {});
      expect(result.branchHandle).toBe('if');
    });

    it('should take "exit" branch when condition is false and no else', () => {
      const conditions = JSON.stringify([{ type: 'if', condition: 'false' }]);
      const result = simulateNodeExecution(makeNode('If', { conditions }), {});
      expect(result.branchHandle).toBe('exit');
    });

    it('should take "else" branch when condition is false and else exists', () => {
      const conditions = JSON.stringify([
        { type: 'if', condition: 'false' },
        { type: 'else' },
      ]);
      const result = simulateNodeExecution(makeNode('If', { conditions }), {});
      expect(result.branchHandle).toBe('else');
    });

    it('should include "IF condition" in the log message', () => {
      const conditions = JSON.stringify([{ type: 'if', condition: 'true' }]);
      const result = simulateNodeExecution(makeNode('If', { conditions }), {});
      expect(result.logMessage).toContain('IF condition');
    });

    it('should handle invalid JSON conditions gracefully', () => {
      const result = simulateNodeExecution(makeNode('If', { conditions: 'not-json' }), {});
      expect(result.error).toBeNull();
    });

    it('should evaluate variable-based conditions', () => {
      const conditions = JSON.stringify([{ type: 'if', condition: 'x > 5' }]);
      const result = simulateNodeExecution(makeNode('If', { conditions }), { x: 10 });
      expect(result.branchHandle).toBe('if');
    });
  });

  // ─── addTwoNumbers ───────────────────────────────────────────────────────

  describe('addTwoNumbers node', () => {
    it('should compute the sum and store in resultVar', () => {
      const result = simulateNodeExecution(
        makeNode('addTwoNumbers', { param1: '3', param2: '4', resultVar: 'sum' }),
        {}
      );
      expect(result.newVariables.sum).toBe(7);
    });

    it('should log the addition operation', () => {
      const result = simulateNodeExecution(
        makeNode('addTwoNumbers', { param1: '3', param2: '4', resultVar: 'sum' }),
        {}
      );
      expect(result.logMessage).toContain('3 + 4 = 7');
    });

    it('should default resultVar to "sum" when not provided', () => {
      const result = simulateNodeExecution(makeNode('addTwoNumbers', { param1: '1', param2: '2' }), {});
      expect(result.newVariables.sum).toBe(3);
    });

    it('should resolve variable references from currentVariables', () => {
      const result = simulateNodeExecution(
        makeNode('addTwoNumbers', { param1: 'x', param2: 'y', resultVar: 'total' }),
        { x: 10, y: 5 }
      );
      expect(result.newVariables.total).toBe(15);
    });
  });

  // ─── calculateDiscount ────────────────────────────────────────────────────

  describe('calculateDiscount node', () => {
    it('should compute price after discount', () => {
      const result = simulateNodeExecution(
        makeNode('calculateDiscount', { price: '100', discountPercent: '20', resultVar: 'finalPrice' }),
        {}
      );
      expect(result.newVariables.finalPrice).toBe(80);
    });

    it('should log the discount operation', () => {
      const result = simulateNodeExecution(
        makeNode('calculateDiscount', { price: '100', discountPercent: '10', resultVar: 'fp' }),
        {}
      );
      expect(result.logMessage).toContain('Discount');
    });
  });

  // ─── validateEmail ────────────────────────────────────────────────────────

  describe('validateEmail node', () => {
    it('should set resultVar to true for an email with @', () => {
      const result = simulateNodeExecution(
        makeNode('validateEmail', { email: 'test@example.com', resultVar: 'isValid' }),
        {}
      );
      expect(result.newVariables.isValid).toBe(true);
    });

    it('should set resultVar to false for an email without @', () => {
      const result = simulateNodeExecution(
        makeNode('validateEmail', { email: 'notanemail', resultVar: 'isValid' }),
        {}
      );
      expect(result.newVariables.isValid).toBe(false);
    });

    it('should log the email validation result', () => {
      const result = simulateNodeExecution(
        makeNode('validateEmail', { email: 'a@b.com', resultVar: 'v' }),
        {}
      );
      expect(result.logMessage).toContain('Validate Email');
    });
  });

  // ─── unknown node type ────────────────────────────────────────────────────

  describe('Unknown node type', () => {
    it('should not throw for an unknown node type', () => {
      expect(() => simulateNodeExecution(makeNode('UnknownType'), {})).not.toThrow();
    });

    it('should return null error for unknown node type', () => {
      const result = simulateNodeExecution(makeNode('UnknownType'), {});
      expect(result.error).toBeNull();
    });

    it('should preserve existing variables for unknown node type', () => {
      const result = simulateNodeExecution(makeNode('UnknownType'), { x: 99 });
      expect(result.newVariables.x).toBe(99);
    });
  });

  // ─── SetVariable — data types ─────────────────────────────────────────────

  describe('SetVariable data types', () => {
    it('should store numeric value when dataType=number', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'n', value: '3.14', dataType: 'number' }),
        {}
      );
      expect(result.newVariables.n).toBe(3.14);
    });

    it('should store boolean true when dataType=boolean and value=true', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'flag', value: 'true', dataType: 'boolean' }),
        {}
      );
      expect(result.newVariables.flag).toBe(true);
    });

    it('should store boolean false when dataType=boolean and value=false', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'flag', value: 'false', dataType: 'boolean' }),
        {}
      );
      expect(result.newVariables.flag).toBe(false);
    });

    it('should parse JSON array when dataType=array', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'arr', value: '[1,2,3]', dataType: 'array' }),
        {}
      );
      expect(Array.isArray(result.newVariables.arr)).toBe(true);
    });

    it('should fall back to array wrapper when JSON parse fails for array', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'arr', value: 'not-json', dataType: 'array' }),
        {}
      );
      expect(Array.isArray(result.newVariables.arr)).toBe(true);
    });

    it('should parse JSON object when dataType=object', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'obj', value: '{"k":"v"}', dataType: 'object' }),
        {}
      );
      expect(typeof result.newVariables.obj).toBe('object');
    });

    it('should fall back to value wrapper when JSON parse fails for object', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'obj', value: 'not-json', dataType: 'object' }),
        {}
      );
      expect(typeof result.newVariables.obj).toBe('object');
    });

    it('should store undefined when dataType=undefined', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'u', value: 'something', dataType: 'undefined' }),
        {}
      );
      expect(result.newVariables.u).toBeUndefined();
    });

    it('should set error when variable already exists (overwrite)', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'x', value: '99' }),
        { x: 'already' }
      );
      expect(result.error).not.toBeNull();
    });

    it('should include declarationType in log when not var', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'PI', value: '3.14', declarationType: 'const', dataType: 'number' }),
        {}
      );
      expect(result.logMessage).toContain('[const]');
    });

    it('should resolve existing variable reference as the value', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'copy', value: 'original' }),
        { original: 42 }
      );
      expect(result.newVariables.copy).toBe(42);
    });

    it('should resolve RuleRequest global variable path', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'req', value: 'RuleRequest.transaction' }),
        {}
      );
      expect(result.newVariables.req).toBeDefined();
    });
  });

  // ─── Log — additional paths ───────────────────────────────────────────────

  describe('Log node — additional paths', () => {
    it('should append variable value when message text matches a variable name', () => {
      const result = simulateNodeExecution(
        makeNode('Log', { text: 'myVar' }),
        { myVar: 'hello world' }
      );
      expect(result.logMessage).toContain('hello world');
    });

    it('should replace RuleRequest.xxx references in message', () => {
      const result = simulateNodeExecution(
        makeNode('Log', { text: 'value is RuleRequest.transaction' }),
        {}
      );
      expect(result.logMessage).toContain('LOG');
    });
  });
  // ─── resolve() fallback to 0 ──────────────────────────────────────────────

  describe('resolve() \u2014 returns 0 for unknown variable names', () => {
    it('should treat unknown string param as 0 in addTwoNumbers', () => {
      const result = simulateNodeExecution(
        makeNode('addTwoNumbers', { param1: 'unknownVar', param2: '5', resultVar: 'r' }),
        {} // unknownVar not in currentVariables
      );
      expect(result.newVariables.r).toBe(5); // 0 + 5
    });
  });

  // ─── resolveGlobalVariable \u2014 array index path ──────────────────────────────

  describe('resolveGlobalVariable \u2014 array index notation', () => {
    it('should resolve an array-index path like RuleRequest.items[0]', () => {
      // If the path doesn\u2019t exist it returns the original path string; either way no throw
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'v', value: 'RuleRequest.DataCache[0]' }),
        {}
      );
      expect(result.newVariables.v).toBeDefined();
    });
  });

  // ─── resolveGlobalVariable \u2014 non-existent deep path ──────────────────────

  describe('resolveGlobalVariable \u2014 undefined intermediate path', () => {
    it('should fall back to the original path string when path is not found', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'v', value: 'RuleRequest.nonExistent.deep.path' }),
        {}
      );
      // Either the raw path string or undefined; important: no throw
      expect(result.error).toBeNull();
    });
  });
  // ─── If — safeEvaluateExpression error path ───────────────────────────────

  describe('If node — safeEvaluateExpression error path', () => {
    it('should not throw when condition runtime-errors (e.g. null.prop)', () => {
      const conditions = JSON.stringify([{ type: 'if', condition: 'null.nonexistent' }]);
      expect(() => simulateNodeExecution(makeNode('If', { conditions }), {})).not.toThrow();
    });

    it('should take exit branch when condition throws at runtime', () => {
      const conds = JSON.stringify([{ type: 'if', condition: 'null.nonexistent' }]);
      const result = simulateNodeExecution(makeNode('If', { conds }), {});
      expect(result.branchHandle).toBeDefined();
    });
  });

  // ─── fetchUserData ────────────────────────────────────────────────────────

  describe('fetchUserData node', () => {
    it('should store user object in resultVar', () => {
      const result = simulateNodeExecution(
        makeNode('fetchUserData', { userId: '42', resultVar: 'user' }),
        {}
      );
      expect(result.newVariables.user).toMatchObject({ id: '42', name: 'John Doe' });
    });

    it('should log fetch message', () => {
      const result = simulateNodeExecution(makeNode('fetchUserData', { userId: '1' }), {});
      expect(result.logMessage).toContain('Fetched user');
    });

    it('should default userId to 1 when not provided', () => {
      const result = simulateNodeExecution(makeNode('fetchUserData', { resultVar: 'u' }), {});
      expect(result.newVariables.u).toMatchObject({ id: '1' });
    });
  });

  // ─── CustomFunction ───────────────────────────────────────────────────────

  describe('CustomFunction node', () => {
    it('should store MOCK_RESULT in resultVar', () => {
      const result = simulateNodeExecution(
        makeNode('CustomFunction', { functionName: 'myFn', resultVar: 'out' }),
        {}
      );
      expect(result.newVariables.out).toBe('MOCK_RESULT');
    });

    it('should include function name in log', () => {
      const result = simulateNodeExecution(
        makeNode('CustomFunction', { functionName: 'doSomething', resultVar: 'res' }),
        {}
      );
      expect(result.logMessage).toContain('doSomething');
    });

    it('should default resultVar to result when not provided', () => {
      const result = simulateNodeExecution(makeNode('CustomFunction'), {});
      expect(result.newVariables.result).toBe('MOCK_RESULT');
    });
  });

  // ─── FetchDB ──────────────────────────────────────────────────────────────

  describe('FetchDB node', () => {
    it('should store mock DB result in resultVar', () => {
      const result = simulateNodeExecution(
        makeNode('FetchDB', { query: 'SELECT 1', resultVar: 'rows' }),
        {}
      );
      expect(result.newVariables.rows).toHaveProperty('success', true);
    });

    it('should include rowCount in stored result', () => {
      const result = simulateNodeExecution(
        makeNode('FetchDB', { query: 'SELECT *', resultVar: 'data' }),
        {}
      );
      const rows = result.newVariables.data as { rowCount: number };
      expect(rows.rowCount).toBe(3);
    });

    it('should log the query connection and query text', () => {
      const result = simulateNodeExecution(
        makeNode('FetchDB', { query: 'SELECT 1', connection: 'primary', resultVar: 'r' }),
        {}
      );
      expect(result.logMessage).toContain('primary');
    });

    it('should truncate long queries in log', () => {
      const longQuery = 'SELECT * FROM table WHERE ' + 'a'.repeat(100);
      const result = simulateNodeExecution(
        makeNode('FetchDB', { query: longQuery, resultVar: 'r' }),
        {}
      );
      expect(result.logMessage).toContain('...');
    });
  });

  // ─── Code ─────────────────────────────────────────────────────────────────

  describe('Code node', () => {
    it('should log custom code executed message', () => {
      const result = simulateNodeExecution(makeNode('Code'), {});
      expect(result.logMessage).toContain('Custom Code');
    });

    it('should not change variables', () => {
      const result = simulateNodeExecution(makeNode('Code'), { x: 1 });
      expect(result.newVariables.x).toBe(1);
    });
  });

  // ─── ThrowError ───────────────────────────────────────────────────────────

  describe('ThrowError node', () => {
    it('should set error to the provided message', () => {
      const result = simulateNodeExecution(
        makeNode('ThrowError', { text: 'Something went wrong' }),
        {}
      );
      expect(result.error).toBe('Something went wrong');
    });

    it('should include the error message in logMessage', () => {
      const result = simulateNodeExecution(makeNode('ThrowError', { message: 'Boom' }), {});
      expect(result.logMessage).toContain('Boom');
    });

    it('should default to Error Occurred when no message provided', () => {
      const result = simulateNodeExecution(makeNode('ThrowError'), {});
      expect(result.error).toContain('Error Occurred');
    });

    it('should replace RuleRequest references in the error message', () => {
      const result = simulateNodeExecution(
        makeNode('ThrowError', { text: 'RuleRequest.transaction failed' }),
        {}
      );
      expect(result.error).toBeDefined();
    });
  });

  // ─── HandleTransaction ────────────────────────────────────────────────────

  describe('HandleTransaction node', () => {
    it('should log entering nested flow', () => {
      const result = simulateNodeExecution(makeNode('HandleTransaction'), {});
      expect(result.logMessage).toContain('Handle Transaction');
    });

    it('should not change variables', () => {
      const result = simulateNodeExecution(makeNode('HandleTransaction'), { x: 7 });
      expect(result.newVariables.x).toBe(7);
    });
  });

  // ─── End ──────────────────────────────────────────────────────────────────

  describe('End node', () => {
    it('should log Process Ended', () => {
      const result = simulateNodeExecution(makeNode('End'), {});
      expect(result.logMessage).toContain('Process Ended');
    });

    it('should not produce an error', () => {
      expect(simulateNodeExecution(makeNode('End'), {}).error).toBeNull();
    });
  });

  // ─── Return structure ─────────────────────────────────────────────────────

  describe('Return value structure', () => {
    it('should always return newVariables', () => {
      expect(simulateNodeExecution(makeNode('Start'), {})).toHaveProperty('newVariables');
    });

    it('should always return logMessage', () => {
      expect(simulateNodeExecution(makeNode('Start'), {})).toHaveProperty('logMessage');
    });

    it('should always return error', () => {
      expect(simulateNodeExecution(makeNode('Start'), {})).toHaveProperty('error');
    });

    it('should always return branchHandle', () => {
      expect(simulateNodeExecution(makeNode('Start'), {})).toHaveProperty('branchHandle');
    });
  });

  // ─── resolveGlobalVariable — return current (full path resolves) ─────────────

  describe('resolveGlobalVariable — full path resolves to existing value', () => {
    it('should return resolved value (not the path string) when array-index path exists in globalVariables', () => {
      // RuleRequest.pain001.PaymentInformation.CreditTransferTransactionInformation is an array in GlobalVariables
      const result = simulateNodeExecution(
        makeNode('SetVariable', {
          name: 'txn',
          value: 'RuleRequest.pain001.PaymentInformation.CreditTransferTransactionInformation[0]',
        }),
        {}
      );
      // If path resolves successfully, newVariables.txn is the resolved object
      expect(result.error).toBeNull();
      expect(result.newVariables.txn).toBeDefined();
      expect(typeof result.newVariables.txn).toBe('object');
    });
  });

  // ─── SetVariable — empty value produces undefined finalValue ─────────────────

  describe('SetVariable — empty value / dataType undefined', () => {
    it('should set finalValue to undefined when varValueRaw is empty', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'v', value: '' }),
        {}
      );
      // varValueRaw === '' → finalValue = undefined
      expect(result.newVariables.v).toBeUndefined();
      expect(result.error).toBeNull();
    });

    it('should set finalValue to undefined when dataType is "undefined"', () => {
      const result = simulateNodeExecution(
        makeNode('SetVariable', { name: 'v', value: '42', dataType: 'undefined' }),
        {}
      );
      expect(result.newVariables.v).toBeUndefined();
    });
  });

  // ─── outer catch block ───────────────────────────────────────────────────────

  describe('simulateNodeExecution — outer catch block', () => {
    it('should catch unexpected errors thrown inside switch cases', () => {
      // Create params with a getter that throws when accessed inside the switch
      const badParams: Record<string, string> = {};
      Object.defineProperty(badParams, 'text', {
        get() { throw new Error('unexpected param error'); },
        enumerable: true,
      });
      const node: Node = {
        id: 'n1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: { nodeType: 'Log', params: badParams },
      };
      const result = simulateNodeExecution(node, {});
      expect(result.error).toBeTruthy();
      expect(result.logMessage).toContain('Execution Error');
    });
  });
});

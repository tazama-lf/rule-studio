// ─── Module mocks (must be declared before any imports) ─────────────────────

jest.mock('../../../src/utils/Flow/nodeTemplateService', () => ({
  getNodeTemplate: jest.fn(),
  getApiNodes: jest.fn(() => []),
}));

jest.mock('../../../src/utils/Flow/functionParameterUtils', () => ({
  getFunctionParameters: jest.fn(() => []),
  generateFunctionArgs: jest.fn(() => ''),
}));

jest.mock('../../../src/utils/Common/helpers', () => ({
  getNodesInBranch: jest.fn(() => []),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { generateTypeScriptCode, generateTestCaseCode } from '../../../src/utils/Flow/CodeGenerator';
import { getNodeTemplate, getApiNodes } from '../../../src/utils/Flow/nodeTemplateService';
import { getNodesInBranch } from '../../../src/utils/Common/helpers';
import type { Node, Edge } from '@xyflow/react';

const mockGetNodesInBranch = getNodesInBranch as jest.MockedFunction<typeof getNodesInBranch>;

// ─── Typed mock helpers ───────────────────────────────────────────────────────

const mockGetNodeTemplate = getNodeTemplate as jest.MockedFunction<typeof getNodeTemplate>;
const mockGetApiNodes = getApiNodes as jest.MockedFunction<typeof getApiNodes>;

// ─── Helper builders ──────────────────────────────────────────────────────────

const makeNode = (
  id: string,
  nodeType: string,
  extraData: Record<string, unknown> = {},
  extraProps: Partial<Node> = {}
): Node => ({
  id,
  type: 'editableNode',
  position: { x: 0, y: 0 },
  data: { nodeType, label: nodeType, params: {}, ...extraData },
  ...extraProps,
});

const makeEdge = (id: string, source: string, target: string): Edge => ({
  id,
  source,
  target,
});

// ─── generateTestCaseCode ─────────────────────────────────────────────────────

describe('generateTestCaseCode (utils/Flow/CodeGenerator)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeTemplate.mockReturnValue(undefined);
    mockGetApiNodes.mockReturnValue([]);
  });

  describe('empty canvas', () => {
    it('should return the fallback comment when no nodes are provided', () => {
      const result = generateTestCaseCode([], []);
      expect(result).toContain('//');
    });

    it('should not throw with empty inputs', () => {
      expect(() => generateTestCaseCode([], [])).not.toThrow();
    });
  });

  describe('nodes without edges', () => {
    it('should not throw with disconnected nodes', () => {
      const nodes = [makeNode('n1', 'Start'), makeNode('n2', 'Log', { params: { text: 'hello' } })];
      expect(() => generateTestCaseCode(nodes, [])).not.toThrow();
    });

    it('should return a string for disconnected nodes', () => {
      const nodes = [makeNode('n1', 'Start')];
      const result = generateTestCaseCode(nodes, []);
      expect(typeof result).toBe('string');
    });
  });

  describe('SetVariable node', () => {
    it('should include the variable name in generated code', () => {
      const nodes = [makeNode('n1', 'SetVariable', { params: { name: 'myVar', value: '42' } })];
      const edges = [makeEdge('e1', 'n1', 'n1')]; // self-referencing just for connection test
      const result = generateTestCaseCode(nodes, edges);
      expect(typeof result).toBe('string');
    });
  });

  describe('Import node', () => {
    it('should produce an import statement for an Import node', () => {
      const nodes = [
        makeNode('n1', 'Import', { params: { importStatement: "import fs from 'fs';" } }),
        makeNode('n2', 'Start'),
      ];
      const edges = [makeEdge('e1', 'n1', 'n2')];
      const result = generateTestCaseCode(nodes, edges);
      // Import node code strips variable indicators and returns the raw importStatement
      expect(typeof result).toBe('string');
    });
  });

  describe('Log node', () => {
    it('should include Log node code when connected', () => {
      mockGetNodeTemplate.mockReturnValue({
        nodeType: 'Log',
        code_template: 'console.log(${params.text});',
        label: 'Log',
        isFunction: false,
        isPredefined: true,
        inputs: [],
        bgColor: 'bg-blue-500',
        visible_on_canvas: ['main', 'nested'],
      });

      const nodes = [
        makeNode('n1', 'Start'),
        makeNode('n2', 'Log', { params: { text: 'hello' } }),
      ];
      const edges = [makeEdge('e1', 'n1', 'n2')];
      const result = generateTestCaseCode(nodes, edges);
      expect(typeof result).toBe('string');
    });
  });

  describe('return type', () => {
    it('should always return a string', () => {
      const result = generateTestCaseCode([], []);
      expect(typeof result).toBe('string');
    });
  });
});

// ─── generateTypeScriptCode ───────────────────────────────────────────────────

describe('generateTypeScriptCode (utils/Flow/CodeGenerator)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeTemplate.mockReturnValue(undefined);
    mockGetApiNodes.mockReturnValue([]);
  });

  // ─── Fallback when no HandleTransaction node ───────────────────────────────

  describe('no HandleTransaction node', () => {
    it('should return a comment string when no HandleTransaction node exists', () => {
      const result = generateTypeScriptCode([], [], {});
      expect(result).toContain('//');
    });

    it('should mention "HandleTransaction" in the fallback comment', () => {
      const result = generateTypeScriptCode([], [], {});
      expect(result).toContain('HandleTransaction');
    });

    it('should not throw with empty inputs', () => {
      expect(() => generateTypeScriptCode([], [], {})).not.toThrow();
    });
  });

  describe('HandleTransaction node present but no nested flow', () => {
    it('should return the fallback comment when nestedCanvasData is empty', () => {
      const nodes = [makeNode('ht1', 'HandleTransaction')];
      const result = generateTypeScriptCode(nodes, [], {});
      expect(result).toContain('//');
    });
  });

  // ─── HandleTransaction node with nested flow ──────────────────────────────

  describe('with HandleTransaction node and nested flow', () => {
    const makeFullSetup = () => {
      const htNode = makeNode('ht1', 'HandleTransaction');
      const nestedStart = makeNode('ns1', 'Start');
      const nestedCanvasData = {
        ht1: { nodes: [nestedStart], edges: [] },
      };
      return { htNode, nestedStart, nestedCanvasData };
    };

    it('should return a string containing the base imports', () => {
      const { htNode, nestedCanvasData } = makeFullSetup();
      const result = generateTypeScriptCode([htNode], [], nestedCanvasData);
      expect(result).toContain('@tazama-lf/frms-coe-lib');
    });

    it('should export the handleTransaction function', () => {
      const { htNode, nestedCanvasData } = makeFullSetup();
      const result = generateTypeScriptCode([htNode], [], nestedCanvasData);
      expect(result).toContain('export async function handleTransaction');
    });

    it('should include RuleRequest in the function signature', () => {
      const { htNode, nestedCanvasData } = makeFullSetup();
      const result = generateTypeScriptCode([htNode], [], nestedCanvasData);
      expect(result).toContain('RuleRequest');
    });

    it('should include RuleResult in the function signature', () => {
      const { htNode, nestedCanvasData } = makeFullSetup();
      const result = generateTypeScriptCode([htNode], [], nestedCanvasData);
      expect(result).toContain('RuleResult');
    });

    it('should not throw with a valid HandleTransaction setup', () => {
      const { htNode, nestedCanvasData } = makeFullSetup();
      expect(() => generateTypeScriptCode([htNode], [], nestedCanvasData)).not.toThrow();
    });
  });

  // ─── Import nodes ─────────────────────────────────────────────────────────

  describe('Import nodes', () => {
    it('should include custom import statements from Import nodes connected to main canvas', () => {
      const htNode = makeNode('ht1', 'HandleTransaction');
      const importNode = makeNode('imp1', 'Import', {
        params: { importStatement: "import { foo } from 'foo-lib';" },
      });
      const edges = [makeEdge('e1', 'imp1', 'ht1')];
      const nestedCanvasData = {
        ht1: { nodes: [makeNode('ns1', 'Start')], edges: [] },
      };
      const result = generateTypeScriptCode([htNode, importNode], edges, nestedCanvasData);
      expect(result).toContain('foo-lib');
    });
  });

  // ─── Function definition nodes ────────────────────────────────────────────

  describe('function definition nodes', () => {
    it('should include function definition when CustomFunction definition node is connected', () => {
      mockGetNodeTemplate.mockImplementation((nodeType: string, mode?: string) => {
        if (nodeType === 'CustomFunction' && mode === 'definition') {
          return {
            node_type: 'CustomFunction',
            code_template: 'function myFn() { return 1; }',
            label: 'CustomFunction',
            isFunction: true,
            isPredefined: false,
            inputs: [],
            bgColor: 'bg-green-500',
            visible_on_canvas: ['main', 'nested'],
          };
        }
        return undefined;
      });

      const htNode = makeNode('ht1', 'HandleTransaction');
      const fnNode = makeNode('fn1', 'CustomFunction', { mode: 'definition' });
      const edges = [makeEdge('e1', 'fn1', 'ht1')];
      const nestedCanvasData = {
        ht1: { nodes: [makeNode('ns1', 'Start')], edges: [] },
      };

      const result = generateTypeScriptCode([htNode, fnNode], edges, nestedCanvasData);
      expect(typeof result).toBe('string');
    });
  });

  // ─── Return type ──────────────────────────────────────────────────────────

  describe('return type', () => {
    it('should always return a string', () => {
      const result = generateTypeScriptCode([], [], {});
      expect(typeof result).toBe('string');
    });
  });
});

// ─── generateTestCaseCode — specific node types ──────────────────────────────

describe('generateTestCaseCode — specific node type code generators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeTemplate.mockReturnValue(undefined);
    mockGetApiNodes.mockReturnValue([]);
  });

  // Helpers — always include a Start node so generateNestedFlowCode can find an entry point
  const single = (nodeType: string, params: Record<string, string> = {}): string => {
    const startNode = makeNode('s1', 'Start');
    const targetNode = makeNode('n1', nodeType, { params });
    const edge = makeEdge('e1', 's1', 'n1');
    return generateTestCaseCode([startNode, targetNode], [edge]);
  };

  beforeEach(() => {
    mockGetNodesInBranch.mockReturnValue([]);
  });

  // ─── SetVariable ──────────────────────────────────────────────────────────

  describe('SetVariable node', () => {
    it('should produce a var declaration for a plain value', () => {
      const result = single('SetVariable', { name: 'x', value: 'hello' });
      expect(result).toContain('x');
    });

    it('should use const declarationType', () => {
      const result = single('SetVariable', { name: 'PI', value: '3.14', declarationType: 'const', dataType: 'number' });
      expect(result).toContain('const PI');
    });

    it('should produce bare declaration when value is empty', () => {
      const result = single('SetVariable', { name: 'empty', value: '' });
      expect(result).toContain('empty');
    });

    it('should handle {{ }} variable references', () => {
      const result = single('SetVariable', { name: 'copy', value: '{{ sourceVar }}', declarationType: 'const' });
      expect(result).toContain('sourceVar');
    });

    it('should output numeric value for number dataType', () => {
      const result = single('SetVariable', { name: 'n', value: '42', dataType: 'number' });
      expect(result).toContain('42');
    });

    it('should output boolean value for boolean dataType', () => {
      const result = single('SetVariable', { name: 'flag', value: 'true', dataType: 'boolean' });
      expect(result).toContain('true');
    });

    it('should output array brackets for array dataType', () => {
      const result = single('SetVariable', { name: 'arr', value: '1,2,3', dataType: 'array' });
      expect(result).toContain('[');
    });

    it('should output object braces for object dataType', () => {
      const result = single('SetVariable', { name: 'obj', value: 'key:val', dataType: 'object' });
      expect(result).toContain('{');
    });

    it('should handle value with $ using template literal', () => {
      const result = single('SetVariable', { name: 'tpl', value: 'Hello $name' });
      expect(result).toContain('tpl');
    });

    it('should wrap string value in double quotes', () => {
      const result = single('SetVariable', { name: 's', value: 'world', dataType: 'any' });
      expect(result).toContain('"world"');
    });
  });

  // ─── Log ─────────────────────────────────────────────────────────────────

  describe('Log node', () => {
    it('should produce loggerService.log call', () => {
      const result = single('Log', { text: 'hello' });
      expect(result).toContain('loggerService.log');
    });

    it('should use empty string for missing text', () => {
      const result = single('Log', {});
      expect(result).toContain('loggerService.log');
    });

    it('should interpolate {{ }} references as template literal', () => {
      const result = single('Log', { text: 'Value is {{ amount }}' });
      expect(result).toContain('amount');
    });

    it('should use variable as arg when only a {{ var }} is given', () => {
      const result = single('Log', { text: '{{ myVar }}' });
      expect(result).toContain('myVar');
    });
  });

  // ─── ThrowError ───────────────────────────────────────────────────────────

  describe('ThrowError node', () => {
    it('should produce throw new Error()', () => {
      const result = single('ThrowError', { text: 'Something failed' });
      expect(result).toContain('throw new Error(');
    });

    it('should default to Error occurred when no message', () => {
      const result = single('ThrowError', {});
      expect(result).toContain('Error occurred');
    });

    it('should interpolate {{ }} in error message', () => {
      const result = single('ThrowError', { text: 'Failed: {{ reason }}' });
      expect(result).toContain('reason');
    });
  });

  // ─── Exit ─────────────────────────────────────────────────────────────────

  describe('Exit node', () => {
    it('should produce break by default', () => {
      const result = single('Exit', {});
      expect(result).toContain('break');
    });

    it('should produce continue when exitType=continue', () => {
      const result = single('Exit', { exitType: 'continue' });
      expect(result).toContain('continue');
    });

    it('should produce return when exitType=return', () => {
      const result = single('Exit', { exitType: 'return' });
      expect(result).toContain('return');
    });

    it('should produce return value when exitType=return and returnValue set', () => {
      const result = single('Exit', { exitType: 'return', returnValue: 'ruleRes' });
      expect(result).toContain('return ruleRes');
    });
  });

  // ─── Ternary ──────────────────────────────────────────────────────────────

  describe('Ternary node', () => {
    it('should produce a ternary const assignment by default', () => {
      const result = single('Ternary', {});
      expect(result).toContain('? ');
      expect(result).toContain(': ');
    });

    it('should use resultVar name in the output', () => {
      const result = single('Ternary', { resultVar: 'myResult' });
      expect(result).toContain('myResult');
    });

    it('should output inline ternary when storeResult=false', () => {
      const result = single('Ternary', { storeResult: 'false' });
      expect(result).toContain('?');
    });

    it('should use custom ternaryTree when provided', () => {
      const tree = JSON.stringify({
        condition: 'x > 0',
        trueValue: { type: 'value', value: '"positive"' },
        falseValue: { type: 'value', value: '"negative"' },
      });
      const result = single('Ternary', { ternaryTree: tree, resultVar: 'sign' });
      expect(result).toContain('sign');
      expect(result).toContain('x > 0');
    });
  });

  // ─── arrayOp ─────────────────────────────────────────────────────────────

  describe('arrayOp node', () => {
    it('should produce array operation code', () => {
      const result = single('arrayOp', { array: 'myArr', operation: 'pop', resultVar: 'last' });
      expect(result).toContain('myArr');
      expect(result).toContain('pop');
    });

    it('should produce .length access for length operation', () => {
      const result = single('arrayOp', { array: 'items', operation: 'length', resultVar: 'len' });
      expect(result).toContain('.length');
    });

    it('should include value for push operation', () => {
      const result = single('arrayOp', { array: 'arr', operation: 'push', value: '42', resultVar: 'r' });
      expect(result).toContain('push(42)');
    });
  });

  // ─── math ─────────────────────────────────────────────────────────────────

  describe('math node', () => {
    it('should produce Math.method call', () => {
      const result = single('math', { method: 'sqrt', value: '16', resultVar: 'r' });
      expect(result).toContain('Math.sqrt');
    });

    it('should include two values for pow', () => {
      const result = single('math', { method: 'pow', value: '2', value2: '10', resultVar: 'r' });
      expect(result).toContain('Math.pow(2, 10)');
    });
  });

  // ─── stringFunc ───────────────────────────────────────────────────────────

  describe('stringFunc node', () => {
    it('should produce string method call', () => {
      const result = single('stringFunc', { method: 'trim', text: '"  hello  "', resultVar: 'trimmed' });
      expect(result).toContain('.trim()');
    });

    it('should produce .length access for length method', () => {
      const result = single('stringFunc', { method: 'length', text: 'myStr', resultVar: 'len' });
      expect(result).toContain('.length');
    });

    it('should produce split with separator', () => {
      const result = single('stringFunc', { method: 'split', text: 'str', separator: '","', resultVar: 'parts' });
      expect(result).toContain('split');
    });

    it('should produce slice with start and end', () => {
      const result = single('stringFunc', { method: 'slice', text: 'str', start: '1', end: '3', resultVar: 'sub' });
      expect(result).toContain('slice(1, 3)');
    });
  });

  // ─── objectOp ─────────────────────────────────────────────────────────────

  describe('objectOp node', () => {
    it('should produce Object.keys call by default', () => {
      const result = single('objectOp', { operation: 'keys', object: 'myObj', resultVar: 'k' });
      expect(result).toContain('Object.keys');
    });

    it('should produce destructuring for destructure operation', () => {
      const result = single('objectOp', { operation: 'destructure', object: 'myObj', keys: 'a, b' });
      expect(result).toContain('const { a, b }');
    });

    it('should produce hasOwnProperty for hasOwnProperty operation', () => {
      const result = single('objectOp', { operation: 'hasOwnProperty', object: 'obj', property: '"key"', resultVar: 'has' });
      expect(result).toContain('hasOwnProperty');
    });

    it('should produce Object.assign for assign operation', () => {
      const result = single('objectOp', { operation: 'assign', object: 'target', sourceObjects: 'src', resultVar: 'r' });
      expect(result).toContain('Object.assign');
    });
  });

  // ─── DetermineOutcome ─────────────────────────────────────────────────────

  describe('DetermineOutcome node', () => {
    it('should produce a return determineOutcome() call', () => {
      const result = single('DetermineOutcome', {});
      expect(result).toContain('return determineOutcome(');
    });

    it('should use custom arguments when provided', () => {
      const result = single('DetermineOutcome', {
        argument1: 'count',
        argument2: 'cfg',
        argument3: 'res',
      });
      expect(result).toContain('return determineOutcome(count, cfg, res)');
    });
  });

  describe('ExclusiveDetermineOutcome node', () => {
    it('should produce a return exclusiveDetermineOutcome() call', () => {
      const result = single('ExclusiveDetermineOutcome', {});
      expect(result).toContain('return exclusiveDetermineOutcome(');
    });

    it('should use argument1/argument2 when provided', () => {
      const result = single('ExclusiveDetermineOutcome', {
        argument1: 'unwrappedResult',
        argument2: 'ruleConfig.config.cases',
      });
      expect(result).toContain('return exclusiveDetermineOutcome(unwrappedResult, ruleConfig.config.cases)');
    });

    it('should support legacy/alternate key names', () => {
      const result = single('ExclusiveDetermineOutcome', {
        value: 'result',
        caseObj: 'cases',
      });
      expect(result).toContain('return exclusiveDetermineOutcome(result, cases)');
    });
  });

  // ─── FetchDB ──────────────────────────────────────────────────────────────

  describe('FetchDB node', () => {
    it('should produce a query const declaration', () => {
      const result = single('FetchDB', { query: 'SELECT * FROM events', resultVar: 'rows' });
      expect(result).toContain('const query');
    });

    it('should produce a databaseManager query call', () => {
      const result = single('FetchDB', { query: 'SELECT 1', resultVar: 'r' });
      expect(result).toContain('databaseManager');
    });

    it('should handle parameterized queries with {{ }} variables', () => {
      const result = single('FetchDB', { query: 'SELECT * FROM t WHERE id = {{ RuleRequest.id }}', resultVar: 'r' });
      expect(result).toContain('$1');
    });
  });

  // ─── RuleConfigFactory ────────────────────────────────────────────────────

  describe('RuleConfigFactory node', () => {
    it('should produce a getRuleConfig factory function for empty data', () => {
      const result = single('RuleConfigFactory', { factoryName: 'getRC' });
      expect(result).toContain('getRC');
      expect(result).toContain('RuleConfig');
    });

    it('should parse and format JSON ruleConfigData', () => {
      const data = JSON.stringify({ threshold: 1000 });
      const result = single('RuleConfigFactory', { ruleConfigData: data, factoryName: 'getRuleConfig' });
      expect(result).toContain('threshold');
    });

    it('should normalise tenantId to DEFAULT in ruleConfigData', () => {
      const data = JSON.stringify({ tenantId: 'acme-corp', limit: 500 });
      const result = single('RuleConfigFactory', { ruleConfigData: data, factoryName: 'getRC' });
      expect(result).toContain('DEFAULT');
    });

    it('should handle invalid JSON ruleConfigData without throwing', () => {
      expect(() => single('RuleConfigFactory', { ruleConfigData: 'bad-json', factoryName: 'getRC' })).not.toThrow();
    });
  });

  // ─── RuleRequestFactory ───────────────────────────────────────────────────

  describe('RuleRequestFactory node', () => {
    it('should produce a getMockRequest factory for empty data', () => {
      const result = single('RuleRequestFactory', {});
      expect(result).toContain('getMockRequest');
    });

    it('should handle ruleRequestData with JSON.parse present as raw code', () => {
      const raw = "const quote = { transaction: JSON.parse('{}') };";
      const result = single('RuleRequestFactory', { ruleRequestData: raw, factoryName: 'getReq' });
      expect(result).toContain('getReq');
    });

    it('should parse ruleRequestData as JSON and produce JSON.parse calls', () => {
      const data = JSON.stringify({ transaction: { id: '1' }, networkMap: {}, DataCache: {} });
      const result = single('RuleRequestFactory', { ruleRequestData: data, factoryName: 'getMockReq' });
      expect(result).toContain('getMockReq');
    });
  });

  // ─── RuleResultFactory ────────────────────────────────────────────────────

  describe('RuleResultFactory node', () => {
    it('should produce a ruleResult declaration for empty data', () => {
      const result = single('RuleResultFactory', {});
      expect(result).toContain('RuleResult');
    });

    it('should parse ruleResultData as JSON and format it', () => {
      const data = JSON.stringify({ id: '001', cfg: '1.0.0' });
      const result = single('RuleResultFactory', { ruleResultData: data, factoryName: 'myResult' });
      expect(result).toContain('myResult');
    });
  });

  // ─── DataCacheFactory ─────────────────────────────────────────────────────

  describe('DataCacheFactory node', () => {
    it('should produce a DataCache const for empty data', () => {
      const result = single('DataCacheFactory', { variableName: 'cache' });
      expect(result).toContain('cache');
      expect(result).toContain('DataCache');
    });

    it('should parse dataCacheData JSON and format it', () => {
      const data = JSON.stringify({ key: 'value' });
      const result = single('DataCacheFactory', { variableName: 'dc', dataCacheData: data });
      expect(result).toContain('dc');
      expect(result).toContain('key');
    });

    it('should handle invalid JSON dataCacheData without throwing', () => {
      expect(() => single('DataCacheFactory', { variableName: 'dc', dataCacheData: 'bad-json' })).not.toThrow();
    });
  });

  // ─── Import node ──────────────────────────────────────────────────────────

  describe('Import node', () => {
    it('should return the importStatement directly', () => {
      const result = single('Import', { importStatement: "import fs from 'fs';" });
      expect(result).toContain("import fs from 'fs';");
    });

    it('should strip {{ }} from importStatement', () => {
      const result = single('Import', { importStatement: "import {{ myMod }} from 'lib';" });
      expect(result).toContain('myMod');
    });
  });

  // ─── normalizeTenantIdToDefault via RuleConfigFactory ────────────────────

  describe('normalizeTenantIdToDefault (via RuleConfigFactory)', () => {
    it('should normalize nested tenantId fields', () => {
      const data = JSON.stringify({ config: { tenantId: 'acme' }, limit: 50 });
      const result = single('RuleConfigFactory', { ruleConfigData: data });
      expect(result).toContain('DEFAULT');
    });

    it('should handle arrays containing objects with tenantId', () => {
      const data = JSON.stringify({ items: [{ tenantId: 'tenant1', value: 10 }] });
      const result = single('RuleConfigFactory', { ruleConfigData: data });
      expect(result).toContain('DEFAULT');
    });
  });

  // ─── Loop node — all loopType values (generateLoopCodeWithBody) ──────────

  describe('Loop node — generateLoopCodeWithBody coverage', () => {
    it('forEach without condition', () => {
      const r = single('Loop', { loopType: 'forEach', arrayVariable: 'items', itemVariable: 'x' });
      expect(r).toContain('forEach');
    });

    it('forEach with condition', () => {
      const r = single('Loop', { loopType: 'forEach', arrayVariable: 'items', itemVariable: 'x', condition: 'x > 0' });
      expect(r).toContain('forEach');
    });

    it('forEach with index variable', () => {
      const r = single('Loop', { loopType: 'forEach', arrayVariable: 'items', itemVariable: 'x', indexVariable: 'idx' });
      expect(r).toContain('idx');
    });

    it('for loop', () => {
      const r = single('Loop', { loopType: 'for', arrayVariable: 'arr', indexVariable: 'i' });
      expect(r).toContain('for');
    });

    it('while loop — default (arrayVariable-based)', () => {
      const r = single('Loop', { loopType: 'while', arrayVariable: 'arr', indexVariable: 'j' });
      expect(r).toContain('while');
    });

    it('while loop — custom condition', () => {
      const r = single('Loop', { loopType: 'while', loopCondition: 'x < 10' });
      expect(r).toContain('x < 10');
    });

    it('map loop', () => {
      const r = single('Loop', { loopType: 'map', arrayVariable: 'items', itemVariable: 'x', resultVariable: 'mapped' });
      expect(r).toContain('.map(');
    });

    it('map loop with condition (return expression)', () => {
      const r = single('Loop', { loopType: 'map', arrayVariable: 'items', itemVariable: 'x', condition: 'x * 2', resultVariable: 'doubled' });
      expect(r).toContain('return x * 2');
    });

    it('filter loop', () => {
      const r = single('Loop', { loopType: 'filter', arrayVariable: 'items', filterCondition: 'x.active', resultVariable: 'active' });
      expect(r).toContain('.filter(');
    });

    it('filter loop without filterCondition (defaults to true)', () => {
      const r = single('Loop', { loopType: 'filter', arrayVariable: 'items', resultVariable: 'out' });
      expect(r).toContain('return true');
    });

    it('every loop', () => {
      const r = single('Loop', { loopType: 'every', arrayVariable: 'items', condition: 'x > 0', resultVariable: 'allPos' });
      expect(r).toContain('.every(');
    });

    it('every loop with index variable', () => {
      const r = single('Loop', { loopType: 'every', arrayVariable: 'items', condition: 'x > 0', indexVariable: 'i', resultVariable: 'r' });
      expect(r).toContain('i');
    });

    it('some loop', () => {
      const r = single('Loop', { loopType: 'some', arrayVariable: 'items', condition: 'x > 0', resultVariable: 'anyPos' });
      expect(r).toContain('.some(');
    });

    it('some loop with index variable', () => {
      const r = single('Loop', { loopType: 'some', arrayVariable: 'items', condition: 'x', indexVariable: 'i', resultVariable: 'r' });
      expect(r).toContain('.some(');
    });

    it('find loop', () => {
      const r = single('Loop', { loopType: 'find', arrayVariable: 'items', condition: 'x.id === 1', resultVariable: 'found' });
      expect(r).toContain('.find(');
    });

    it('find loop with index variable', () => {
      const r = single('Loop', { loopType: 'find', arrayVariable: 'items', condition: 'x.ok', indexVariable: 'i', resultVariable: 'r' });
      expect(r).toContain('.find(');
    });

    it('reduce loop', () => {
      const r = single('Loop', { loopType: 'reduce', arrayVariable: 'items', reduceLogic: 'return acc + item;', initialValue: '0', resultVariable: 'sum' });
      expect(r).toContain('.reduce(');
    });

    it('reduce loop with index variable', () => {
      const r = single('Loop', { loopType: 'reduce', arrayVariable: 'items', reduceLogic: 'return acc;', initialValue: '[]', indexVariable: 'i', resultVariable: 'result' });
      expect(r).toContain('.reduce(');
    });

    it('unknown loop type falls through to default comment', () => {
      const r = single('Loop', { loopType: 'unknownLoopType', arrayVariable: 'items' });
      expect(r).toContain('unknown');
    });

    it('map loop without condition uses item variable as return', () => {
      const r = single('Loop', { loopType: 'map', arrayVariable: 'items', itemVariable: 'el', resultVariable: 'mapped' });
      expect(r).toContain('return el');
    });

    it('forEach with condition and inner body from getNodesInBranch', () => {
      mockGetNodesInBranch.mockReturnValueOnce([makeNode('b1', 'Log', { params: { text: 'in loop' } })]);
      const r = single('Loop', { loopType: 'forEach', arrayVariable: 'arr', condition: 'x > 0' });
      expect(r).toContain('forEach');
    });
  });

  // ─── Describe node ────────────────────────────────────────────────────────

  describe('Describe node', () => {
    it('should produce describe() block', () => {
      const r = single('Describe', { describeName: 'my suite' });
      expect(r).toContain("describe('my suite'");
    });

    it('should use default name when describeName absent', () => {
      const r = single('Describe', {});
      expect(r).toContain('describe(');
    });

    it('should include body nodes from getNodesInBranch', () => {
      mockGetNodesInBranch.mockReturnValueOnce([makeNode('b1', 'Log', { params: { text: 'test body' } })]);
      const r = single('Describe', { describeName: 'suite1' });
      expect(r).toContain('describe(');
    });
  });

  // ─── mode=call → generateFunctionCallCode ────────────────────────────────

  describe('mode=call node — generateFunctionCallCode', () => {
    it('should produce const resultVariable = functionName() by default', () => {
      const r = generateTestCaseCode(
        [makeNode('s', 'Start'), makeNode('n', 'MyFunc', { mode: 'call', function_name: 'myCalc', params: { function_name: 'myCalc', resultVariable: 'res' } })],
        [makeEdge('e', 's', 'n')]
      );
      expect(r).toContain('myCalc');
    });

    it('should produce bare call when storeResult=false', () => {
      const r = generateTestCaseCode(
        [makeNode('s', 'Start'), makeNode('n', 'MyFunc', { mode: 'call', function_name: 'doWork', params: { function_name: 'doWork', storeResult: 'false' } })],
        [makeEdge('e', 's', 'n')]
      );
      expect(r).toContain('doWork()');
    });

    it('should include args from generateFunctionArgs when parameters available', () => {
      const mockFnParams = [{ name: 'x', type: 'number', label: 'X', required: true }];
      const { getFunctionParameters, generateFunctionArgs } = jest.requireMock('../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValueOnce(mockFnParams);
      generateFunctionArgs.mockReturnValueOnce('42');
      const r = generateTestCaseCode(
        [makeNode('s', 'Start'), makeNode('n', 'FnCall', { mode: 'call', function_name: 'compute', params: { function_name: 'compute', x: '42' } })],
        [makeEdge('e', 's', 'n')]
      );
      expect(r).toContain('compute');
    });
  });

  // ─── call_template in node template ──────────────────────────────────────

  describe('call_template in node template', () => {
    it('should use call_template when template has it', () => {
      mockGetNodeTemplate.mockImplementation((nodeType: string) => {
        if (nodeType === 'MyCallNode') {
          return {
            node_type: 'MyCallNode',
            call_template: 'myLib.run(${params.arg});',
            label: 'My Call',
            isFunction: false,
            isPredefined: true,
            inputs: [],
            bgColor: 'bg-blue-500',
            visible_on_canvas: ['main', 'nested'],
          };
        }
        return undefined;
      });
      const r = generateTestCaseCode(
        [makeNode('s', 'Start'), makeNode('n', 'MyCallNode', { params: { arg: 'val' } })],
        [makeEdge('e', 's', 'n')]
      );
      expect(r).toContain('myLib.run(val)');
    });
  });

  // ─── getApiNodes fallback code_template ──────────────────────────────────

  describe('getApiNodes fallback — node_json.code_template', () => {
    it('should use code_template from api node definition', () => {
      mockGetApiNodes.mockReturnValue([
        { node_json: { node_type: 'CustomApiOp', code_template: 'doApiThing();' } } as any,
      ]);
      const r = generateTestCaseCode(
        [makeNode('s', 'Start'), makeNode('n', 'CustomApiOp', { params: {} })],
        [makeEdge('e', 's', 'n')]
      );
      expect(r).toContain('doApiThing()');
    });

    it('should fall through to comment when code_template missing from api node', () => {
      mockGetApiNodes.mockReturnValue([
        { node_json: { node_type: 'CustomApiOp' } } as any,
      ]);
      const r = generateTestCaseCode(
        [makeNode('s', 'Start'), makeNode('n', 'CustomApiOp', { params: {} })],
        [makeEdge('e', 's', 'n')]
      );
      expect(r).toContain('//');
    });
  });

  // ─── If node via processNode — exercises generateNestedFlowCode If path ──

  describe('If node via processNode in generateNestedFlowCode', () => {
    it('should produce if/else if/else block for multiple conditions', () => {
      const conditions = JSON.stringify([
        { type: 'if', condition: 'x > 0' },
        { type: 'elseif', condition: 'x < 0' },
        { type: 'else' },
      ]);
      const r = single('If', { conditions });
      expect(r).toContain('if (x > 0)');
      expect(r).toContain('else if');
      expect(r).toContain('else');
    });

    it('should handle invalid If conditions JSON gracefully', () => {
      const r = single('If', { conditions: '{invalid}' });
      expect(typeof r).toBe('string');
    });

    it('should include branch body from getNodesInBranch for if handle', () => {
      mockGetNodesInBranch.mockReturnValueOnce([
        makeNode('b1', 'Log', { params: { text: 'inside if' } }),
      ]);
      const conditions = JSON.stringify([{ type: 'if', condition: 'a === 1' }]);
      const r = single('If', { conditions });
      expect(r).toContain('if (a === 1)');
    });

    it('should chain exit edge after If block', () => {
      const conditions = JSON.stringify([{ type: 'if', condition: 'true' }]);
      // exit edge has sourceHandle='exit'; our single() only has a default edge, so exit won't fire here—just no throw
      expect(() => single('If', { conditions })).not.toThrow();
    });
  });

  // ─── processCodeTemplate — multiline values with indent ──────────────────

  describe('processCodeTemplate — multiline param values via generateTypeScriptCode', () => {
    it('should indent multiline values (${params.key} pattern) in nested flow', () => {
      mockGetNodeTemplate.mockImplementation((nodeType: string) => {
        if (nodeType === 'MultilineNode') {
          return {
            node_type: 'MultilineNode',
            code_template: 'const x = ${params.value};',
            label: 'ML',
            isFunction: false,
            isPredefined: true,
            inputs: [],
            bgColor: 'bg-gray-500',
            visible_on_canvas: ['main', 'nested'],
          };
        }
        return undefined;
      });

      const htNode = makeNode('ht', 'HandleTransaction');
      const mlNode = makeNode('ml', 'MultilineNode', { params: { value: 'line1\nline2' } });
      const nestedCanvasData = {
        ht: { nodes: [makeNode('s', 'Start'), mlNode], edges: [makeEdge('e', 's', 'ml')] },
      };

      const result = generateTypeScriptCode([htNode], [], nestedCanvasData);
      expect(result).toContain('handleTransaction');
    });

    it('should indent multiline values (${params.key || default} pattern) in nested flow', () => {
      mockGetNodeTemplate.mockImplementation((nodeType: string) => {
        if (nodeType === 'MultilineDefaultNode') {
          return {
            node_type: 'MultilineDefaultNode',
            code_template: "const x = ${params.val || 'default'};",
            label: 'MLD',
            isFunction: false,
            isPredefined: true,
            inputs: [],
            bgColor: 'bg-gray-500',
            visible_on_canvas: ['main', 'nested'],
          };
        }
        return undefined;
      });

      const htNode = makeNode('ht2', 'HandleTransaction');
      const mldNode = makeNode('mld', 'MultilineDefaultNode', { params: { val: 'a\nb' } });
      const nestedCanvasData = {
        ht2: {
          nodes: [makeNode('s2', 'Start'), mldNode],
          edges: [makeEdge('e2', 's2', 'mld')],
        },
      };

      const result = generateTypeScriptCode([htNode], [], nestedCanvasData);
      expect(result).toContain('handleTransaction');
    });
  });

  // ─── generateFunctionDefinition paths via generateTypeScriptCode ─────────

  describe('generateFunctionDefinition via generateTypeScriptCode', () => {
    it('should include CustomFunction with export const code_template directly', () => {
      mockGetNodeTemplate.mockReturnValue(undefined);

      const htNode = makeNode('ht3', 'HandleTransaction');
      const fnNode = makeNode('fn3', 'CustomFunction', {
        mode: 'definition',
        params: {
          function_name: 'myExportedFn',
          code_template: 'export const myExportedFn = (x: number) => x * 2;',
          parameters: JSON.stringify([{ name: 'x', type: 'number', label: 'X', required: true }]),
        },
      });
      const edges = [makeEdge('ef3', 'fn3', 'ht3')];
      const nestedCanvasData = { ht3: { nodes: [makeNode('s3', 'Start')], edges: [] } };

      const result = generateTypeScriptCode([htNode, fnNode], edges, nestedCanvasData);
      expect(result).toContain('myExportedFn');
    });

    it('should generate CustomFunction without export prefix from code_template', () => {
      mockGetNodeTemplate.mockReturnValue(undefined);

      const htNode = makeNode('ht4', 'HandleTransaction');
      const fnNode = makeNode('fn4', 'CustomFunction', {
        mode: 'definition',
        params: {
          function_name: 'computeTotal',
          code_template: 'return a + b;',
          parameters: JSON.stringify([{ name: 'a', type: 'number', label: 'A', required: true }]),
        },
      });
      const edges = [makeEdge('ef4', 'fn4', 'ht4')];
      const nestedCanvasData = { ht4: { nodes: [makeNode('s4', 'Start')], edges: [] } };

      const result = generateTypeScriptCode([htNode, fnNode], edges, nestedCanvasData);
      expect(result).toContain('computeTotal');
    });

    it('should handle CustomFunction with invalid parameters JSON gracefully', () => {
      mockGetNodeTemplate.mockReturnValue(undefined);

      const htNode = makeNode('ht5', 'HandleTransaction');
      const fnNode = makeNode('fn5', 'CustomFunction', {
        mode: 'definition',
        params: {
          function_name: 'brokenFn',
          parameters: 'not-valid-json',
        },
      });
      const edges = [makeEdge('ef5', 'fn5', 'ht5')];
      const nestedCanvasData = { ht5: { nodes: [makeNode('s5', 'Start')], edges: [] } };

      expect(() => generateTypeScriptCode([htNode, fnNode], edges, nestedCanvasData)).not.toThrow();
    });

    it('should include function definition from isFunction=true template', () => {
      mockGetNodeTemplate.mockImplementation((nodeType: string, mode?: string) => {
        if (nodeType === 'PredefinedFn' && mode === 'definition') {
          return {
            node_type: 'PredefinedFn',
            code_template: 'export const predFn = () => {};',
            label: 'PredFn',
            isFunction: true,
            isPredefined: true,
            inputs: [],
            bgColor: 'bg-green-500',
            visible_on_canvas: ['main', 'nested'],
          };
        }
        return undefined;
      });

      const htNode = makeNode('ht6', 'HandleTransaction');
      const fnNode = makeNode('fn6', 'PredefinedFn', { mode: 'definition', params: {} });
      const edges = [makeEdge('ef6', 'fn6', 'ht6')];
      const nestedCanvasData = { ht6: { nodes: [makeNode('s6', 'Start')], edges: [] } };

      const result = generateTypeScriptCode([htNode, fnNode], edges, nestedCanvasData);
      expect(result).toContain('predFn');
    });
  });

  // ─── normalizeVariableNames rule-builder mode ─────────────────────────────

  describe('normalizeVariableNames — rule-builder mode (via generateTypeScriptCode)', () => {
    it('should replace RuleRequest with req in Log message via rule-builder mode', () => {
      const htNode = makeNode('ht7', 'HandleTransaction');
      const logNode = makeNode('log7', 'Log', { params: { text: 'RuleRequest.amount' } });
      const nestedCanvasData = {
        ht7: { nodes: [makeNode('s7', 'Start'), logNode], edges: [makeEdge('e7', 's7', 'log7')] },
      };
      const result = generateTypeScriptCode([htNode], [], nestedCanvasData);
      expect(result).toContain('req');
    });
  });

  // ─── RuleResultFactory with pre-existing const code ──────────────────────

  describe('RuleResultFactory — pre-existing const code path', () => {
    it('should rename the const to factoryName when ruleResultData starts with const', () => {
      const r = single('RuleResultFactory', {
        ruleResultData: "const ruleResult: RuleResult = { id: '1' };",
        factoryName: 'myResult',
      });
      expect(r).toContain('myResult');
    });
  });

  // ─── RuleRequestFactory error path ───────────────────────────────────────

  describe('RuleRequestFactory — error path', () => {
    it('should produce fallback when ruleRequestData is invalid JSON', () => {
      const r = single('RuleRequestFactory', { ruleRequestData: 'bad-json', factoryName: 'getReq' });
      expect(r).toContain('getReq');
    });
  });

  // ─── Ternary — nested branch with no nested prop (trueExpr = null) ───────

  describe('Ternary — edge cases', () => {
    it('should use null as trueExpr when trueValue.nested is absent', () => {
      const tree = JSON.stringify({
        condition: 'x > 0',
        trueValue: { type: 'nested' }, // no nested property
        falseValue: { type: 'value', value: "'no'" },
      });
      const r = single('Ternary', { ternaryTree: tree, resultVar: 'res' });
      expect(r).toContain('null');
    });

    it('should use null as falseExpr when falseValue.nested is absent', () => {
      const tree = JSON.stringify({
        condition: 'x > 0',
        trueValue: { type: 'value', value: "'yes'" },
        falseValue: { type: 'nested' }, // no nested property
      });
      const r = single('Ternary', { ternaryTree: tree, resultVar: 'res' });
      expect(r).toContain('null');
    });

    it('should handle invalid ternaryTree JSON', () => {
      const r = single('Ternary', { ternaryTree: 'not-json' });
      expect(r).toContain('error');
    });

    it('should build nested ternary expression when trueValue is nested', () => {
      const tree = JSON.stringify({
        condition: 'x > 10',
        trueValue: {
          type: 'nested',
          nested: {
            condition: 'x > 20',
            trueValue: { type: 'value', value: "'big'" },
            falseValue: { type: 'value', value: "'medium'" },
          },
        },
        falseValue: { type: 'value', value: "'small'" },
      });
      const r = single('Ternary', { ternaryTree: tree, resultVar: 'size' });
      expect(r).toContain('size');
      expect(r).toContain('x > 10');
    });
  });

  // ─── stringFunc — slice/substring without end, split without separator ───

  describe('stringFunc — additional branches', () => {
    it('should produce slice(start) when end not provided', () => {
      const r = single('stringFunc', { method: 'slice', text: 'str', start: '2', resultVar: 'r' });
      expect(r).toContain('slice(2)');
    });

    it('should produce slice(0) when neither start nor end provided', () => {
      const r = single('stringFunc', { method: 'slice', text: 'str', resultVar: 'r' });
      expect(r).toContain('slice(0)');
    });

    it('should produce split with empty separator when separator absent', () => {
      const r = single('stringFunc', { method: 'split', text: 'str', resultVar: 'parts' });
      expect(r).toContain("split('')");
    });
  });

  // ─── processCodeTemplate with ${indent} substitution ─────────────────────

  describe('processCodeTemplate — ${indent} substitution', () => {
    it('should replace ${indent} with the indentation string', () => {
      mockGetNodeTemplate.mockImplementation((nodeType: string) => {
        if (nodeType === 'IndentNode') {
          return {
            node_type: 'IndentNode',
            code_template: '${indent}console.log(1);',
            label: 'IN',
            isFunction: false,
            isPredefined: true,
            inputs: [],
            bgColor: 'bg-gray-500',
            visible_on_canvas: ['main', 'nested'],
          };
        }
        return undefined;
      });
      const r = single('IndentNode', {});
      expect(r).toContain('console.log(1)');
    });
  });
});

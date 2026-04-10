import { expandFunctionNodes } from '../../../src/utils/Flow/expandFunctionNodes';

const makeBaseApiNode = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  tenant_id: 'tenant-1',
  created_by: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  node_json: {
    node_type: 'SetVariable',
    label: 'Set Variable',
    type: 'node',
    category: 'data',
    color: '#2196F3',
    description: 'Sets a variable',
    inputs: [],
    handles: { source: true, target: true },
    code_template: 'const ${params.name || "x"} = ${params.value || "0"};',
    ...overrides,
  },
});

const makeFunctionApiNode = () => ({
  id: 2,
  tenant_id: 'tenant-1',
  created_by: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  node_json: {
    node_type: 'MyFunction',
    label: 'My Function',
    type: 'function',
    category: 'custom',
    color: '#4CAF50',
    description: 'A custom function',
    function_name: 'myFunction',
    modes: {
      definition: {
        visible_on_canvas: ['main'],
        label: 'Define My Function',
        inputs: [{ key: 'code', label: 'Code', type: 'code' }],
        handles: { source: true, target: true },
        code_template: 'export const myFunction = () => {}',
        parameters: [{ name: 'x', type: 'number', label: 'X' }],
      },
      call: {
        visible_on_canvas: ['main', 'nested'],
        label: 'Call My Function',
        inputs: [],
        handles: { source: true, target: true },
        call_template: 'myFunction()',
        useDefinitionParameters: true,
      },
    },
  },
});

describe('expandFunctionNodes (utils/Flow/expandFunctionNodes)', () => {
  it('should return empty array for empty input', () => {
    expect(expandFunctionNodes([])).toEqual([]);
  });

  describe('regular nodes', () => {
    it('should produce exactly one template for a regular node', () => {
      const result = expandFunctionNodes([makeBaseApiNode() as Parameters<typeof expandFunctionNodes>[0][0]]);
      expect(result).toHaveLength(1);
    });

    it('should keep core node fields and defaults', () => {
      const result = expandFunctionNodes([makeBaseApiNode() as Parameters<typeof expandFunctionNodes>[0][0]]);
      expect(result[0].type).toBe('SetVariable');
      expect(result[0].label).toBe('Set Variable');
      expect(result[0].isFunction).toBe(false);
      expect(result[0].isPredefined).toBe(false);
      expect(result[0].visible_on_canvas).toEqual(['main', 'nested']);
    });

    it('should map known color and fallback unknown color', () => {
      const known = expandFunctionNodes([makeBaseApiNode({ color: '#4CAF50' }) as Parameters<typeof expandFunctionNodes>[0][0]]);
      const unknown = expandFunctionNodes([makeBaseApiNode({ color: '#AAAAAA' }) as Parameters<typeof expandFunctionNodes>[0][0]]);
      expect(known[0].bgColor).toContain('green');
      expect(unknown[0].bgColor).toContain('gray');
    });

    it('should use provided visible_on_canvas when set', () => {
      const result = expandFunctionNodes([
        makeBaseApiNode({ visible_on_canvas: ['main'] }) as Parameters<typeof expandFunctionNodes>[0][0],
      ]);
      expect(result[0].visible_on_canvas).toEqual(['main']);
    });

    it('should fallback description and handles when absent', () => {
      const result = expandFunctionNodes([
        makeBaseApiNode({ description: undefined, handles: undefined }) as Parameters<typeof expandFunctionNodes>[0][0],
      ]);
      expect(result[0].description).toBe('');
      expect(result[0].handles).toEqual({ source: true, target: true });
    });
  });

  describe('function nodes with both modes', () => {
    it('should expand to definition and call templates', () => {
      const result = expandFunctionNodes([makeFunctionApiNode() as Parameters<typeof expandFunctionNodes>[0][0]]);
      expect(result).toHaveLength(2);
      expect(result.find((t) => t.mode === 'definition')).toBeDefined();
      expect(result.find((t) => t.mode === 'call')).toBeDefined();
    });

    it('should set generation/mode-specific fields correctly', () => {
      const result = expandFunctionNodes([makeFunctionApiNode() as Parameters<typeof expandFunctionNodes>[0][0]]);
      const defTemplate = result.find((t) => t.mode === 'definition');
      const callTemplate = result.find((t) => t.mode === 'call');

      expect(defTemplate?.generation_type).toBe('definition');
      expect(defTemplate?.label).toBe('Define My Function');
      expect(defTemplate?.parameters).toEqual([{ name: 'x', type: 'number', label: 'X' }]);

      expect(callTemplate?.generation_type).toBe('call');
      expect(callTemplate?.call_template).toBe('myFunction()');
      expect(callTemplate?.useDefinitionParameters).toBe(true);

      result.forEach((t) => {
        expect(t.function_name).toBe('myFunction');
        expect(t.isFunction).toBe(true);
      });
    });
  });

  describe('function nodes with only one mode', () => {
    it('should expand only definition template when call mode is absent', () => {
      const fnNode = makeFunctionApiNode();
      const node = {
        ...fnNode,
        node_json: {
          ...fnNode.node_json,
          modes: { definition: fnNode.node_json.modes.definition },
        },
      } as Parameters<typeof expandFunctionNodes>[0][0];

      const result = expandFunctionNodes([node]);
      expect(result).toHaveLength(1);
      expect(result[0].mode).toBe('definition');
    });

    it('should expand only call template when definition mode is absent', () => {
      const fnNode = makeFunctionApiNode();
      const node = {
        ...fnNode,
        node_json: {
          ...fnNode.node_json,
          modes: { call: fnNode.node_json.modes.call },
        },
      } as Parameters<typeof expandFunctionNodes>[0][0];

      const result = expandFunctionNodes([node]);
      expect(result).toHaveLength(1);
      expect(result[0].mode).toBe('call');
    });
  });

  describe('function node without modes', () => {
    it('should use function defaults for test_case_generation and custom categories', () => {
      const testCaseNode = makeBaseApiNode({ type: 'function', category: 'test_case_generation' });
      const customNode = makeBaseApiNode({ type: 'function', category: 'custom' });

      const testCaseResult = expandFunctionNodes([testCaseNode as Parameters<typeof expandFunctionNodes>[0][0]]);
      const customResult = expandFunctionNodes([customNode as Parameters<typeof expandFunctionNodes>[0][0]]);

      expect(testCaseResult[0].isFunction).toBe(true);
      expect(testCaseResult[0].visible_on_canvas).toEqual(['main', 'nested']);
      expect(customResult[0].visible_on_canvas).toEqual(['nested']);
    });

    it('should use provided visible_on_canvas for custom function without modes', () => {
      const node = makeBaseApiNode({ type: 'function', category: 'custom', visible_on_canvas: ['main'] });
      const result = expandFunctionNodes([node as Parameters<typeof expandFunctionNodes>[0][0]]);
      expect(result[0].visible_on_canvas).toEqual(['main']);
    });
  });
});
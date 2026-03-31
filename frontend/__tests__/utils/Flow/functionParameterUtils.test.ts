import {
  extractParametersFromCode,
  generateFunctionArgs,
  usesDynamicParameters,
  getFunctionParameters,
} from '../../../src/utils/Flow/functionParameterUtils';
import type { FunctionParameter } from '../../../src/utils/Flow/functionParameterUtils';
import type { NodeTemplate } from '../../../src/hooks/RuleBuilder/useNodePalette';
import { getAllNodeTemplates } from '../../../src/utils/Flow/nodeTemplateService';

// Mock nodeTemplateService so getFunctionParameters doesn't need a real store
jest.mock('../../../src/utils/Flow/nodeTemplateService', () => ({
  getAllNodeTemplates: jest.fn(() => []),
}));

const mockGetAllNodeTemplates = getAllNodeTemplates as jest.MockedFunction<typeof getAllNodeTemplates>;

// ─── extractParametersFromCode ────────────────────────────────────────────────

describe('extractParametersFromCode', () => {
  describe('empty / invalid input', () => {
    it('should return empty array for empty string', () => {
      expect(extractParametersFromCode('')).toEqual([]);
    });

    it('should return empty array for non-string input', () => {
      expect(extractParametersFromCode(null as unknown as string)).toEqual([]);
    });

    it('should return empty array when no function signature found', () => {
      expect(extractParametersFromCode('const x = 1;')).toEqual([]);
    });
  });

  describe('arrow function', () => {
    it('should extract typed parameters from arrow function', () => {
      const code = 'export const myFn = (amount: number, name: string) => { return amount; }';
      const params = extractParametersFromCode(code);
      expect(params).toHaveLength(2);
      expect(params[0].name).toBe('amount');
      expect(params[0].type).toBe('number');
      expect(params[1].name).toBe('name');
      expect(params[1].type).toBe('string');
    });

    it('should set required to true for normal typed params', () => {
      const code = 'const fn = (x: number) => x;';
      expect(extractParametersFromCode(code)[0].required).toBe(true);
    });

    it('should set required to false for optional params (? suffix)', () => {
      const code = 'const fn = (x?: number) => x;';
      expect(extractParametersFromCode(code)[0].required).toBe(false);
    });

    it('should capitalise label from param name', () => {
      const code = 'const fn = (amount: number) => amount;';
      expect(extractParametersFromCode(code)[0].label).toBe('Amount');
    });

    it('should handle params without type annotation', () => {
      const code = 'const fn = (myParam) => myParam;';
      const params = extractParametersFromCode(code);
      expect(params).toHaveLength(1);
      expect(params[0].name).toBe('myParam');
      expect(params[0].type).toBe('any');
    });

    it('should handle a function with no parameters', () => {
      const code = 'const fn = () => 42;';
      expect(extractParametersFromCode(code)).toEqual([]);
    });
  });

  describe('regular function keyword', () => {
    it('should extract parameters from function keyword declaration', () => {
      const code = 'function myFunc(a: string, b: number) { return a; }';
      const params = extractParametersFromCode(code);
      expect(params).toHaveLength(2);
      expect(params[0].name).toBe('a');
      expect(params[1].name).toBe('b');
    });
  });
});

// ─── generateFunctionArgs ─────────────────────────────────────────────────────

describe('generateFunctionArgs', () => {
  const params: Record<string, string> = { amount: '100', name: 'Alice' };

  describe('empty parameters list', () => {
    it('should return empty string for empty parameters array', () => {
      expect(generateFunctionArgs([], params)).toBe('');
    });

    it('should return empty string for null-like parameters', () => {
      expect(generateFunctionArgs(null as unknown as FunctionParameter[], params)).toBe('');
    });
  });

  describe('plain value', () => {
    it('should return numeric value as-is for number type', () => {
      const fps: FunctionParameter[] = [{ name: 'amount', type: 'number', label: 'Amount', required: true }];
      expect(generateFunctionArgs(fps, params)).toBe('100');
    });

    it('should wrap string values in double quotes', () => {
      const fps: FunctionParameter[] = [{ name: 'name', type: 'string', label: 'Name', required: true }];
      expect(generateFunctionArgs(fps, params)).toBe('"Alice"');
    });

    it('should not double-wrap already-quoted string values', () => {
      const fps: FunctionParameter[] = [{ name: 'name', type: 'string', label: 'Name', required: true }];
      expect(generateFunctionArgs(fps, { name: '"already"' })).toBe('"already"');
    });

    it('should pass boolean type value as-is', () => {
      const fps: FunctionParameter[] = [{ name: 'flag', type: 'boolean', label: 'Flag', required: true }];
      expect(generateFunctionArgs(fps, { flag: 'true' })).toBe('true');
    });

    it('should filter out empty values', () => {
      const fps: FunctionParameter[] = [
        { name: 'amount', type: 'number', label: 'Amount', required: true },
        { name: 'missing', type: 'string', label: 'Missing', required: true },
      ];
      expect(generateFunctionArgs(fps, { amount: '100', missing: '' })).toBe('100');
    });

    it('should pass array-typed values through when param type includes []', () => {
      const fps: FunctionParameter[] = [{ name: 'items', type: 'string[]', label: 'Items', required: true }];
      expect(generateFunctionArgs(fps, { items: '["a","b"]' })).toBe('["a","b"]');
    });

    it('should return empty string when all args are empty and filtered out', () => {
      const fps: FunctionParameter[] = [
        { name: 'optionalOne', type: 'string', label: 'Optional One', required: false },
        { name: 'optionalTwo', type: 'number', label: 'Optional Two', required: false },
      ];
      expect(generateFunctionArgs(fps, { optionalOne: '', optionalTwo: '' })).toBe('');
    });
  });

  describe('variable references ({{ }})', () => {
    it('should strip {{ }} wrapping from variable references', () => {
      const fps: FunctionParameter[] = [{ name: 'amount', type: 'number', label: 'Amount', required: true }];
      expect(generateFunctionArgs(fps, { amount: '{{ myVar }}' })).toBe('myVar');
    });

    it('should strip RuleRequest referenced values', () => {
      const fps: FunctionParameter[] = [{ name: 'price', type: 'any', label: 'Price', required: true }];
      expect(generateFunctionArgs(fps, { price: '{{ RuleRequest.amount }}' })).toBe('RuleRequest.amount');
    });
  });

  describe('multiple parameters', () => {
    it('should join multiple args with ", "', () => {
      const fps: FunctionParameter[] = [
        { name: 'amount', type: 'number', label: 'Amount', required: true },
        { name: 'name', type: 'string', label: 'Name', required: true },
      ];
      const result = generateFunctionArgs(fps, params);
      expect(result).toBe('100, "Alice"');
    });
  });
});

// ─── usesDynamicParameters ────────────────────────────────────────────────────

describe('usesDynamicParameters', () => {
  it('should return true when template has useDefinitionParameters = true', () => {
    const template = { useDefinitionParameters: true } as unknown as NodeTemplate;
    expect(usesDynamicParameters(template)).toBe(true);
  });

  it('should return false when template has useDefinitionParameters = false', () => {
    const template = { useDefinitionParameters: false } as unknown as NodeTemplate;
    expect(usesDynamicParameters(template)).toBe(false);
  });

  it('should return false when template is null', () => {
    expect(usesDynamicParameters(null)).toBe(false);
  });

  it('should return false when template is undefined', () => {
    expect(usesDynamicParameters(undefined)).toBe(false);
  });

  it('should return false when useDefinitionParameters not present', () => {
    const template = {} as unknown as NodeTemplate;
    expect(usesDynamicParameters(template)).toBe(false);
  });
});

// ─── getFunctionParameters ────────────────────────────────────────────────────

describe('getFunctionParameters', () => {
  beforeEach(() => {
    mockGetAllNodeTemplates.mockReturnValue([]);
  });

  describe('returns null when nothing matches', () => {
    it('should return null when templates list is empty and no allNodes provided', () => {
      const result = getFunctionParameters('unknownFn');
      expect(result).toBeNull();
    });

    it('should return null when allNodes is empty', () => {
      const result = getFunctionParameters('unknownFn', []);
      expect(result).toBeNull();
    });
  });

  describe('returns from matching template', () => {
    it('should return template.parameters when template with matching function_name and definition mode is found', () => {
      const mockParams: FunctionParameter[] = [
        { name: 'amount', type: 'number', label: 'Amount', required: true },
      ];
      mockGetAllNodeTemplates.mockReturnValue([
        {
          node_type: 'myFn',
          nodeType: 'myFn',
          function_name: 'myFn',
          mode: 'definition',
          parameters: mockParams,
          label: 'My Fn',
          isFunction: true,
          isPredefined: false,
          inputs: [],
          bgColor: 'bg-blue-500',
          visible_on_canvas: true,
        } as unknown as NodeTemplate,
      ]);

      const result = getFunctionParameters('myFn');
      expect(result).toEqual(mockParams);
    });

    it('should return template.parameters matched by nodeType', () => {
      const mockParams: FunctionParameter[] = [
        { name: 'x', type: 'string', label: 'X', required: true },
      ];
      mockGetAllNodeTemplates.mockReturnValue([
        {
          node_type: 'myFn',
          nodeType: 'myFn',
          function_name: 'myFn',
          generation_type: 'definition',
          parameters: mockParams,
          label: 'My Fn',
          isFunction: true,
          isPredefined: false,
          inputs: [],
          bgColor: 'bg-blue-500',
          visible_on_canvas: true,
        } as unknown as NodeTemplate,
      ]);

      const result = getFunctionParameters('myFn');
      expect(result).toEqual(mockParams);
    });
  });

  describe('falls back to allNodes lookup', () => {
    it('should extract params from allNodes definition node with JSON parameters', () => {
      const node = {
        id: 'n1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'CustomFunction',
          label: 'Fn',
          function_name: 'myCustomFn',
          mode: 'definition',
          params: {
            function_name: 'myCustomFn',
            parameters: JSON.stringify([{ name: 'val', type: 'number', label: 'Val', required: true }]),
          },
        },
      };

      const result = getFunctionParameters('myCustomFn', [node] as any);
      expect(result).not.toBeNull();
      expect(result![0].name).toBe('val');
    });

    it('should fall back to code_template parsing when parameters JSON is absent', () => {
      const node = {
        id: 'n1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'CustomFunction',
          label: 'Fn',
          function_name: 'myCustomFn',
          mode: 'definition',
          params: {
            function_name: 'myCustomFn',
            code_template: 'const myCustomFn = (price: number, discount: number) => price - discount;',
          },
        },
      };

      const result = getFunctionParameters('myCustomFn', [node] as any);
      expect(result).not.toBeNull();
      expect(result!.length).toBeGreaterThan(0);
      expect(result![0].name).toBe('price');
    });

    it('should return null if definition node has invalid JSON parameters', () => {
      const node = {
        id: 'n1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'CustomFunction',
          label: 'Fn',
          function_name: 'myCustomFn',
          mode: 'definition',
          params: {
            function_name: 'myCustomFn',
            parameters: 'not-valid-json',
          },
        },
      };

      const result = getFunctionParameters('myCustomFn', [node] as any);
      // Falls through to null because JSON.parse fails and no code_template
      expect(result).toBeNull();
    });
  });
});

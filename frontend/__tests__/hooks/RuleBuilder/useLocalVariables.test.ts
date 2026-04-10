import { renderHook } from '@testing-library/react';
import { useLocalVariables } from '../../../src/hooks/RuleBuilder/useLocalVariables';
import { useNodeScope } from '../../../src/hooks/RuleBuilder/useNodeScope';
import type { Node, Edge } from '@xyflow/react';

jest.mock('../../../src/hooks/RuleBuilder/useNodeScope');

const mockedUseNodeScope = useNodeScope as jest.MockedFunction<typeof useNodeScope>;

describe('useLocalVariables', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (window as any).globalVariablesData;

    mockedUseNodeScope.mockReturnValue({
      parentLoops: [],
      isInLoopScope: false,
    });
  });

  describe('Initialization', () => {
    it('should return localVars, loopVars, and loopContext', () => {
      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: [],
          edges: [],
          selectedNodeId: null,
        })
      );

      expect(result.current).toHaveProperty('localVars');
      expect(result.current).toHaveProperty('loopVars');
      expect(result.current).toHaveProperty('loopContext');
    });

    it('should initialize with empty local and loop vars', () => {
      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: [],
          edges: [],
          selectedNodeId: null,
        })
      );

      expect(result.current.localVars).toEqual({});
      expect(result.current.loopVars).toEqual({});
    });

    it('should initialize loop context correctly', () => {
      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: [],
          edges: [],
          selectedNodeId: null,
        })
      );

      expect(result.current.loopContext).toEqual({
        isInLoopScope: false,
        loopNames: [],
      });
    });
  });

  describe('useNodeScope Integration', () => {
    it('should call useNodeScope with correct parameters', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'Start' },
        },
      ];

      const edges: Edge[] = [];

      renderHook(() =>
        useLocalVariables({
          allNodes: nodes,
          edges,
          selectedNodeId: '1',
        })
      );

      expect(mockedUseNodeScope).toHaveBeenCalledWith({
        nodeId: '1',
        edges,
        nodes,
      });
    });

    it('should reflect loop scope from useNodeScope', () => {
      const mockLoopNode: Node = {
        id: 'loop-1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'Loop',
          label: 'My Loop',
          params: {
            arrayVariable: 'items',
            itemVariable: 'item',
            indexVariable: 'i',
          },
        },
      };

      mockedUseNodeScope.mockReturnValue({
        parentLoops: [
          {
            loopNode: mockLoopNode,
            arrayVariable: 'items',
            itemVariable: 'item',
            indexVariable: 'i',
            loopType: 'for',
          },
        ],
        isInLoopScope: true,
      });

      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: [],
          edges: [],
          selectedNodeId: '1',
        })
      );

      expect(result.current.loopContext.isInLoopScope).toBe(true);
    });
  });

  describe('SetVariable Node Processing', () => {
    it('should extract variables from SetVariable nodes', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: {
              name: 'myVar',
              value: '42',
            },
          },
        },
      ];

      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: nodes,
          edges: [],
          selectedNodeId: null,
        })
      );

      expect(result.current.localVars).toHaveProperty('myVar', '42');
    });

    it('should handle multiple SetVariable nodes', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: {
              name: 'var1',
              value: 'value1',
            },
          },
        },
        {
          id: '2',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: {
            nodeType: 'SetVariable',
            params: {
              name: 'var2',
              value: 'value2',
            },
          },
        },
      ];

      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: nodes,
          edges: [],
          selectedNodeId: null,
        })
      );

      expect(result.current.localVars).toHaveProperty('var1', 'value1');
      expect(result.current.localVars).toHaveProperty('var2', 'value2');
    });

    it('should handle SetVariable nodes with empty value', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: {
              name: 'emptyVar',
              value: '',
            },
          },
        },
      ];

      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: nodes,
          edges: [],
          selectedNodeId: null,
        })
      );

      // Empty string values are treated as undefined in original implementation
      expect(result.current.localVars).toHaveProperty('emptyVar', undefined);
    });

    it('should handle SetVariable nodes without params', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
          },
        },
      ];

      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: nodes,
          edges: [],
          selectedNodeId: null,
        })
      );

      expect(result.current.localVars).toEqual({});
    });
  });

  describe('Global Variables', () => {
    it('should include global RuleRequest data', () => {
      (window as any).globalVariablesData = {
        RuleRequest: {
          transactionId: 'tx-123',
          amount: 1000,
        },
      };

      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: {
              name: 'testVar',
              value: '{{ RuleRequest.transactionId }}',
            },
          },
        },
      ];

      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: nodes,
          edges: [],
          selectedNodeId: null,
          globalVarsData: (window as any).globalVariablesData,
        })
      );

      // Global vars should be accessible via template resolution, not directly in localVars
      expect(result.current.localVars).toHaveProperty('testVar', 'tx-123');
    });

    it('should include global RuleConfig data', () => {
      const globalVarsData = {
        RuleConfig: {
          ruleId: 'rule-1',
          version: '1.0.0',
        },
      };

      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: {
              name: 'configVar',
              value: '{{ RuleConfig.ruleId }}',
            },
          },
        },
      ];

      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: nodes,
          edges: [],
          selectedNodeId: null,
          globalVarsData,
        })
      );

      expect(result.current.localVars).toHaveProperty('configVar', 'rule-1');
    });

    it('should include global RuleResult data', () => {
      const globalVarsData = {
        RuleResult: {
          outcome: 'pass',
          score: 95,
        },
      };

      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: {
              name: 'resultVar',
              value: '{{ RuleResult.outcome }}',
            },
          },
        },
      ];

      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: nodes,
          edges: [],
          selectedNodeId: null,
          globalVarsData,
        })
      );

      expect(result.current.localVars).toHaveProperty('resultVar', 'pass');
    });

    it('should handle null globalVarsData', () => {
      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: [],
          edges: [],
          selectedNodeId: null,
          globalVarsData: null,
        })
      );

      expect(result.current.localVars).toEqual({});
    });

    it('should combine global and local variables', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: {
              name: 'localVar',
              value: 'local',
            },
          },
        },
        {
          id: '2',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: {
              name: 'globalRef',
              value: '{{ RuleRequest.id }}',
            },
          },
        },
      ];

      const globalVarsData = {
        RuleRequest: { id: '123' },
      };

      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: nodes,
          edges: [],
          selectedNodeId: null,
          globalVarsData,
        })
      );

      expect(result.current.localVars).toHaveProperty('localVar', 'local');
      expect(result.current.localVars).toHaveProperty('globalRef', '123');
    });
  });

  describe('Loop Variables', () => {
    it('should extract loop variables from ForEach nodes', () => {
      const mockLoopNode: Node = {
        id: 'loop1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'ForEach',
          label: 'ForEach Loop',
          params: {
            itemName: 'item',
            arrayPath: 'items',
          },
        },
      };

      mockedUseNodeScope.mockReturnValue({
        parentLoops: [
          {
            loopNode: mockLoopNode,
            arrayVariable: 'items',
            itemVariable: 'item',
            indexVariable: '',
            loopType: 'forEach',
          },
        ],
        isInLoopScope: true,
      });

      const nodes: Node[] = [
        {
          id: 'loop1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'ForEach',
            params: {
              itemName: 'item',
              arrayPath: 'items',
            },
          },
        },
      ];

      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: nodes,
          edges: [],
          selectedNodeId: 'child',
        })
      );

      expect(result.current.loopContext.isInLoopScope).toBe(true);
      expect(result.current.loopContext.loopNames).toContain('ForEach Loop');
    });

    it('should handle multiple nested loops', () => {
      const mockLoopNode1: Node = {
        id: 'loop1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'ForEach',
          label: 'Outer Loop',
          params: {
            itemName: 'outer',
            arrayPath: 'outerArray',
          },
        },
      };

      const mockLoopNode2: Node = {
        id: 'loop2',
        type: 'editableNode',
        position: { x: 100, y: 100 },
        data: {
          nodeType: 'ForEach',
          label: 'Inner Loop',
          params: {
            itemName: 'inner',
            arrayPath: 'innerArray',
          },
        },
      };

      mockedUseNodeScope.mockReturnValue({
        parentLoops: [
          {
            loopNode: mockLoopNode1,
            arrayVariable: 'outerArray',
            itemVariable: 'outer',
            indexVariable: '',
            loopType: 'forEach',
          },
          {
            loopNode: mockLoopNode2,
            arrayVariable: 'innerArray',
            itemVariable: 'inner',
            indexVariable: '',
            loopType: 'forEach',
          },
        ],
        isInLoopScope: true,
      });

      const nodes: Node[] = [
        {
          id: 'loop1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'ForEach',
            params: {
              itemName: 'outer',
              arrayPath: 'outerArray',
            },
          },
        },
        {
          id: 'loop2',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: {
            nodeType: 'ForEach',
            params: {
              itemName: 'inner',
              arrayPath: 'innerArray',
            },
          },
        },
      ];

      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: nodes,
          edges: [],
          selectedNodeId: 'child',
        })
      );

      expect(result.current.loopContext.loopNames).toHaveLength(2);
      expect(result.current.loopContext.loopNames).toContain('Outer Loop');
      expect(result.current.loopContext.loopNames).toContain('Inner Loop');
    });
  });

  describe('Memoization', () => {
    it('should memoize result when inputs do not change', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: {
              name: 'var1',
              value: 'value1',
            },
          },
        },
      ];

      const { result, rerender } = renderHook(() =>
        useLocalVariables({
          allNodes: nodes,
          edges: [],
          selectedNodeId: null,
        })
      );

      const firstResult = result.current;
      rerender();

      expect(result.current).toBe(firstResult);
    });

    it('should recompute when nodes change', () => {
      const nodes1: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: {
              name: 'var1',
              value: 'value1',
            },
          },
        },
      ];

      const nodes2: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: {
              name: 'var1',
              value: 'value2',
            },
          },
        },
      ];

      const { result, rerender } = renderHook(
        ({ nodes }) =>
          useLocalVariables({
            allNodes: nodes,
            edges: [],
            selectedNodeId: null,
          }),
        { initialProps: { nodes: nodes1 } }
      );

      const firstResult = result.current;

      rerender({ nodes: nodes2 });

      expect(result.current).not.toBe(firstResult);
      expect(result.current.localVars.var1).toBe('value2');
    });

    it('should recompute when globalVarsData changes', () => {
      const globalVars1 = {
        RuleRequest: {
          id: '1',
        },
      };

      const globalVars2 = {
        RuleRequest: {
          id: '2',
        },
      };

      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: {
              name: 'reqId',
              value: '{{ RuleRequest.id }}',
            },
          },
        },
      ];

      const { result, rerender } = renderHook(
        ({ globalVarsData }) =>
          useLocalVariables({
            allNodes: nodes,
            edges: [],
            selectedNodeId: null,
            globalVarsData,
          }),
        { initialProps: { globalVarsData: globalVars1 } }
      );

      const firstId = result.current.localVars.reqId;
      expect(firstId).toBe('1');

      rerender({ globalVarsData: globalVars2 });

      const secondId = result.current.localVars.reqId;
      expect(secondId).toBe('2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle nodes with missing data', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {},
        },
      ];

      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: nodes,
          edges: [],
          selectedNodeId: null,
        })
      );

      expect(result.current.localVars).toEqual({});
    });

    it('should handle empty edges array', () => {
      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: [],
          edges: [],
          selectedNodeId: null,
        })
      );

      expect(result.current.localVars).toEqual({});
    });

    it('should handle undefined selectedNodeId', () => {
      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: [],
          selectedNodeId: undefined,
        })
      );

      expect(result.current).toBeDefined();
    });

    it('should handle nodes with numeric values', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: {
              name: 'numVar',
              value: '123',
            },
          },
        },
      ];

      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: nodes,
          edges: [],
          selectedNodeId: null,
        })
      );

      expect(result.current.localVars).toHaveProperty('numVar', '123');
    });

    it('should handle nodes with boolean values', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: {
              name: 'boolVar',
              value: 'true',
            },
          },
        },
      ];

      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: nodes,
          edges: [],
          selectedNodeId: null,
        })
      );

      expect(result.current.localVars).toHaveProperty('boolVar', 'true');
    });

    it('should handle complex nested global data', () => {
      const globalVarsData = {
        RuleRequest: {
          transaction: {
            id: 'tx-123',
            details: {
              amount: 1000,
              currency: 'USD',
            },
          },
        },
      };

      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: {
              name: 'nestedVar',
              value: '{{ RuleRequest.transaction }}',
            },
          },
        },
      ];

      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: nodes,
          edges: [],
          selectedNodeId: null,
          globalVarsData,
        })
      );

      // Nested objects are stringified when resolved
      expect(result.current.localVars).toHaveProperty('nestedVar');
      const resolvedValue = result.current.localVars.nestedVar;
      expect(typeof resolvedValue).toBe('string');
      const parsed = JSON.parse(resolvedValue as string);
      expect(parsed).toEqual(globalVarsData.RuleRequest.transaction);
    });
  });

  describe('SetVariable Alternate Parameters', () => {
    it('should use variableName as name fallback', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: { variableName: 'altName', value: 'hello' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toHaveProperty('altName', 'hello');
    });

    it('should use variableValue as value fallback', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: { name: 'myVar', variableValue: 'altValue' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toHaveProperty('myVar', 'altValue');
    });

    it('should set undefined when dataType is explicitly "undefined"', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: { name: 'typedVar', value: 'someValue', dataType: 'undefined' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars.typedVar).toBeUndefined();
    });

    it('should set undefined when value is whitespace only', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: { name: 'wsVar', value: '   ' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars.wsVar).toBeUndefined();
    });
  });

  describe('FetchDB Node Processing', () => {
    it('should set resultVar as object placeholder', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'FetchDB',
            params: { resultVar: 'dbResult' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toHaveProperty('dbResult', '{ }');
    });

    it('should support variable as alternate key for resultVar', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'FetchDB',
            params: { variable: 'altResult' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toHaveProperty('altResult', '{ }');
    });

    it('should set queryVar as string placeholder', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'FetchDB',
            params: { resultVar: 'dbResult', queryVar: 'myQuery' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toHaveProperty('myQuery', 'string');
    });

    it('should skip FetchDB node when no resultVar or queryVar', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'FetchDB', params: {} },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toEqual({});
    });
  });

  describe('CustomFunction Node Processing', () => {
    it('should set resultVar as object placeholder', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'CustomFunction',
            params: { resultVar: 'fnResult' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toHaveProperty('fnResult', '{ }');
    });

    it('should skip CustomFunction when no resultVar', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'CustomFunction', params: {} },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toEqual({});
    });
  });

  describe('math Node Processing', () => {
    it('should set resultVar as number placeholder', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'math',
            params: { resultVar: 'mathResult' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toHaveProperty('mathResult', '<number>');
    });

    it('should skip math when no resultVar', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'math', params: {} },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toEqual({});
    });
  });

  describe('stringFunc Node Processing', () => {
    it('should set resultVar as string placeholder', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'stringFunc',
            params: { resultVar: 'strResult' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toHaveProperty('strResult', '<string>');
    });

    it('should skip stringFunc when no resultVar', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'stringFunc', params: {} },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toEqual({});
    });
  });

  describe('arrayOp Node Processing', () => {
    it('should set resultVar as array | value placeholder', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'arrayOp',
            params: { resultVar: 'arrResult' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toHaveProperty('arrResult', '<array | value>');
    });

    it('should skip arrayOp when no resultVar', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'arrayOp', params: {} },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toEqual({});
    });
  });

  describe('objectOp Node Processing', () => {
    const makeObjectOpNode = (operation: string): Node => ({
      id: '1',
      type: 'editableNode',
      position: { x: 0, y: 0 },
      data: { nodeType: 'objectOp', params: { resultVar: 'objResult', operation } },
    });

    it.each(['keys', 'values', 'entries'])('should set <array> for operation "%s"', (op) => {
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: [makeObjectOpNode(op)], edges: [] })
      );
      expect(result.current.localVars.objResult).toBe('<array>');
    });

    it('should set <boolean> for hasOwnProperty operation', () => {
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: [makeObjectOpNode('hasOwnProperty')], edges: [] })
      );
      expect(result.current.localVars.objResult).toBe('<boolean>');
    });

    it.each(['assign', 'freeze', 'seal'])('should set <object> for operation "%s"', (op) => {
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: [makeObjectOpNode(op)], edges: [] })
      );
      expect(result.current.localVars.objResult).toBe('<object>');
    });

    it('should not set resultVar for unknown operation', () => {
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: [makeObjectOpNode('unknownOp')], edges: [] })
      );
      expect(result.current.localVars.objResult).toBeUndefined();
    });

    it('should skip objectOp when no resultVar', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'objectOp', params: { operation: 'keys' } },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toEqual({});
    });
  });

  describe('length Node Processing', () => {
    it('should set resultVar as number placeholder', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'length', params: { resultVar: 'lenResult' } },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toHaveProperty('lenResult', '<number>');
    });

    it('should skip length when no resultVar', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'length', params: {} },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toEqual({});
    });
  });

  describe('Loop Node Processing (first pass)', () => {
    it.each(['map', 'filter'])('should set <array> for loopType "%s" with resultVariable', (loopType) => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'Loop', params: { loopType, resultVariable: 'loopResult' } },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars.loopResult).toBe('<array>');
    });

    it.each(['reduce', 'find', 'every', 'some'])('should set <any> for loopType "%s" with resultVariable', (loopType) => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'Loop', params: { loopType, resultVariable: 'loopResult' } },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars.loopResult).toBe('<any>');
    });

    it('should set arrayResultVariable for loopType "for"', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'Loop',
            params: { loopType: 'for', arrayResultVariable: 'forResult' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars.forResult).toBe('<array>');
    });

    it('should skip loop result when no resultVariable', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'Loop', params: { loopType: 'map' } },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars).toEqual({});
    });

    it('should skip arrayResultVariable when loopType is not "for"', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'Loop',
            params: { loopType: 'map', arrayResultVariable: 'shouldNotBeSet' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars.shouldNotBeSet).toBeUndefined();
    });
  });

  describe('Ternary Node Processing', () => {
    const makeTernaryNode = (
      trueValue: object,
      falseValue: object,
      extra: Record<string, string> = {}
    ): Node => ({
      id: 'ternary-1',
      type: 'editableNode',
      position: { x: 0, y: 0 },
      data: {
        nodeType: 'Ternary',
        params: {
          storeResult: 'true',
          resultVar: 'ternResult',
          ternaryTree: JSON.stringify({ condition: 'x', trueValue, falseValue }),
          ...extra,
        },
      },
    });

    it('should parse literal integer from trueValue', () => {
      const node = makeTernaryNode({ type: 'value', value: '42' }, { type: 'value', value: '0' });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [node], edges: [] }));
      expect(result.current.localVars.ternResult).toBe(42);
    });

    it('should parse negative number from trueValue', () => {
      const node = makeTernaryNode({ type: 'value', value: '-5' }, { type: 'value', value: '0' });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [node], edges: [] }));
      expect(result.current.localVars.ternResult).toBe(-5);
    });

    it('should parse float from trueValue', () => {
      const node = makeTernaryNode({ type: 'value', value: '3.14' }, { type: 'value', value: '0' });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [node], edges: [] }));
      expect(result.current.localVars.ternResult).toBeCloseTo(3.14);
    });

    it('should parse boolean true from trueValue', () => {
      const node = makeTernaryNode({ type: 'value', value: 'true' }, { type: 'value', value: 'false' });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [node], edges: [] }));
      expect(result.current.localVars.ternResult).toBe(true);
    });

    it('should parse boolean false from trueValue', () => {
      const node = makeTernaryNode({ type: 'value', value: 'false' }, { type: 'value', value: 'true' });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [node], edges: [] }));
      expect(result.current.localVars.ternResult).toBe(false);
    });

    it('should parse null from trueValue', () => {
      const node = makeTernaryNode({ type: 'value', value: 'null' }, { type: 'value', value: 'fallback' });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [node], edges: [] }));
      expect(result.current.localVars.ternResult).toBeNull();
    });

    it('should strip single quotes from trueValue', () => {
      const node = makeTernaryNode({ type: 'value', value: "'hello'" }, { type: 'value', value: "'world'" });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [node], edges: [] }));
      expect(result.current.localVars.ternResult).toBe('hello');
    });

    it('should strip double quotes from trueValue', () => {
      const node = makeTernaryNode({ type: 'value', value: '"quoted"' }, { type: 'value', value: '"other"' });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [node], edges: [] }));
      expect(result.current.localVars.ternResult).toBe('quoted');
    });

    it('should return unquoted string as-is from trueValue', () => {
      const node = makeTernaryNode({ type: 'value', value: 'plainText' }, { type: 'value', value: 'other' });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [node], edges: [] }));
      expect(result.current.localVars.ternResult).toBe('plainText');
    });

    it('should resolve {{ localVar }} from trueValue via localVars', () => {
      const setVarNode: Node = {
        id: 'sn',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: { nodeType: 'SetVariable', params: { name: 'myVar', value: 'resolvedValue' } },
      };
      const ternNode = makeTernaryNode(
        { type: 'value', value: '{{ myVar }}' },
        { type: 'value', value: 'fallback' }
      );
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: [setVarNode, ternNode], edges: [] })
      );
      expect(result.current.localVars.ternResult).toBe('resolvedValue');
    });

    it('should resolve {{ RuleRequest.field }} from trueValue via globalVarsData', () => {
      const ternNode = makeTernaryNode(
        { type: 'value', value: '{{ RuleRequest.id }}' },
        { type: 'value', value: 'fallback' }
      );
      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: [ternNode],
          edges: [],
          globalVarsData: { RuleRequest: { id: 'global-123' } },
        })
      );
      expect(result.current.localVars.ternResult).toBe('global-123');
    });

    it('should use || {} fallback when globalVarsData keys are missing', () => {
      const ternNode = makeTernaryNode(
        { type: 'value', value: '{{ RuleRequest.id }}' },
        { type: 'value', value: 'fallback' }
      );
      const { result } = renderHook(() =>
        useLocalVariables({
          allNodes: [ternNode],
          edges: [],
          // globalVarsData with no RuleRequest key → triggers `globalVarsData.RuleRequest || {}`
          globalVarsData: {},
        })
      );
      // RuleRequest.id won't resolve since RuleRequest is absent → returns template or fallback
      expect(result.current.localVars.ternResult).toBe('{{ RuleRequest.id }}');
    });

    it('should return original template when var reference is not resolved', () => {
      const ternNode = makeTernaryNode(
        { type: 'value', value: '{{ unknownVar }}' },
        { type: 'value', value: 'fallback' }
      );
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: [ternNode], edges: [] })
      );
      expect(result.current.localVars.ternResult).toBe('{{ unknownVar }}');
    });

    it('should use falseValue when trueValue is empty', () => {
      const node = makeTernaryNode({ type: 'value', value: '' }, { type: 'value', value: 'fromFalse' });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [node], edges: [] }));
      expect(result.current.localVars.ternResult).toBe('fromFalse');
    });

    it('should use falseValue literal number when trueValue is empty', () => {
      const node = makeTernaryNode({ type: 'value', value: '' }, { type: 'value', value: '99' });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [node], edges: [] }));
      expect(result.current.localVars.ternResult).toBe(99);
    });

    it('should set <any> when both trueValue and falseValue are empty', () => {
      const node = makeTernaryNode({ type: 'value', value: '' }, { type: 'value', value: '' });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [node], edges: [] }));
      expect(result.current.localVars.ternResult).toBe('<any>');
    });

    it('should resolve nested trueValue by recursing into nested.trueValue', () => {
      const ternNode: Node = {
        id: 'ternary-1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'Ternary',
          params: {
            storeResult: 'true',
            resultVar: 'ternResult',
            ternaryTree: JSON.stringify({
              condition: 'outer',
              trueValue: {
                type: 'nested',
                nested: {
                  condition: 'inner',
                  trueValue: { type: 'value', value: 'deepValue' },
                  falseValue: { type: 'value', value: 'deepFalse' },
                },
              },
              falseValue: { type: 'value', value: 'outerFalse' },
            }),
          },
        },
      };
      const { result } = renderHook(() => useLocalVariables({ allNodes: [ternNode], edges: [] }));
      expect(result.current.localVars.ternResult).toBe('deepValue');
    });

    it('should return undefined for nested branch without nested property', () => {
      const ternNode: Node = {
        id: 'ternary-1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'Ternary',
          params: {
            storeResult: 'true',
            resultVar: 'ternResult',
            ternaryTree: JSON.stringify({
              condition: 'x',
              trueValue: { type: 'nested' }, // nested property missing
              falseValue: { type: 'value', value: 'fallback' },
            }),
          },
        },
      };
      const { result } = renderHook(() => useLocalVariables({ allNodes: [ternNode], edges: [] }));
      expect(result.current.localVars.ternResult).toBe('fallback');
    });

    it('should set <any> when no ternaryTree', () => {
      const ternNode: Node = {
        id: 'ternary-1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'Ternary',
          params: { storeResult: 'true', resultVar: 'ternResult' },
        },
      };
      const { result } = renderHook(() => useLocalVariables({ allNodes: [ternNode], edges: [] }));
      expect(result.current.localVars.ternResult).toBe('<any>');
    });

    it('should set <any> when ternaryTree is invalid JSON', () => {
      const ternNode: Node = {
        id: 'ternary-1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'Ternary',
          params: {
            storeResult: 'true',
            resultVar: 'ternResult',
            ternaryTree: 'INVALID_JSON{',
          },
        },
      };
      const { result } = renderHook(() => useLocalVariables({ allNodes: [ternNode], edges: [] }));
      expect(result.current.localVars.ternResult).toBe('<any>');
    });

    it('should skip Ternary when storeResult is "false"', () => {
      const ternNode: Node = {
        id: 'ternary-1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'Ternary',
          params: {
            storeResult: 'false',
            resultVar: 'ternResult',
            ternaryTree: JSON.stringify({
              condition: 'x',
              trueValue: { type: 'value', value: '42' },
              falseValue: { type: 'value', value: '0' },
            }),
          },
        },
      };
      const { result } = renderHook(() => useLocalVariables({ allNodes: [ternNode], edges: [] }));
      expect(result.current.localVars.ternResult).toBeUndefined();
    });

    it('should skip Ternary when there is no resultVar', () => {
      const ternNode: Node = {
        id: 'ternary-1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'Ternary',
          params: {
            storeResult: 'true',
            ternaryTree: JSON.stringify({
              condition: 'x',
              trueValue: { type: 'value', value: '42' },
              falseValue: { type: 'value', value: '0' },
            }),
          },
        },
      };
      const { result } = renderHook(() => useLocalVariables({ allNodes: [ternNode], edges: [] }));
      expect(Object.keys(result.current.localVars)).toHaveLength(0);
    });

    it('should handle Ternary node with no params at all', () => {
      const ternNode: Node = {
        id: 'ternary-no-params',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: { nodeType: 'Ternary' }, // no params property
      };
      const { result } = renderHook(() => useLocalVariables({ allNodes: [ternNode], edges: [] }));
      // storeResult=true but resultVar=undefined → skip; no vars set
      expect(result.current.localVars).toEqual({});
    });
  });

  describe('Loop Vars from parentLoops', () => {
    const makeLoopNode = (label?: string, params: Record<string, string> = {}): Node => ({
      id: 'loop-1',
      type: 'editableNode',
      position: { x: 0, y: 0 },
      data: { nodeType: 'Loop', label, params },
    });

    it('should fall back to "Loop N" label when no label on loop node', () => {
      mockedUseNodeScope.mockReturnValue({
        parentLoops: [
          {
            loopNode: makeLoopNode(undefined, { resultVariable: 'r' }),
            arrayVariable: 'arr',
            itemVariable: '',
            indexVariable: '',
            loopType: 'for',
          },
        ],
        isInLoopScope: true,
      });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [], edges: [] }));
      expect(result.current.loopContext.loopNames).toContain('Loop 1');
    });

    it('should populate loopVars itemVariable when non-empty', () => {
      mockedUseNodeScope.mockReturnValue({
        parentLoops: [
          {
            loopNode: makeLoopNode('MyLoop'),
            arrayVariable: 'myArray',
            itemVariable: 'item',
            indexVariable: '',
            loopType: 'for',
          },
        ],
        isInLoopScope: true,
      });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [], edges: [] }));
      expect(result.current.loopVars.item).toBe('<item from myArray>');
    });

    it('should skip itemVariable when it is empty string', () => {
      mockedUseNodeScope.mockReturnValue({
        parentLoops: [
          {
            loopNode: makeLoopNode('MyLoop'),
            arrayVariable: 'myArray',
            itemVariable: '',
            indexVariable: '',
            loopType: 'for',
          },
        ],
        isInLoopScope: true,
      });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [], edges: [] }));
      expect(result.current.loopVars).not.toHaveProperty('');
    });

    it('should populate loopVars indexVariable when non-empty', () => {
      mockedUseNodeScope.mockReturnValue({
        parentLoops: [
          {
            loopNode: makeLoopNode('MyLoop'),
            arrayVariable: 'myArray',
            itemVariable: '',
            indexVariable: 'idx',
            loopType: 'for',
          },
        ],
        isInLoopScope: true,
      });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [], edges: [] }));
      expect(result.current.loopVars.idx).toBe('<number>');
    });

    it('should skip indexVariable when it is empty string', () => {
      mockedUseNodeScope.mockReturnValue({
        parentLoops: [
          {
            loopNode: makeLoopNode('MyLoop'),
            arrayVariable: 'myArray',
            itemVariable: '',
            indexVariable: '',
            loopType: 'for',
          },
        ],
        isInLoopScope: true,
      });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [], edges: [] }));
      expect(result.current.loopVars).not.toHaveProperty('idx');
    });

    it('should populate loopVars arrayVariable as <array>', () => {
      mockedUseNodeScope.mockReturnValue({
        parentLoops: [
          {
            loopNode: makeLoopNode('MyLoop'),
            arrayVariable: 'myArray',
            itemVariable: '',
            indexVariable: '',
            loopType: 'for',
          },
        ],
        isInLoopScope: true,
      });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [], edges: [] }));
      expect(result.current.loopVars.myArray).toBe('<array>');
    });

    it('should set loopVars resultVariable for loopType "map"', () => {
      mockedUseNodeScope.mockReturnValue({
        parentLoops: [
          {
            loopNode: makeLoopNode('MapLoop', { resultVariable: 'mapped' }),
            arrayVariable: 'src',
            itemVariable: '',
            indexVariable: '',
            loopType: 'map',
          },
        ],
        isInLoopScope: true,
      });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [], edges: [] }));
      expect(result.current.loopVars.mapped).toBe('<array>');
    });

    it('should set loopVars resultVariable for loopType "filter"', () => {
      mockedUseNodeScope.mockReturnValue({
        parentLoops: [
          {
            loopNode: makeLoopNode('FilterLoop', { resultVariable: 'filtered' }),
            arrayVariable: 'src',
            itemVariable: '',
            indexVariable: '',
            loopType: 'filter',
          },
        ],
        isInLoopScope: true,
      });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [], edges: [] }));
      expect(result.current.loopVars.filtered).toBe('<array>');
    });

    it('should not set loopVars resultVariable when loopType is map but no resultVariable in params', () => {
      mockedUseNodeScope.mockReturnValue({
        parentLoops: [
          {
            loopNode: makeLoopNode('MapLoop', {}), // no resultVariable in params
            arrayVariable: 'src',
            itemVariable: '',
            indexVariable: '',
            loopType: 'map',
          },
        ],
        isInLoopScope: true,
      });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [], edges: [] }));
      expect(result.current.loopVars).not.toHaveProperty('resultVariable');
    });

    it('should not set loopVars arrayVariable when it is falsy', () => {
      mockedUseNodeScope.mockReturnValue({
        parentLoops: [
          {
            loopNode: makeLoopNode('MyLoop'),
            arrayVariable: '',
            itemVariable: '',
            indexVariable: '',
            loopType: 'for',
          },
        ],
        isInLoopScope: true,
      });
      const { result } = renderHook(() => useLocalVariables({ allNodes: [], edges: [] }));
      expect(result.current.loopVars).toEqual({});
    });
  });

  describe('getNestedValue (via template resolution)', () => {
    it('should resolve array indexing path like RuleRequest.items[0]', () => {
      const globalVarsData = {
        RuleRequest: { items: ['first', 'second', 'third'] },
      };
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: { name: 'indexed', value: '{{ RuleRequest.items[0] }}' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [], globalVarsData })
      );
      expect(result.current.localVars.indexed).toBe('first');
    });

    it('should handle array index syntax when value at key is not an array', () => {
      const globalVarsData = {
        RuleRequest: { scalar: 'notAnArray' },
      };
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: { name: 'badIndex', value: '{{ RuleRequest.scalar[0] }}' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [], globalVarsData })
      );
      // Falls through: current remains 'notAnArray' (non-array, index not applied)
      expect(result.current.localVars.badIndex).toBe('notAnArray');
    });

    it('should return original match when nested path does not exist', () => {
      const globalVarsData = {
        RuleRequest: { id: '1' },
      };
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: { name: 'missing', value: '{{ RuleRequest.nonExistent.deep }}' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [], globalVarsData })
      );
      // Path doesn't exist, returns original match
      expect(result.current.localVars.missing).toBe('{{ RuleRequest.nonExistent.deep }}');
    });
  });

  describe('resolveTemplateVariables advanced cases', () => {
    it('should return value unchanged when it has no {{ brackets', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: { name: 'plain', value: 'justAString' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars.plain).toBe('justAString');
    });

    it('should keep original match when template var is unresolved', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: { name: 'unresolved', value: '{{ noSuchVar }}' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars.unresolved).toBe('{{ noSuchVar }}');
    });

    it('should not substitute localVar values starting with "<"', () => {
      // FetchDB sets result to '{ }', math sets to '<number>'
      // A referencing SetVariable should keep the original template
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'math', params: { resultVar: 'mathVal' } },
        },
        {
          id: '2',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: { name: 'refMath', value: '{{ mathVal }}' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      // '<number>' starts with '<' so it is not substituted; template kept
      expect(result.current.localVars.refMath).toBe('{{ mathVal }}');
    });

    it('should not substitute FetchDB "{ }" placeholder values', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'FetchDB', params: { resultVar: 'dbObj' } },
        },
        {
          id: '2',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: { name: 'refDb', value: '{{ dbObj }}' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      // '{ }' equals the '{ }' guard, so it is not substituted
      expect(result.current.localVars.refDb).toBe('{{ dbObj }}');
    });

    it('should recursively resolve a localVar that itself contains a template', () => {
      // Node A sets innerVar = '{{ unresolved }}' (unresolved at A's time)
      // Node B sets outerVar = '{{ innerVar }}'
      // When B is processed, innerVar is in localVars as '{{ unresolved }}'
      // resolveTemplateVariables detects nested template → recurses
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: { name: 'innerVar', value: '{{ unresolvedRef }}' },
          },
        },
        {
          id: '2',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: { name: 'outerVar', value: '{{ innerVar }}' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      // innerVar = '{{ unresolvedRef }}', outerVar resolves innerVar recursively → '{{ unresolvedRef }}'
      expect(result.current.localVars.outerVar).toBe('{{ unresolvedRef }}');
    });

    it('should return plain localVar value directly without recursion', () => {
      // Node A: plainVar = "hello" (plain string)
      // Node B: refVar = "{{ plainVar }}" → should resolve to "hello" via localVars non-recursive path
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: { name: 'plainVar', value: 'hello' },
          },
        },
        {
          id: '2',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'SetVariable',
            params: { name: 'refVar', value: '{{ plainVar }}' },
          },
        },
      ];
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: nodes, edges: [] })
      );
      expect(result.current.localVars.refVar).toBe('hello');
    });

    it('should stop recursion when depth exceeds 10', () => {
      // Create a 12-level chain: v1 → v2 → ... → v11 → v12 (depth-11 call hits the guard)
      const chainNodes: Node[] = Array.from({ length: 11 }, (_, i) => ({
        id: `chain-${i + 1}`,
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'SetVariable',
          params: { name: `cv${i + 1}`, value: `{{ cv${i + 2} }}` },
        },
      }));
      // The triggering node that kicks off the chain
      const triggerNode: Node = {
        id: 'trigger',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'SetVariable',
          params: { name: 'deepVar', value: '{{ cv1 }}' },
        },
      };
      const { result } = renderHook(() =>
        useLocalVariables({ allNodes: [...chainNodes, triggerNode], edges: [] })
      );
      // After hitting depth > 10 the raw template is returned, so deepVar is some {{ cvN }} string
      expect(typeof result.current.localVars.deepVar).toBe('string');
      expect((result.current.localVars.deepVar as string).includes('{{')).toBe(true);
    });
  });
});

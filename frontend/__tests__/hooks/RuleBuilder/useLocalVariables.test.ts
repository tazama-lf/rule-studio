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
});

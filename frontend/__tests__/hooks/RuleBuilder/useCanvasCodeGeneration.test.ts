import { renderHook, act } from '@testing-library/react';
import { useCanvasCodeGeneration } from '../../../src/hooks/RuleBuilder/useCanvasCodeGeneration';
import * as helpers from '../../../src/utils/Common/helpers';
import * as codeGenerator from '../../../src/utils/Flow/CodeGenerator';
import type { Node, Edge } from '@xyflow/react';

jest.mock('../../../src/utils/Common/helpers');
jest.mock('../../../src/utils/Flow/CodeGenerator');

const mockedHelpers = helpers as jest.Mocked<typeof helpers>;
const mockedCodeGenerator = codeGenerator as jest.Mocked<typeof codeGenerator>;

describe('useCanvasCodeGeneration', () => {
  const mockNodes: Node[] = [
    {
      id: '1',
      type: 'editableNode',
      position: { x: 100, y: 100 },
      data: {
        nodeType: 'Start',
        label: 'Start Node',
        params: { key1: 'value1' },
      },
    },
    {
      id: '2',
      type: 'editableNode',
      position: { x: 200, y: 200 },
      data: {
        nodeType: 'SetVariable',
        label: 'Set Var',
        params: { name: 'x', value: '10' },
      },
    },
  ];

  const mockEdges: Edge[] = [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      sourceHandle: null,
      targetHandle: null,
    },
  ];

  const mockNestedCanvasData = {};

  beforeEach(() => {
    jest.clearAllMocks();
    mockedHelpers.sortNodesInFlowOrder.mockReturnValue(mockNodes);
    mockedCodeGenerator.generateTypeScriptCode.mockReturnValue('// Generated TypeScript Code');
    mockedCodeGenerator.generateTestCaseCode.mockReturnValue('// Generated Test Case Code');
  });

  describe('Initialization', () => {
    it('should initialize with default mode as rule-builder', () => {
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: mockNodes,
          edges: mockEdges,
          nestedCanvasData: mockNestedCanvasData,
        })
      );

      expect(result.current).toBeDefined();
      expect(typeof result.current.generateJson).toBe('function');
      expect(typeof result.current.generateCode).toBe('function');
    });

    it('should accept custom mode', () => {
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: mockNodes,
          edges: mockEdges,
          nestedCanvasData: mockNestedCanvasData,
          mode: 'test-case-generate',
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('generateJson', () => {
    it('should generate JSON from nodes and edges', () => {
      const onJsonGenerate = jest.fn();
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: mockNodes,
          edges: mockEdges,
          nestedCanvasData: mockNestedCanvasData,
          onJsonGenerate,
        })
      );

      act(() => {
        result.current.generateJson();
      });

      expect(onJsonGenerate).toHaveBeenCalled();
      const jsonArg = onJsonGenerate.mock.calls[0][0];
      expect(typeof jsonArg).toBe('string');
      const parsed = JSON.parse(jsonArg);
      expect(parsed).toHaveProperty('nodes');
      expect(parsed).toHaveProperty('edges');
    });

    it('should include node type and label in generated JSON', () => {
      const onJsonGenerate = jest.fn();
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: mockNodes,
          edges: mockEdges,
          nestedCanvasData: mockNestedCanvasData,
          onJsonGenerate,
        })
      );

      act(() => {
        result.current.generateJson();
      });

      const jsonArg = onJsonGenerate.mock.calls[0][0];
      const parsed = JSON.parse(jsonArg);
      expect(parsed.nodes[0]).toMatchObject({
        id: '1',
        type: 'Start',
        label: 'Start Node',
      });
    });

    it('should include node params in generated JSON', () => {
      const onJsonGenerate = jest.fn();
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: mockNodes,
          edges: mockEdges,
          nestedCanvasData: mockNestedCanvasData,
          onJsonGenerate,
        })
      );

      act(() => {
        result.current.generateJson();
      });

      const jsonArg = onJsonGenerate.mock.calls[0][0];
      const parsed = JSON.parse(jsonArg);
      expect(parsed.nodes[0].params).toEqual({ key1: 'value1' });
    });

    it('should include mode if present in node data', () => {
      const nodesWithMode: Node[] = [
        {
          ...mockNodes[0],
          data: {
            ...mockNodes[0].data,
            mode: 'async',
          },
        },
      ];

      const onJsonGenerate = jest.fn();
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: nodesWithMode,
          edges: [],
          nestedCanvasData: mockNestedCanvasData,
          onJsonGenerate,
        })
      );

      act(() => {
        result.current.generateJson();
      });

      const jsonArg = onJsonGenerate.mock.calls[0][0];
      const parsed = JSON.parse(jsonArg);
      expect(parsed.nodes[0].mode).toBe('async');
    });

    it('should include generation_type if present', () => {
      const nodesWithGenType: Node[] = [
        {
          ...mockNodes[0],
          data: {
            ...mockNodes[0].data,
            generation_type: 'function',
          },
        },
      ];

      const onJsonGenerate = jest.fn();
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: nodesWithGenType,
          edges: [],
          nestedCanvasData: mockNestedCanvasData,
          onJsonGenerate,
        })
      );

      act(() => {
        result.current.generateJson();
      });

      const jsonArg = onJsonGenerate.mock.calls[0][0];
      const parsed = JSON.parse(jsonArg);
      expect(parsed.nodes[0].generation_type).toBe('function');
    });

    it('should include function_name if present', () => {
      const nodesWithFuncName: Node[] = [
        {
          ...mockNodes[0],
          data: {
            ...mockNodes[0].data,
            function_name: 'myFunction',
          },
        },
      ];

      const onJsonGenerate = jest.fn();
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: nodesWithFuncName,
          edges: [],
          nestedCanvasData: mockNestedCanvasData,
          onJsonGenerate,
        })
      );

      act(() => {
        result.current.generateJson();
      });

      const jsonArg = onJsonGenerate.mock.calls[0][0];
      const parsed = JSON.parse(jsonArg);
      expect(parsed.nodes[0].function_name).toBe('myFunction');
    });

    it('should handle nested canvas data for HandleTransaction nodes', () => {
      const nestedNodes: Node[] = [
        {
          id: 'nested-1',
          type: 'editableNode',
          position: { x: 50, y: 50 },
          data: {
            nodeType: 'NestedNode',
            label: 'Nested',
            params: {},
          },
        },
      ];

      const nestedEdges: Edge[] = [];

      const handleTransactionNode: Node[] = [
        {
          id: 'ht-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: {
            nodeType: 'HandleTransaction',
            label: 'Handle Transaction',
            params: {},
          },
        },
      ];

      const nestedData = {
        'ht-1': { nodes: nestedNodes, edges: nestedEdges },
      };

      mockedHelpers.sortNodesInFlowOrder.mockReturnValue(nestedNodes);

      const onJsonGenerate = jest.fn();
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: handleTransactionNode,
          edges: [],
          nestedCanvasData: nestedData,
          onJsonGenerate,
        })
      );

      act(() => {
        result.current.generateJson();
      });

      expect(mockedHelpers.sortNodesInFlowOrder).toHaveBeenCalledWith(nestedNodes, nestedEdges);
      const jsonArg = onJsonGenerate.mock.calls[0][0];
      const parsed = JSON.parse(jsonArg);
      expect(parsed.nodes[0]).toHaveProperty('nestedFlow');
      expect(parsed.nodes[0].nestedFlow.nodes).toHaveLength(1);
    });

    it('should handle edges with source and target', () => {
      const onJsonGenerate = jest.fn();
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: mockNodes,
          edges: mockEdges,
          nestedCanvasData: mockNestedCanvasData,
          onJsonGenerate,
        })
      );

      act(() => {
        result.current.generateJson();
      });

      const jsonArg = onJsonGenerate.mock.calls[0][0];
      const parsed = JSON.parse(jsonArg);
      expect(parsed.edges[0]).toMatchObject({
        id: 'e1-2',
        source: '1',
        target: '2',
      });
    });

    it('should handle edges with handles', () => {
      const edgesWithHandles: Edge[] = [
        {
          id: 'e1',
          source: '1',
          target: '2',
          sourceHandle: 'output-1',
          targetHandle: 'input-1',
        },
      ];

      const onJsonGenerate = jest.fn();
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: mockNodes,
          edges: edgesWithHandles,
          nestedCanvasData: mockNestedCanvasData,
          onJsonGenerate,
        })
      );

      act(() => {
        result.current.generateJson();
      });

      const jsonArg = onJsonGenerate.mock.calls[0][0];
      const parsed = JSON.parse(jsonArg);
      expect(parsed.edges[0].sourceHandle).toBe('output-1');
      expect(parsed.edges[0].targetHandle).toBe('input-1');
    });

    it('should handle empty nodes array', () => {
      const onJsonGenerate = jest.fn();
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: [],
          edges: [],
          nestedCanvasData: mockNestedCanvasData,
          onJsonGenerate,
        })
      );

      act(() => {
        result.current.generateJson();
      });

      const jsonArg = onJsonGenerate.mock.calls[0][0];
      const parsed = JSON.parse(jsonArg);
      expect(parsed.nodes).toHaveLength(0);
      expect(parsed.edges).toHaveLength(0);
    });
  });

  describe('generateCode', () => {
    it('should call generateTypeScriptCode in rule-builder mode', () => {
      const onCodeGenerate = jest.fn();
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: mockNodes,
          edges: mockEdges,
          nestedCanvasData: mockNestedCanvasData,
          onCodeGenerate,
          mode: 'rule-builder',
        })
      );

      act(() => {
        result.current.generateCode();
      });

      expect(mockedCodeGenerator.generateTypeScriptCode).toHaveBeenCalled();
      expect(onCodeGenerate).toHaveBeenCalledWith('// Generated TypeScript Code');
    });

    it('should call generateTestCaseCode in test-case-generate mode', () => {
      const onCodeGenerate = jest.fn();
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: mockNodes,
          edges: mockEdges,
          nestedCanvasData: mockNestedCanvasData,
          onCodeGenerate,
          mode: 'test-case-generate',
        })
      );

      act(() => {
        result.current.generateCode();
      });

      expect(mockedCodeGenerator.generateTestCaseCode).toHaveBeenCalled();
      expect(onCodeGenerate).toHaveBeenCalledWith('// Generated Test Case Code');
    });

    it('should work without onCodeGenerate callback', () => {
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: mockNodes,
          edges: mockEdges,
          nestedCanvasData: mockNestedCanvasData,
        })
      );

      expect(() => {
        act(() => {
          result.current.generateCode();
        });
      }).not.toThrow();
    });
  });

  describe('Callback Stability', () => {
    it('should maintain generateJson function stability when dependencies do not change', () => {
      const { result, rerender } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: mockNodes,
          edges: mockEdges,
          nestedCanvasData: mockNestedCanvasData,
        })
      );

      const firstGenerate = result.current.generateJson;
      rerender();

      expect(result.current.generateJson).toBe(firstGenerate);
    });

    it('should update generateJson when nodes change', () => {
      const { result, rerender } = renderHook(
        ({ nodes }) =>
          useCanvasCodeGeneration({
            nodes,
            edges: mockEdges,
            nestedCanvasData: mockNestedCanvasData,
          }),
        { initialProps: { nodes: mockNodes } }
      );

      const firstGenerate = result.current.generateJson;

      const newNodes = [...mockNodes, {
        id: '3',
        type: 'editableNode',
        position: { x: 300, y: 300 },
        data: {
          nodeType: 'End',
          label: 'End Node',
          params: {},
        },
      }];

      rerender({ nodes: newNodes });

      expect(result.current.generateJson).not.toBe(firstGenerate);
    });
  });

  describe('Edge Cases', () => {
    it('should handle nodes with missing params', () => {
      const nodesWithoutParams: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: {
            nodeType: 'Start',
            label: 'Start',
          },
        },
      ];

      const onJsonGenerate = jest.fn();
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: nodesWithoutParams,
          edges: [],
          nestedCanvasData: mockNestedCanvasData,
          onJsonGenerate,
        })
      );

      act(() => {
        result.current.generateJson();
      });

      const jsonArg = onJsonGenerate.mock.calls[0][0];
      const parsed = JSON.parse(jsonArg);
      expect(parsed.nodes[0].params).toEqual({});
    });

    it('should handle edges with null handles', () => {
      const edgesWithNullHandles: Edge[] = [
        {
          id: 'e1',
          source: '1',
          target: '2',
          sourceHandle: null,
          targetHandle: null,
        },
      ];

      const onJsonGenerate = jest.fn();
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: mockNodes,
          edges: edgesWithNullHandles,
          nestedCanvasData: mockNestedCanvasData,
          onJsonGenerate,
        })
      );

      act(() => {
        result.current.generateJson();
      });

      const jsonArg = onJsonGenerate.mock.calls[0][0];
      const parsed = JSON.parse(jsonArg);
      expect(parsed.edges[0].sourceHandle).toBeNull();
      expect(parsed.edges[0].targetHandle).toBeNull();
    });

    it('should handle nested nodes with all optional fields', () => {
      const nestedNodes: Node[] = [
        {
          id: 'nested-1',
          type: 'editableNode',
          position: { x: 50, y: 50 },
          data: {
            nodeType: 'NestedNode',
            label: 'Nested',
            params: {},
            mode: 'async',
            generation_type: 'function',
            function_name: 'nestedFunc',
          },
        },
      ];

      const handleTransactionNode: Node[] = [
        {
          id: 'ht-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: {
            nodeType: 'HandleTransaction',
            label: 'Handle Transaction',
            params: {},
          },
        },
      ];

      const nestedData = {
        'ht-1': { nodes: nestedNodes, edges: [] },
      };

      mockedHelpers.sortNodesInFlowOrder.mockReturnValue(nestedNodes);

      const onJsonGenerate = jest.fn();
      const { result } = renderHook(() =>
        useCanvasCodeGeneration({
          nodes: handleTransactionNode,
          edges: [],
          nestedCanvasData: nestedData,
          onJsonGenerate,
        })
      );

      act(() => {
        result.current.generateJson();
      });

      const jsonArg = onJsonGenerate.mock.calls[0][0];
      const parsed = JSON.parse(jsonArg);
      const nestedNode = parsed.nodes[0].nestedFlow.nodes[0];
      expect(nestedNode.mode).toBe('async');
      expect(nestedNode.generation_type).toBe('function');
      expect(nestedNode.function_name).toBe('nestedFunc');
    });
  });
});

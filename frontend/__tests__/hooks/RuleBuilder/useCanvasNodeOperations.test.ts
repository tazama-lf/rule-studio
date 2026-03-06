import { renderHook, act } from '@testing-library/react';
import { useCanvasNodeOperations } from '../../../src/hooks/RuleBuilder/useCanvasNodeOperations';
import * as nodeTemplateService from '../../../src/utils/Flow/nodeTemplateService';
import * as flowDefaults from '../../../src/utils/Flow/FlowDefaults';
import { useValidationContext } from '../../../src/validation/context';
import type { Node, Edge } from '@xyflow/react';

jest.mock('../../../src/utils/Flow/nodeTemplateService');
jest.mock('../../../src/utils/Flow/FlowDefaults');
jest.mock('../../../src/validation/context');

const mockedTemplateService = nodeTemplateService as jest.Mocked<typeof nodeTemplateService>;
const mockedFlowDefaults = flowDefaults as jest.Mocked<typeof flowDefaults>;
const mockedUseValidationContext = useValidationContext as jest.MockedFunction<typeof useValidationContext>;

describe('useCanvasNodeOperations', () => {
  let mockSetNodes: jest.Mock;
  let mockSetEdges: jest.Mock;
  let mockSaveHistory: jest.Mock;
  let mockClearNodeErrors: jest.Mock;
  let nodeIdCounter = 0;

  beforeEach(() => {
    jest.clearAllMocks();
    nodeIdCounter = 0;
    
    mockSetNodes = jest.fn((updater) => {
      if (typeof updater === 'function') {
        return updater([]);
      }
    });
    mockSetEdges = jest.fn();
    mockSaveHistory = jest.fn();
    mockClearNodeErrors = jest.fn();

    mockedUseValidationContext.mockReturnValue({
      clearNodeErrors: mockClearNodeErrors,
    } as any);

    mockedFlowDefaults.generateNodeId.mockImplementation(() => {
      nodeIdCounter++;
      return `node-${nodeIdCounter}`;
    });

    mockedTemplateService.getNodeTemplate.mockReturnValue({
      type: 'TestNode',
      nodeType: 'TestNode',
      displayName: 'Test Node',
      inputs: [
        { key: 'param1', label: 'Param 1', type: 'text', defaultValue: 'default1' },
        { key: 'param2', label: 'Param 2', type: 'text', defaultValue: 'default2' },
      ],
      handles: { source: true, target: true },
    } as any);
  });

  describe('Initialization', () => {
    it('should return all expected functions', () => {
      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      expect(result.current).toBeDefined();
      expect(typeof result.current.createNodeFromTemplate).toBe('function');
      expect(typeof result.current.updateNode).toBe('function');
      expect(typeof result.current.deleteSelectedNodes).toBe('function');
      expect(typeof result.current.deleteSelectedEdges).toBe('function');
      expect(typeof result.current.clearSelections).toBe('function');
      expect(typeof result.current.isProtectedNode).toBe('function');
    });
  });

  describe('createNodeFromTemplate', () => {
    it('should create node with correct type and position', () => {
      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      act(() => {
        result.current.createNodeFromTemplate('TestNode', { x: 100, y: 200 });
      });

      expect(mockSaveHistory).toHaveBeenCalled();
      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockedFlowDefaults.generateNodeId).toHaveBeenCalled();
      expect(mockedTemplateService.getNodeTemplate).toHaveBeenCalledWith('TestNode', undefined);
    });

    it('should populate default params from template', () => {
      mockSetNodes.mockImplementation((updater) => {
        const nodes = updater([]);
        expect(nodes[0].data.params).toEqual({
          param1: 'default1',
          param2: 'default2',
        });
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      act(() => {
        result.current.createNodeFromTemplate('TestNode', { x: 100, y: 200 });
      });
    });

    it('should use template displayName as label', () => {
      mockSetNodes.mockImplementation((updater) => {
        const nodes = updater([]);
        expect(nodes[0].data.label).toBe('Test Node');
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      act(() => {
        result.current.createNodeFromTemplate('TestNode', { x: 100, y: 200 });
      });
    });

    it('should include mode if provided', () => {
      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      act(() => {
        result.current.createNodeFromTemplate('TestNode', { x: 100, y: 200 }, 'async');
      });

      expect(mockedTemplateService.getNodeTemplate).toHaveBeenCalledWith('TestNode', 'async');
    });

    it('should handle template with no inputs', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        type: 'SimpleNode',
        nodeType: 'SimpleNode',
        displayName: 'Simple',
      } as any);

      mockSetNodes.mockImplementation((updater) => {
        const nodes = updater([]);
        expect(nodes[0].data.params).toEqual({});
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      act(() => {
        result.current.createNodeFromTemplate('SimpleNode', { x: 100, y: 200 });
      });
    });

    it('should create onChange handler', () => {
      mockSetNodes.mockImplementation((updater) => {
        const nodes = updater([]);
        expect(typeof nodes[0].data.onChange).toBe('function');
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      act(() => {
        result.current.createNodeFromTemplate('TestNode', { x: 100, y: 200 });
      });
    });

    it('should create onParamChange handler', () => {
      mockSetNodes.mockImplementation((updater) => {
        const nodes = updater([]);
        expect(typeof nodes[0].data.onParamChange).toBe('function');
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      act(() => {
        result.current.createNodeFromTemplate('TestNode', { x: 100, y: 200 });
      });
    });
  });

  describe('updateNode', () => {
    it('should update node with provided updates', () => {
      const existingNodes: Node[] = [
        {
          id: 'node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Original', nodeType: 'TestNode', params: {} },
        },
      ];

      mockSetNodes.mockImplementation((updater) => {
        const nodes = updater(existingNodes);
        expect(nodes[0].data.label).toBe('Updated');
        expect(nodes[0].data.newField).toBe('newValue');
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      act(() => {
        result.current.updateNode('node-1', { label: 'Updated', newField: 'newValue' });
      });
    });

    it('should not modify other nodes', () => {
      const existingNodes: Node[] = [
        {
          id: 'node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 1', nodeType: 'Test' },
        },
        {
          id: 'node-2',
          type: 'editableNode',
          position: { x: 200, y: 200 },
          data: { label: 'Node 2', nodeType: 'Test' },
        },
      ];

      mockSetNodes.mockImplementation((updater) => {
        const nodes = updater(existingNodes);
        expect(nodes[0].data.label).toBe('Updated');
        expect(nodes[1].data.label).toBe('Node 2');
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      act(() => {
        result.current.updateNode('node-1', { label: 'Updated' });
      });
    });
  });

  describe('deleteSelectedNodes', () => {
    it('should delete selected deletable nodes', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'SetVariable', label: 'Var' },
          selected: true,
        },
        {
          id: '2',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { nodeType: 'If', label: 'If' },
          selected: false,
        },
      ];

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      const resultNodes = result.current.deleteSelectedNodes(nodes, [nodes[0]]);

      expect(resultNodes).toHaveLength(1);
      expect(resultNodes[0].id).toBe('2');
      expect(mockClearNodeErrors).toHaveBeenCalledWith('1');
    });

    it('should not delete Start node', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'Start', label: 'Start' },
          selected: true,
        },
      ];

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      const resultNodes = result.current.deleteSelectedNodes(nodes, [nodes[0]]);

      expect(resultNodes).toHaveLength(1);
      expect(mockClearNodeErrors).not.toHaveBeenCalled();
    });

    it('should not delete End node', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'End', label: 'End' },
          selected: true,
        },
      ];

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      const resultNodes = result.current.deleteSelectedNodes(nodes, [nodes[0]]);

      expect(resultNodes).toHaveLength(1);
      expect(mockClearNodeErrors).not.toHaveBeenCalled();
    });

    it('should not delete HandleTransaction node', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'HandleTransaction', label: 'Handle' },
          selected: true,
        },
      ];

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      const resultNodes = result.current.deleteSelectedNodes(nodes, [nodes[0]]);

      expect(resultNodes).toHaveLength(1);
      expect(mockClearNodeErrors).not.toHaveBeenCalled();
    });

    it('should remove connected edges when deleting node', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'SetVariable', label: 'Var' },
          selected: true,
        },
      ];

      mockSetEdges.mockImplementation((updater) => {
        const edges: Edge[] = [
          { id: 'e1', source: '1', target: '2' } as Edge,
          { id: 'e2', source: '2', target: '3' } as Edge,
        ];
        const result = updater(edges);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('e2');
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      result.current.deleteSelectedNodes(nodes, [nodes[0]]);

      expect(mockSetEdges).toHaveBeenCalled();
    });
  });

  describe('deleteSelectedEdges', () => {
    it('should delete selected edges', () => {
      const edges: Edge[] = [
        { id: 'e1', source: '1', target: '2', selected: true } as Edge,
        { id: 'e2', source: '2', target: '3', selected: false } as Edge,
      ];

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      const resultEdges = result.current.deleteSelectedEdges(edges);

      expect(resultEdges).toHaveLength(1);
      expect(resultEdges[0].id).toBe('e2');
    });

    it('should handle no selected edges', () => {
      const edges: Edge[] = [
        { id: 'e1', source: '1', target: '2', selected: false } as Edge,
        { id: 'e2', source: '2', target: '3', selected: false } as Edge,
      ];

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      const resultEdges = result.current.deleteSelectedEdges(edges);

      expect(resultEdges).toHaveLength(2);
    });
  });

  describe('clearSelections', () => {
    it('should clear all node selections', () => {
      mockSetNodes.mockImplementation((updater) => {
        const nodes: Node[] = [
          {
            id: '1',
            type: 'editableNode',
            position: { x: 0, y: 0 },
            data: {},
            selected: true,
          },
          {
            id: '2',
            type: 'editableNode',
            position: { x: 100, y: 100 },
            data: {},
            selected: true,
          },
        ];
        const result = updater(nodes);
        expect(result.every((n: Node) => n.selected === false)).toBe(true);
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      act(() => {
        result.current.clearSelections();
      });

      expect(mockSetNodes).toHaveBeenCalled();
    });

    it('should clear all edge selections', () => {
      mockSetEdges.mockImplementation((updater) => {
        const edges: Edge[] = [
          { id: 'e1', source: '1', target: '2', selected: true } as Edge,
          { id: 'e2', source: '2', target: '3', selected: true } as Edge,
        ];
        const result = updater(edges);
        expect(result.every((e: Edge) => e.selected === false)).toBe(true);
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      act(() => {
        result.current.clearSelections();
      });

      expect(mockSetEdges).toHaveBeenCalled();
    });
  });

  describe('isProtectedNode', () => {
    it('should return true for Start node', () => {
      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      const node: Node = {
        id: '1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: { nodeType: 'Start' },
      };

      expect(result.current.isProtectedNode(node)).toBe(true);
    });

    it('should return true for End node', () => {
      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      const node: Node = {
        id: '1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: { nodeType: 'End' },
      };

      expect(result.current.isProtectedNode(node)).toBe(true);
    });

    it('should return true for HandleTransaction node', () => {
      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      const node: Node = {
        id: '1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: { nodeType: 'HandleTransaction' },
      };

      expect(result.current.isProtectedNode(node)).toBe(true);
    });

    it('should return false for other nodes', () => {
      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      const node: Node = {
        id: '1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: { nodeType: 'SetVariable' },
      };

      expect(result.current.isProtectedNode(node)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selected nodes array', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'SetVariable' },
        },
      ];

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      const resultNodes = result.current.deleteSelectedNodes(nodes, []);

      expect(resultNodes).toHaveLength(1);
      expect(mockClearNodeErrors).not.toHaveBeenCalled();
    });

    it('should handle node with missing template', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue(undefined);

      mockSetNodes.mockImplementation((updater) => {
        const nodes = updater([]);
        expect(nodes[0].data.label).toBe('UnknownNode');
        expect(nodes[0].data.params).toEqual({});
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      act(() => {
        result.current.createNodeFromTemplate('UnknownNode', { x: 100, y: 200 });
      });
    });
  });
});

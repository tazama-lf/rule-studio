import { renderHook, act } from '@testing-library/react';
import { useCanvasNodeOperations } from '../../../src/hooks/RuleBuilder/useCanvasNodeOperations';
import * as nodeTemplateService from '../../../src/utils/Flow/nodeTemplateService';
import * as flowDefaults from '../../../src/utils/Flow/FlowDefaults';
import { useValidationContext } from '../../../src/validation/context';
import type { Node, Edge } from '@xyflow/react';

jest.mock('../../../src/utils/Flow/nodeTemplateService');
jest.mock('../../../src/utils/Flow/FlowDefaults');
jest.mock('../../../src/validation/context');
jest.mock('../../../src/utils/Flow/transformRuleRequest', () => ({
  transformRuleRequestToCode: jest.fn(() => 'mock-request-code'),
}));
jest.mock('../../../src/utils/Flow/transformRuleResult', () => ({
  transformRuleResultToCode: jest.fn(() => 'mock-result-code'),
}));

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

  describe('Factory Node Types', () => {
    afterEach(() => {
      delete (window as any).globalVariablesData;
    });

    describe('RuleConfigFactory', () => {
      it('should populate ruleConfigData when globalVariablesData has RuleConfig', () => {
        (window as any).globalVariablesData = { RuleConfig: { id: 'config-1', value: 'test' } };

        let capturedNode: any;
        mockSetNodes.mockImplementation((updater: any) => {
          if (typeof updater === 'function') {
            const nodes = updater([]);
            if (Array.isArray(nodes) && nodes.length > 0) {
              capturedNode = nodes[0];
            }
          }
        });

        const { result } = renderHook(() =>
          useCanvasNodeOperations({
            setNodes: mockSetNodes,
            saveHistory: mockSaveHistory,
            setEdges: mockSetEdges,
          })
        );

        act(() => {
          result.current.createNodeFromTemplate('RuleConfigFactory', { x: 100, y: 200 });
        });

        expect(capturedNode).toBeDefined();
        expect(capturedNode.data.params.ruleConfigData).toBe(
          JSON.stringify({ id: 'config-1', value: 'test' })
        );
      });

      it('should not set ruleConfigData when globalVariablesData has no RuleConfig property', () => {
        (window as any).globalVariablesData = { SomethingElse: {} };

        let capturedNode: any;
        mockSetNodes.mockImplementation((updater: any) => {
          if (typeof updater === 'function') {
            const nodes = updater([]);
            if (Array.isArray(nodes) && nodes.length > 0) {
              capturedNode = nodes[0];
            }
          }
        });

        const { result } = renderHook(() =>
          useCanvasNodeOperations({
            setNodes: mockSetNodes,
            saveHistory: mockSaveHistory,
            setEdges: mockSetEdges,
          })
        );

        act(() => {
          result.current.createNodeFromTemplate('RuleConfigFactory', { x: 100, y: 200 });
        });

        expect(capturedNode).toBeDefined();
        expect(capturedNode.data.params.ruleConfigData).toBeUndefined();
      });

      it('should skip RuleConfig population when globalVariablesData is absent', () => {
        let capturedNode: any;
        mockSetNodes.mockImplementation((updater: any) => {
          if (typeof updater === 'function') {
            const nodes = updater([]);
            if (Array.isArray(nodes) && nodes.length > 0) {
              capturedNode = nodes[0];
            }
          }
        });

        const { result } = renderHook(() =>
          useCanvasNodeOperations({
            setNodes: mockSetNodes,
            saveHistory: mockSaveHistory,
            setEdges: mockSetEdges,
          })
        );

        act(() => {
          result.current.createNodeFromTemplate('RuleConfigFactory', { x: 100, y: 200 });
        });

        expect(capturedNode).toBeDefined();
        expect(capturedNode.data.params.ruleConfigData).toBeUndefined();
      });
    });

    describe('RuleRequestFactory', () => {
      it('should call transformRuleRequestToCode and invoke setNodes twice when globalVariablesData has RuleRequest', async () => {
        (window as any).globalVariablesData = { RuleRequest: { id: 'req-1' } };

        mockSetNodes.mockImplementation((updater: any) => {
          if (typeof updater === 'function') {
            updater([{ id: 'node-1', type: 'editableNode', position: { x: 0, y: 0 }, data: { params: {} } }]);
          }
        });

        const { result } = renderHook(() =>
          useCanvasNodeOperations({
            setNodes: mockSetNodes,
            saveHistory: mockSaveHistory,
            setEdges: mockSetEdges,
          })
        );

        await act(async () => {
          result.current.createNodeFromTemplate('RuleRequestFactory', { x: 100, y: 200 });
          await Promise.resolve();
          await Promise.resolve();
        });

        expect(mockSetNodes).toHaveBeenCalledTimes(2);
      });

      it('should not call second setNodes when globalVariablesData has no RuleRequest', async () => {
        (window as any).globalVariablesData = { SomethingElse: {} };

        const { result } = renderHook(() =>
          useCanvasNodeOperations({
            setNodes: mockSetNodes,
            saveHistory: mockSaveHistory,
            setEdges: mockSetEdges,
          })
        );

        await act(async () => {
          result.current.createNodeFromTemplate('RuleRequestFactory', { x: 100, y: 200 });
          await Promise.resolve();
        });

        expect(mockSetNodes).toHaveBeenCalledTimes(1);
      });

      it('should skip RuleRequest branch when globalVariablesData is absent', async () => {
        const { result } = renderHook(() =>
          useCanvasNodeOperations({
            setNodes: mockSetNodes,
            saveHistory: mockSaveHistory,
            setEdges: mockSetEdges,
          })
        );

        await act(async () => {
          result.current.createNodeFromTemplate('RuleRequestFactory', { x: 100, y: 200 });
          await Promise.resolve();
        });

        expect(mockSetNodes).toHaveBeenCalledTimes(1);
      });
    });

    describe('RuleResultFactory', () => {
      it('should call transformRuleResultToCode with RuleResult and invoke setNodes twice', async () => {
        (window as any).globalVariablesData = { RuleResult: { id: '021@1.0.0', type: 'result' } };

        mockSetNodes.mockImplementation((updater: any) => {
          if (typeof updater === 'function') {
            updater([{ id: 'node-1', type: 'editableNode', position: { x: 0, y: 0 }, data: { params: {} } }]);
          }
        });

        const { result } = renderHook(() =>
          useCanvasNodeOperations({
            setNodes: mockSetNodes,
            saveHistory: mockSaveHistory,
            setEdges: mockSetEdges,
          })
        );

        await act(async () => {
          result.current.createNodeFromTemplate('RuleResultFactory', { x: 100, y: 200 });
          await Promise.resolve();
          await Promise.resolve();
        });

        expect(mockSetNodes).toHaveBeenCalledTimes(2);
      });

      it('should use default RuleResult when globalVariablesData exists but has no RuleResult key', async () => {
        (window as any).globalVariablesData = { SomethingElse: {} };

        mockSetNodes.mockImplementation((updater: any) => {
          if (typeof updater === 'function') {
            updater([{ id: 'node-1', type: 'editableNode', position: { x: 0, y: 0 }, data: { params: {} } }]);
          }
        });

        const { result } = renderHook(() =>
          useCanvasNodeOperations({
            setNodes: mockSetNodes,
            saveHistory: mockSaveHistory,
            setEdges: mockSetEdges,
          })
        );

        await act(async () => {
          result.current.createNodeFromTemplate('RuleResultFactory', { x: 100, y: 200 });
          await Promise.resolve();
          await Promise.resolve();
        });

        expect(mockSetNodes).toHaveBeenCalledTimes(2);
      });

      it('should use default RuleResult when globalVariablesData is absent', async () => {
        mockSetNodes.mockImplementation((updater: any) => {
          if (typeof updater === 'function') {
            updater([{ id: 'node-1', type: 'editableNode', position: { x: 0, y: 0 }, data: { params: {} } }]);
          }
        });

        const { result } = renderHook(() =>
          useCanvasNodeOperations({
            setNodes: mockSetNodes,
            saveHistory: mockSaveHistory,
            setEdges: mockSetEdges,
          })
        );

        await act(async () => {
          result.current.createNodeFromTemplate('RuleResultFactory', { x: 100, y: 200 });
          await Promise.resolve();
          await Promise.resolve();
        });

        expect(mockSetNodes).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Node Closure Handlers', () => {
    it('should update node label when onChange is invoked with matching node id', () => {
      let capturedNode: any;
      mockSetNodes.mockImplementation((updater: any) => {
        if (typeof updater === 'function') {
          const nodes = updater([]);
          if (Array.isArray(nodes) && nodes.length > 0) {
            capturedNode = nodes[0];
          }
        }
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

      expect(capturedNode).toBeDefined();
      expect(typeof capturedNode.data.onChange).toBe('function');

      const existingNodes: Node[] = [
        {
          id: capturedNode.id,
          type: 'editableNode',
          position: { x: 100, y: 200 },
          data: { label: 'Old Label', params: {}, nodeType: 'TestNode' },
        },
      ];

      let updatedNodes: Node[] | undefined;
      mockSetNodes.mockImplementation((updater: any) => {
        if (typeof updater === 'function') {
          updatedNodes = updater(existingNodes) as Node[];
        }
      });

      act(() => {
        capturedNode.data.onChange('New Label');
      });

      expect(updatedNodes).toBeDefined();
      expect(updatedNodes![0].data.label).toBe('New Label');
    });

    it('should leave non-matching nodes untouched in onChange closure', () => {
      let capturedNode: any;
      mockSetNodes.mockImplementation((updater: any) => {
        if (typeof updater === 'function') {
          const nodes = updater([]);
          if (Array.isArray(nodes) && nodes.length > 0) {
            capturedNode = nodes[0];
          }
        }
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

      expect(capturedNode).toBeDefined();

      const otherNode: Node = {
        id: 'other-node-99',
        type: 'editableNode',
        position: { x: 300, y: 300 },
        data: { label: 'Other Label', params: {}, nodeType: 'OtherNode' },
      };

      let updatedNodes: Node[] | undefined;
      mockSetNodes.mockImplementation((updater: any) => {
        if (typeof updater === 'function') {
          updatedNodes = updater([otherNode]) as Node[];
        }
      });

      act(() => {
        capturedNode.data.onChange('Attempted Label');
      });

      expect(updatedNodes).toBeDefined();
      expect(updatedNodes![0].data.label).toBe('Other Label');
    });

    it('should update node params when onParamChange is invoked with matching node id', () => {
      let capturedNode: any;
      mockSetNodes.mockImplementation((updater: any) => {
        if (typeof updater === 'function') {
          const nodes = updater([]);
          if (Array.isArray(nodes) && nodes.length > 0) {
            capturedNode = nodes[0];
          }
        }
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

      expect(capturedNode).toBeDefined();
      expect(typeof capturedNode.data.onParamChange).toBe('function');

      const existingNodes: Node[] = [
        {
          id: capturedNode.id,
          type: 'editableNode',
          position: { x: 100, y: 200 },
          data: {
            label: 'Test Node',
            params: { param1: 'old-value' },
            nodeType: 'TestNode',
          },
        },
      ];

      let updatedNodes: Node[] | undefined;
      mockSetNodes.mockImplementation((updater: any) => {
        if (typeof updater === 'function') {
          updatedNodes = updater(existingNodes) as Node[];
        }
      });

      act(() => {
        capturedNode.data.onParamChange('param1', 'new-value');
      });

      expect(updatedNodes).toBeDefined();
      expect((updatedNodes![0].data.params as any).param1).toBe('new-value');
    });

    it('should add new param key when onParamChange uses a new key', () => {
      let capturedNode: any;
      mockSetNodes.mockImplementation((updater: any) => {
        if (typeof updater === 'function') {
          const nodes = updater([]);
          if (Array.isArray(nodes) && nodes.length > 0) {
            capturedNode = nodes[0];
          }
        }
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

      expect(capturedNode).toBeDefined();

      const existingNodes: Node[] = [
        {
          id: capturedNode.id,
          type: 'editableNode',
          position: { x: 100, y: 200 },
          data: { label: 'Test Node', params: {}, nodeType: 'TestNode' },
        },
      ];

      let updatedNodes: Node[] | undefined;
      mockSetNodes.mockImplementation((updater: any) => {
        if (typeof updater === 'function') {
          updatedNodes = updater(existingNodes) as Node[];
        }
      });

      act(() => {
        capturedNode.data.onParamChange('newKey', 'newValue');
      });

      expect(updatedNodes).toBeDefined();
      expect((updatedNodes![0].data.params as any).newKey).toBe('newValue');
    });

    it('should leave non-matching nodes untouched in onParamChange closure', () => {
      let capturedNode: any;
      mockSetNodes.mockImplementation((updater: any) => {
        if (typeof updater === 'function') {
          const nodes = updater([]);
          if (Array.isArray(nodes) && nodes.length > 0) {
            capturedNode = nodes[0];
          }
        }
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

      expect(capturedNode).toBeDefined();

      const otherNode: Node = {
        id: 'other-node-99',
        type: 'editableNode',
        position: { x: 300, y: 300 },
        data: { label: 'Other', params: { someParam: 'unchanged' }, nodeType: 'OtherNode' },
      };

      let updatedNodes: Node[] | undefined;
      mockSetNodes.mockImplementation((updater: any) => {
        if (typeof updater === 'function') {
          updatedNodes = updater([otherNode]) as Node[];
        }
      });

      act(() => {
        capturedNode.data.onParamChange('someParam', 'changed');
      });

      expect(updatedNodes).toBeDefined();
      expect((updatedNodes![0].data.params as any).someParam).toBe('unchanged');
    });
  });

  describe('Error handling (catch blocks)', () => {
    afterEach(() => {
      delete (window as any).globalVariablesData;
    });

    it('should catch and log error when JSON.stringify throws in RuleConfigFactory', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const circular: any = {};
      circular.self = circular; // circular reference causes JSON.stringify to throw
      const obj: any = {};
      Object.defineProperty(obj, 'RuleConfig', {
        get() { return circular; },
        configurable: true,
      });
      (window as any).globalVariablesData = obj;

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      act(() => {
        result.current.createNodeFromTemplate('RuleConfigFactory', { x: 100, y: 200 });
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error auto-populating RuleConfig data:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should catch and log error when RuleRequest property getter throws', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const obj: any = {};
      Object.defineProperty(obj, 'RuleRequest', {
        get() { throw new Error('RuleRequest access error'); },
        configurable: true,
      });
      (window as any).globalVariablesData = obj;

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      act(() => {
        result.current.createNodeFromTemplate('RuleRequestFactory', { x: 100, y: 200 });
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error auto-populating RuleRequest data:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should catch and log error when RuleResult property getter throws', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const obj: any = {};
      Object.defineProperty(obj, 'RuleResult', {
        get() { throw new Error('RuleResult access error'); },
        configurable: true,
      });
      (window as any).globalVariablesData = obj;

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      act(() => {
        result.current.createNodeFromTemplate('RuleResultFactory', { x: 100, y: 200 });
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error auto-populating RuleResult data:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Dynamic import non-matching node branches', () => {
    afterEach(() => {
      delete (window as any).globalVariablesData;
    });

    it('should leave non-matching nodes untouched in RuleRequestFactory dynamic update', async () => {
      (window as any).globalVariablesData = { RuleRequest: { id: 'req-1' } };

      let callCount = 0;
      let secondCallResult: any;
      mockSetNodes.mockImplementation((updater: any) => {
        callCount++;
        if (typeof updater === 'function') {
          if (callCount === 1) {
            updater([]);
          } else {
            secondCallResult = updater([
              { id: 'different-id', type: 'editableNode', position: { x: 0, y: 0 }, data: { params: { existing: 'val' } } },
            ]);
          }
        }
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      await act(async () => {
        result.current.createNodeFromTemplate('RuleRequestFactory', { x: 100, y: 200 });
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(secondCallResult).toBeDefined();
      expect(secondCallResult[0].id).toBe('different-id');
      expect((secondCallResult[0].data.params as any).ruleRequestData).toBeUndefined();
    });

    it('should leave non-matching nodes untouched in RuleResultFactory with RuleResult dynamic update', async () => {
      (window as any).globalVariablesData = { RuleResult: { id: '021@1.0.0' } };

      let callCount = 0;
      let secondCallResult: any;
      mockSetNodes.mockImplementation((updater: any) => {
        callCount++;
        if (typeof updater === 'function') {
          if (callCount === 1) {
            updater([]);
          } else {
            secondCallResult = updater([
              { id: 'different-id', type: 'editableNode', position: { x: 0, y: 0 }, data: { params: {} } },
            ]);
          }
        }
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      await act(async () => {
        result.current.createNodeFromTemplate('RuleResultFactory', { x: 100, y: 200 });
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(secondCallResult).toBeDefined();
      expect(secondCallResult[0].id).toBe('different-id');
      expect((secondCallResult[0].data.params as any).ruleResultData).toBeUndefined();
    });

    it('should leave non-matching nodes untouched in RuleResultFactory default-result dynamic update', async () => {
      (window as any).globalVariablesData = { SomethingElse: {} };

      let callCount = 0;
      let secondCallResult: any;
      mockSetNodes.mockImplementation((updater: any) => {
        callCount++;
        if (typeof updater === 'function') {
          if (callCount === 1) {
            updater([]);
          } else {
            secondCallResult = updater([
              { id: 'different-id', type: 'editableNode', position: { x: 0, y: 0 }, data: { params: {} } },
            ]);
          }
        }
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      await act(async () => {
        result.current.createNodeFromTemplate('RuleResultFactory', { x: 100, y: 200 });
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(secondCallResult).toBeDefined();
      expect(secondCallResult[0].id).toBe('different-id');
      expect((secondCallResult[0].data.params as any).ruleResultData).toBeUndefined();
    });

    it('should leave non-matching nodes untouched in RuleResultFactory no-globalVars dynamic update', async () => {
      let callCount = 0;
      let secondCallResult: any;
      mockSetNodes.mockImplementation((updater: any) => {
        callCount++;
        if (typeof updater === 'function') {
          if (callCount === 1) {
            updater([]);
          } else {
            secondCallResult = updater([
              { id: 'different-id', type: 'editableNode', position: { x: 0, y: 0 }, data: { params: {} } },
            ]);
          }
        }
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      await act(async () => {
        result.current.createNodeFromTemplate('RuleResultFactory', { x: 100, y: 200 });
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(secondCallResult).toBeDefined();
      expect(secondCallResult[0].id).toBe('different-id');
      expect((secondCallResult[0].data.params as any).ruleResultData).toBeUndefined();
    });
  });

  describe('Fallback branch coverage', () => {
    afterEach(() => {
      delete (window as any).globalVariablesData;
    });

    it('should use empty string when template input has no defaultValue', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        type: 'NoDefaultNode',
        displayName: 'No Default',
        inputs: [
          { key: 'param1', label: 'Param 1', type: 'text' }, // no defaultValue property
        ],
      } as any);

      let capturedNode: any;
      mockSetNodes.mockImplementation((updater: any) => {
        if (typeof updater === 'function') {
          const nodes = updater([]);
          if (Array.isArray(nodes) && nodes.length > 0) {
            capturedNode = nodes[0];
          }
        }
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      act(() => {
        result.current.createNodeFromTemplate('NoDefaultNode', { x: 100, y: 200 });
      });

      expect(capturedNode.data.params.param1).toBe('');
    });

    it('should use empty object fallback when params is undefined in onParamChange', () => {
      let capturedNode: any;
      mockSetNodes.mockImplementation((updater: any) => {
        if (typeof updater === 'function') {
          const nodes = updater([]);
          if (Array.isArray(nodes) && nodes.length > 0) {
            capturedNode = nodes[0];
          }
        }
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

      expect(capturedNode).toBeDefined();

      const noParamsNodes: Node[] = [
        {
          id: capturedNode.id,
          type: 'editableNode',
          position: { x: 100, y: 200 },
          data: { label: 'Test', params: undefined as any, nodeType: 'TestNode' },
        },
      ];

      let updatedNodes: Node[] | undefined;
      mockSetNodes.mockImplementation((updater: any) => {
        if (typeof updater === 'function') {
          updatedNodes = updater(noParamsNodes) as Node[];
        }
      });

      act(() => {
        capturedNode.data.onParamChange('newKey', 'newValue');
      });

      expect(updatedNodes).toBeDefined();
      expect((updatedNodes![0].data.params as any).newKey).toBe('newValue');
    });

    it('should use empty object fallback when params is undefined in RuleRequestFactory dynamic update', async () => {
      (window as any).globalVariablesData = { RuleRequest: { id: 'req-1' } };

      let callCount = 0;
      let secondCallResult: any;
      mockSetNodes.mockImplementation((updater: any) => {
        callCount++;
        if (typeof updater === 'function') {
          if (callCount === 1) {
            updater([]);
          } else {
            secondCallResult = updater([
              { id: 'node-1', type: 'editableNode', position: { x: 0, y: 0 }, data: { params: undefined } },
            ]);
          }
        }
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      await act(async () => {
        result.current.createNodeFromTemplate('RuleRequestFactory', { x: 100, y: 200 });
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(secondCallResult).toBeDefined();
      expect(secondCallResult[0].data.params.ruleRequestData).toBe('mock-request-code');
    });

    it('should use empty object fallback when params is undefined in RuleResultFactory with RuleResult', async () => {
      (window as any).globalVariablesData = { RuleResult: { id: '021@1.0.0' } };

      let callCount = 0;
      let secondCallResult: any;
      mockSetNodes.mockImplementation((updater: any) => {
        callCount++;
        if (typeof updater === 'function') {
          if (callCount === 1) {
            updater([]);
          } else {
            secondCallResult = updater([
              { id: 'node-1', type: 'editableNode', position: { x: 0, y: 0 }, data: { params: undefined } },
            ]);
          }
        }
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      await act(async () => {
        result.current.createNodeFromTemplate('RuleResultFactory', { x: 100, y: 200 });
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(secondCallResult).toBeDefined();
      expect(secondCallResult[0].data.params.ruleResultData).toBe('mock-result-code');
    });

    it('should use empty object fallback when params is undefined in RuleResultFactory default path', async () => {
      (window as any).globalVariablesData = { SomethingElse: {} };

      let callCount = 0;
      let secondCallResult: any;
      mockSetNodes.mockImplementation((updater: any) => {
        callCount++;
        if (typeof updater === 'function') {
          if (callCount === 1) {
            updater([]);
          } else {
            secondCallResult = updater([
              { id: 'node-1', type: 'editableNode', position: { x: 0, y: 0 }, data: { params: undefined } },
            ]);
          }
        }
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      await act(async () => {
        result.current.createNodeFromTemplate('RuleResultFactory', { x: 100, y: 200 });
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(secondCallResult).toBeDefined();
      expect(secondCallResult[0].data.params.ruleResultData).toBe('mock-result-code');
    });

    it('should use empty object fallback when params is undefined in RuleResultFactory no-globalVars path', async () => {
      let callCount = 0;
      let secondCallResult: any;
      mockSetNodes.mockImplementation((updater: any) => {
        callCount++;
        if (typeof updater === 'function') {
          if (callCount === 1) {
            updater([]);
          } else {
            secondCallResult = updater([
              { id: 'node-1', type: 'editableNode', position: { x: 0, y: 0 }, data: { params: undefined } },
            ]);
          }
        }
      });

      const { result } = renderHook(() =>
        useCanvasNodeOperations({
          setNodes: mockSetNodes,
          saveHistory: mockSaveHistory,
          setEdges: mockSetEdges,
        })
      );

      await act(async () => {
        result.current.createNodeFromTemplate('RuleResultFactory', { x: 100, y: 200 });
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(secondCallResult).toBeDefined();
      expect(secondCallResult[0].data.params.ruleResultData).toBe('mock-result-code');
    });
  });
});

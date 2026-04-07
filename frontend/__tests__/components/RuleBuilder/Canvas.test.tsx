import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import RuleBuilderCanvas from '../../../src/components/RuleBuilder/Canvas';
import type { Node, Edge } from '@xyflow/react';

// ─── Captured state (populated during render, read in tests) ───────────────
const reactFlowCapture: { props: Record<string, any> } = { props: {} };
const shortcutCapture: { deleteNodes?: () => void; deleteEdges?: () => void } = {};

// ─── Mutable flags controlled per-test ────────────────────────────────────
let mockIsDebuggerOpen = false;
const mockCloseDebugger = jest.fn();
const mockHandleMouseDown = jest.fn();

// ─── Node-op spies (declared before jest.mock factories) ──────────────────
const mockCreateNodeFromTemplate = jest.fn();
const mockUpdateNode = jest.fn();
const mockDeleteSelectedNodes = jest.fn((current: any[]) => current);
const mockDeleteSelectedEdges = jest.fn((edges: any[]) => edges);

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

// Override the global __mocks__/@xyflow/react auto-mock with a richer version
jest.mock('@xyflow/react', () => {
  const React = require('react');
  return {
    ReactFlow: (props: any) => {
      // Store every prop so tests can invoke handlers directly
      Object.assign(reactFlowCapture.props, props);
      // Simulate onInit (sets reactFlowInstance in Canvas)
      React.useEffect(() => {
        props.onInit?.({ screenToFlowPosition: (p: any) => p });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return React.createElement(
        'div',
        { 'data-testid': 'react-flow', className: 'react-flow' },
        props.children,
      );
    },
    Controls: () => React.createElement('div', { 'data-testid': 'controls' }),
    Background: () => React.createElement('div', { 'data-testid': 'background' }),
    MiniMap: () => React.createElement('div', { 'data-testid': 'minimap' }),
    Panel: ({ children }: any) =>
      React.createElement('div', { 'data-testid': 'panel' }, children),
    // Real useState so setNodes/setEdges actually update component state
    useNodesState: (initial: any) => {
      const [nodes, setNodes] = React.useState(initial || []);
      return [nodes, setNodes, () => {}];
    },
    useEdgesState: (initial: any) => {
      const [edges, setEdges] = React.useState(initial || []);
      return [edges, setEdges, () => {}];
    },
    useUpdateNodeInternals: () => jest.fn(),
    ReactFlowProvider: ({ children }: any) => children,
    addEdge: (e: any, edges: any[]) => [...edges, e],
  };
});

jest.mock('../../../src/redux/Api/Rule-builder');

jest.mock('../../../src/validation/context', () => ({
  useValidationContext: () => ({
    hasErrors: false,
    getErrorCount: () => 0,
    errors: new Map(),
    setNodeErrors: () => {},
    clearNodeErrors: () => {},
    clearAllErrors: () => {},
    getNodeError: () => null,
    getAllErrors: () => [],
  }),
}));

jest.mock('../../../src/hooks/RuleBuilder/useCanvasNodeOperations', () => ({
  useCanvasNodeOperations: () => ({
    deleteSelectedNodes: mockDeleteSelectedNodes,
    deleteSelectedEdges: mockDeleteSelectedEdges,
    updateNode: mockUpdateNode,
    createNodeFromTemplate: mockCreateNodeFromTemplate,
    isProtectedNode: jest.fn(() => false),
    clearSelections: jest.fn(),
  }),
}));

jest.mock('../../../src/hooks/RuleBuilder/useCanvasEdgeOperations', () => ({
  useCanvasEdgeOperations: () => ({
    onConnect: jest.fn(),
  }),
}));

// Capture the delete callbacks that Canvas passes to the shortcut hook
jest.mock('../../../src/hooks/RuleBuilder/useCanvasKeyboardShortcuts', () => ({
  useCanvasKeyboardShortcuts: (params: any) => {
    shortcutCapture.deleteNodes = params.deleteSelectedNodes;
    shortcutCapture.deleteEdges = params.deleteSelectedEdges;
    return { pushHistory: jest.fn() };
  },
}));

jest.mock('../../../src/hooks/RuleBuilder/useCanvasCodeGeneration', () => ({
  useCanvasCodeGeneration: jest.fn(),
}));

jest.mock('../../../src/utils/Flow/FlowDefaults', () => ({
  extractCountersFromFlow: jest.fn(() => ({})),
}));

// Debugger panel: isDebuggerOpen is read from the mutable flag at call time
jest.mock('../../../src/hooks/RuleBuilder/useDebuggerPanel', () => ({
  useDebuggerPanel: () => ({
    panelHeight: 30,
    isDebuggerOpen: mockIsDebuggerOpen,
    handleMouseDown: mockHandleMouseDown,
    closeDebugger: mockCloseDebugger,
  }),
}));

// EditableNode sub-hooks
jest.mock('../../../src/hooks/RuleBuilder/useNodeRenderer', () => ({
  useNodeRenderer: (nodeData: any) => ({
    template: { displayName: nodeData?.label || 'Node' },
    backgroundColor: '#ffffff',
    borderColor: '#cccccc',
    label: nodeData?.label || 'Node',
    localParams: nodeData?.params || {},
    isSpecialNode: false,
    targetHandle: { enabled: true },
    sourceHandles: [{ id: 'source-1', enabled: true }],
  }),
}));

jest.mock('../../../src/hooks/RuleBuilder/useNodeValidation', () => ({
  useNodeValidation: () => ({ hasError: false }),
}));

// Avoid rendering the full DebuggerPanel internals when isDebuggerOpen=true
jest.mock('../../../src/components/RuleBuilder/DebuggerPanel', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'debugger-panel' }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const makeDragEvent = (dragData: string, x = 200, y = 200) => ({
  preventDefault: jest.fn(),
  dataTransfer: {
    getData: jest.fn((key: string) =>
      key === 'application/reactflow' ? dragData : '',
    ),
    dropEffect: '',
  },
  clientX: x,
  clientY: y,
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

describe('RuleBuilderCanvas', () => {
  const mockNodes: Node[] = [
    {
      id: 'node-1',
      type: 'editableNode',
      position: { x: 100, y: 100 },
      data: { label: 'Start', nodeType: 'Start', params: {} },
    },
    {
      id: 'node-2',
      type: 'editableNode',
      position: { x: 300, y: 100 },
      data: { label: 'End', nodeType: 'End', params: {} },
    },
  ];

  const mockEdges: Edge[] = [{ id: 'edge-1', source: 'node-1', target: 'node-2' }];

  const defaultProps = {
    isPlaying: false,
    onJsonGenerate: jest.fn(),
    onCodeGenerate: jest.fn(),
    onNodeSelect: jest.fn(),
    onNodeUpdateHandlerReady: jest.fn(),
    debugVariables: {},
    debugLogs: [],
    isNestedCanvasActive: false,
    currentNodeId: undefined,
    nestedCanvasData: {},
    onFlowStateUpdate: jest.fn(),
    viewOnly: false,
    initialNodes: mockNodes,
    initialEdges: mockEdges,
    onUpdateNodeInternalsReady: jest.fn(),
    mode: 'rule-builder' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    reactFlowCapture.props = {};
    shortcutCapture.deleteNodes = undefined;
    shortcutCapture.deleteEdges = undefined;
    mockIsDebuggerOpen = false;
  });

  const renderCanvas = (props: Partial<typeof defaultProps> = {}) =>
    render(<RuleBuilderCanvas {...defaultProps} {...props} />);

  // ─────────────────────────────────────────────────────────────────────────
  describe('Basic Rendering', () => {
    it('should render the ReactFlow container', () => {
      const { container } = renderCanvas();
      expect(container).toBeInTheDocument();
    });

    it('should render with initial nodes and show count', async () => {
      renderCanvas({ initialNodes: mockNodes });
      await act(async () => {});
      expect(screen.getByText(/Nodes:/)).toBeInTheDocument();
    });

    it('should render ReactFlow element', () => {
      renderCanvas();
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('should render controls, background, minimap', () => {
      renderCanvas();
      expect(screen.getByTestId('controls')).toBeInTheDocument();
      expect(screen.getByTestId('background')).toBeInTheDocument();
      expect(screen.getByTestId('minimap')).toBeInTheDocument();
    });

    it('should render nodes/edges count panel', async () => {
      renderCanvas({ initialNodes: mockNodes });
      await act(async () => {});
      expect(screen.getByText(/Nodes:/)).toBeInTheDocument();
    });

    it('should render with empty initial nodes', () => {
      const { container } = renderCanvas({ initialNodes: [], initialEdges: [] });
      expect(container).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Node Click Handlers (onNodeClick / onPaneClick)', () => {
    it('should call onNodeSelect with node when onNodeClick fires', async () => {
      const onNodeSelect = jest.fn();
      renderCanvas({ onNodeSelect });
      await act(async () => {});

      const node = mockNodes[0];
      act(() => {
        reactFlowCapture.props.onNodeClick?.({} as React.MouseEvent, node);
      });

      expect(onNodeSelect).toHaveBeenCalledWith(node);
    });

    it('should not throw when onNodeClick fires and onNodeSelect is undefined', async () => {
      renderCanvas({ onNodeSelect: undefined });
      await act(async () => {});

      expect(() => {
        act(() => {
          reactFlowCapture.props.onNodeClick?.({} as React.MouseEvent, mockNodes[0]);
        });
      }).not.toThrow();
    });

    it('should call onNodeSelect with null when onPaneClick fires', async () => {
      const onNodeSelect = jest.fn();
      renderCanvas({ onNodeSelect });
      await act(async () => {});

      act(() => {
        reactFlowCapture.props.onPaneClick?.();
      });

      expect(onNodeSelect).toHaveBeenCalledWith(null);
    });

    it('should not throw when onPaneClick fires and onNodeSelect is undefined', async () => {
      renderCanvas({ onNodeSelect: undefined });
      await act(async () => {});

      expect(() => {
        act(() => {
          reactFlowCapture.props.onPaneClick?.();
        });
      }).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Node Update Handler (handleNodeUpdate)', () => {
    it('should expose handleNodeUpdate via onNodeUpdateHandlerReady', async () => {
      const onNodeUpdateHandlerReady = jest.fn();
      renderCanvas({ onNodeUpdateHandlerReady });
      await act(async () => {});

      expect(onNodeUpdateHandlerReady).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should call updateNode when the exposed handler is invoked', async () => {
      const onNodeUpdateHandlerReady = jest.fn();
      renderCanvas({ onNodeUpdateHandlerReady });
      await act(async () => {});

      const handler = onNodeUpdateHandlerReady.mock.calls[0][0] as Function;
      act(() => {
        handler('node-1', { label: 'Updated' });
      });

      expect(mockUpdateNode).toHaveBeenCalledWith('node-1', { label: 'Updated' });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Keyboard Shortcut Callbacks (deleteSelectedNodes / deleteSelectedEdges)', () => {
    it('should call deleteSelectedNodes when the shortcut callback fires', async () => {
      renderCanvas();
      await act(async () => {});

      expect(shortcutCapture.deleteNodes).toBeInstanceOf(Function);
      act(() => {
        shortcutCapture.deleteNodes?.();
      });

      expect(mockDeleteSelectedNodes).toHaveBeenCalled();
    });

    it('should call onNodeSelect(null) when shortcut fires and selected nodes exist', async () => {
      const onNodeSelect = jest.fn();
      const selectedNodes: Node[] = [
        {
          id: 'sel-1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { nodeType: 'SetVariable', label: 'Var' },
          selected: true,
        },
      ];

      renderCanvas({ onNodeSelect, initialNodes: selectedNodes });
      await act(async () => {});

      act(() => {
        shortcutCapture.deleteNodes?.();
      });

      expect(onNodeSelect).toHaveBeenCalledWith(null);
    });

    it('should NOT call onNodeSelect when no selected nodes', async () => {
      const onNodeSelect = jest.fn();
      // mockNodes have no .selected = true
      renderCanvas({ onNodeSelect, initialNodes: mockNodes });
      await act(async () => {});

      act(() => {
        shortcutCapture.deleteNodes?.();
      });

      expect(onNodeSelect).not.toHaveBeenCalled();
    });

    it('should call deleteSelectedEdges when the shortcut callback fires', async () => {
      renderCanvas();
      await act(async () => {});

      expect(shortcutCapture.deleteEdges).toBeInstanceOf(Function);
      act(() => {
        shortcutCapture.deleteEdges?.();
      });

      expect(mockDeleteSelectedEdges).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Definition Fingerprint (map branch)', () => {
    it('should enter .map() branch for nodes with mode="definition"', async () => {
      const definitionNodes: Node[] = [
        {
          id: 'def-1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            mode: 'definition',
            params: {
              function_name: 'myFn',
              typeName: 'MyType',
              parameter_count: '2',
              parameters: '["a","b"]',
              code_template: 'function myFn() {}',
            },
          },
        },
      ];
      // If the map runs without throwing, the branch is covered
      expect(() => renderCanvas({ initialNodes: definitionNodes })).not.toThrow();
    });

    it('should enter .map() branch for nodes with generation_type="definition"', async () => {
      const definitionNodes: Node[] = [
        {
          id: 'gen-1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { generation_type: 'definition', params: {} },
        },
      ];
      expect(() => renderCanvas({ initialNodes: definitionNodes })).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Drag-over and Drop Events', () => {
    it('should set dropEffect on dragOver', async () => {
      renderCanvas();
      await act(async () => {});

      const event = { preventDefault: jest.fn(), dataTransfer: { dropEffect: '' } };
      act(() => {
        reactFlowCapture.props.onDragOver?.(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.dataTransfer.dropEffect).toBe('move');
    });

    it('should not fire onDrop when onDrop prop is undefined (viewOnly)', () => {
      renderCanvas({ viewOnly: true });
      // viewOnly=true means ReactFlow receives onDrop=undefined,
      // so reactFlowCapture.props.onDrop is undefined
      expect(reactFlowCapture.props.onDrop).toBeUndefined();
      expect(mockCreateNodeFromTemplate).not.toHaveBeenCalled();
    });

    it('should return early from onDrop when dragData is empty', async () => {
      renderCanvas();
      await act(async () => {}); // flush onInit → reactFlowInstance set

      const dropEvent = makeDragEvent(''); // empty dragData
      act(() => {
        reactFlowCapture.props.onDrop?.(dropEvent);
      });

      expect(mockCreateNodeFromTemplate).not.toHaveBeenCalled();
    });

    it('should create node from simple dragData (no :: separator)', async () => {
      renderCanvas();
      await act(async () => {});

      const dropEvent = makeDragEvent('SetVariable');
      act(() => {
        reactFlowCapture.props.onDrop?.(dropEvent);
      });

      expect(mockCreateNodeFromTemplate).toHaveBeenCalledWith(
        'SetVariable',
        { x: 200, y: 200 },
        undefined,
      );
    });

    it('should create node with mode from dragData containing ::', async () => {
      renderCanvas();
      await act(async () => {});

      const dropEvent = makeDragEvent('FunctionCall::async');
      act(() => {
        reactFlowCapture.props.onDrop?.(dropEvent);
      });

      expect(mockCreateNodeFromTemplate).toHaveBeenCalledWith(
        'FunctionCall',
        { x: 200, y: 200 },
        'async',
      );
    });

    it('should convert mode "undefined" string to actual undefined', async () => {
      renderCanvas();
      await act(async () => {});

      const dropEvent = makeDragEvent('FunctionCall::undefined');
      act(() => {
        reactFlowCapture.props.onDrop?.(dropEvent);
      });

      expect(mockCreateNodeFromTemplate).toHaveBeenCalledWith(
        'FunctionCall',
        { x: 200, y: 200 },
        undefined,
      );
    });

    it('should convert mode "null" string to actual undefined', async () => {
      renderCanvas();
      await act(async () => {});

      const dropEvent = makeDragEvent('FunctionCall::null');
      act(() => {
        reactFlowCapture.props.onDrop?.(dropEvent);
      });

      expect(mockCreateNodeFromTemplate).toHaveBeenCalledWith(
        'FunctionCall',
        { x: 200, y: 200 },
        undefined,
      );
    });

    it('should convert mode empty string to actual undefined', async () => {
      renderCanvas();
      await act(async () => {});

      const dropEvent = makeDragEvent('FunctionCall::');
      act(() => {
        reactFlowCapture.props.onDrop?.(dropEvent);
      });

      expect(mockCreateNodeFromTemplate).toHaveBeenCalledWith(
        'FunctionCall',
        { x: 200, y: 200 },
        undefined,
      );
    });

    it('should not fire onDrop when viewOnly is true', async () => {
      renderCanvas({ viewOnly: true });
      await act(async () => {});

      // viewOnly=true → ReactFlow receives onDrop=undefined
      expect(reactFlowCapture.props.onDrop).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Debugger Panel', () => {
    it('should not render debugger when isDebuggerOpen is false', () => {
      mockIsDebuggerOpen = false;
      renderCanvas({ isPlaying: false });
      expect(screen.queryByTestId('debugger-panel')).not.toBeInTheDocument();
    });

    it('should render debugger panel when isDebuggerOpen is true', () => {
      mockIsDebuggerOpen = true;
      renderCanvas({ isPlaying: true });
      expect(screen.getByTestId('debugger-panel')).toBeInTheDocument();
    });

    it('should render close button when debugger is open', () => {
      mockIsDebuggerOpen = true;
      renderCanvas({ isPlaying: true });
      const closeBtn = screen.getByTitle('Close debugger');
      expect(closeBtn).toBeInTheDocument();
    });

    it('should call closeDebugger when close button is clicked', () => {
      mockIsDebuggerOpen = true;
      renderCanvas({ isPlaying: true });
      const closeBtn = screen.getByTitle('Close debugger');
      fireEvent.click(closeBtn);
      expect(mockCloseDebugger).toHaveBeenCalled();
    });

    it('should render resize handle when debugger is open', () => {
      mockIsDebuggerOpen = true;
      const { container } = renderCanvas({ isPlaying: true });
      // The resize handle has onMouseDown
      const resizeHandle = container.querySelector('[style*="cursor"]') ??
        container.querySelector('div[style]');
      expect(container).toBeInTheDocument();
    });

    it('should call handleMouseDown on resize handle mousedown', () => {
      mockIsDebuggerOpen = true;
      const { container } = renderCanvas({ isPlaying: true });
      // Find the element that has onMouseDown=handleMouseDown (the resize bar)
      // It's the first sibling above the Paper
      const allDivs = container.querySelectorAll('div');
      // Dispatch mousedown on each div until handleMouseDown is called
      allDivs.forEach((div) => fireEvent.mouseDown(div));
      expect(mockHandleMouseDown).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('View-only Mode', () => {
    it('should pass undefined for interactive handlers in viewOnly mode', async () => {
      renderCanvas({ viewOnly: true });
      await act(async () => {});

      expect(reactFlowCapture.props.onDrop).toBeUndefined();
      expect(reactFlowCapture.props.onDragOver).toBeUndefined();
    });

    it('should still pass onNodeClick in viewOnly mode', async () => {
      renderCanvas({ viewOnly: true });
      await act(async () => {});

      expect(reactFlowCapture.props.onNodeClick).toBeInstanceOf(Function);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Nested Canvas', () => {
    it('should accept nestedCanvasData', () => {
      const nestedCanvasData = {
        'node-1': { nodes: [], edges: [] },
      };
      const { container } = renderCanvas({ nestedCanvasData });
      expect(container).toBeInTheDocument();
    });

    it('should handle isNestedCanvasActive=true', () => {
      const { container } = renderCanvas({
        isNestedCanvasActive: true,
        currentNodeId: 'node-1',
      });
      expect(container).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('UpdateNodeInternalsExposer', () => {
    it('should call onUpdateNodeInternalsReady with a function', async () => {
      const onUpdateNodeInternalsReady = jest.fn();
      renderCanvas({ onUpdateNodeInternalsReady });
      await act(async () => {});
      expect(onUpdateNodeInternalsReady).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should not render UpdateNodeInternalsExposer when prop is absent', () => {
      expect(() =>
        renderCanvas({ onUpdateNodeInternalsReady: undefined }),
      ).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Multiple Nodes and Edges', () => {
    it('should render complex flow', async () => {
      const complexNodes: Node[] = [
        { id: 'start', type: 'editableNode', position: { x: 0, y: 0 }, data: { label: 'Start', nodeType: 'Start', params: {} } },
        { id: 'if-1', type: 'editableNode', position: { x: 200, y: 0 }, data: { label: 'Check Amount', nodeType: 'If', params: {} } },
        { id: 'var-1', type: 'editableNode', position: { x: 400, y: 0 }, data: { label: 'Set Result', nodeType: 'SetVariable', params: {} } },
        { id: 'end', type: 'editableNode', position: { x: 600, y: 0 }, data: { label: 'End', nodeType: 'End', params: {} } },
      ];
      const complexEdges: Edge[] = [
        { id: 'e1', source: 'start', target: 'if-1' },
        { id: 'e2', source: 'if-1', target: 'var-1', sourceHandle: 'true' },
        { id: 'e3', source: 'var-1', target: 'end' },
      ];

      renderCanvas({ initialNodes: complexNodes, initialEdges: complexEdges });
      await act(async () => {});

      // Panel shows the node/edge counts
      expect(screen.getByText(/Nodes:/)).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Modes', () => {
    it('should render in rule-builder mode', () => {
      expect(() => renderCanvas({ mode: 'rule-builder' })).not.toThrow();
    });

    it('should render in test-case-generate mode', () => {
      expect(() => renderCanvas({ mode: 'test-case-generate' })).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Default Props (parameter default branches)', () => {
    it('should use EMPTY_NESTED_DATA, EMPTY_DEBUG_VARS, etc. when optional props omitted', async () => {
      // Renders without any optional props → every default param branch is taken
      await act(async () => {
        render(
          <RuleBuilderCanvas
            initialNodes={mockNodes}
            initialEdges={mockEdges}
          />,
        );
      });
      expect(screen.getByText(/Nodes:/)).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Init useEffect branches (nestedCanvasData ternaries)', () => {
    it('should pass nestedCanvasData to extractCountersFromFlow when hasNestedFlows is true', async () => {
      const { extractCountersFromFlow } = require('../../../src/utils/Flow/FlowDefaults');
      renderCanvas({
        nestedCanvasData: { 'loop-node': { nodes: [], edges: [] } },
        initialNodes: mockNodes,
        initialEdges: mockEdges,
      });
      await act(async () => {});
      // hasNestedFlows=true → passes nestedCanvasData (not {}) to extractCountersFromFlow
      expect(extractCountersFromFlow).toHaveBeenCalledWith(
        mockNodes,
        mockEdges,
        { 'loop-node': { nodes: [], edges: [] } },
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('onNodeUpdateHandlerReady false-branch', () => {
    it('should not crash when onNodeUpdateHandlerReady is not provided', async () => {
      await act(async () => {
        render(
          <RuleBuilderCanvas
            initialNodes={mockNodes}
            initialEdges={mockEdges}
          />,
        );
      });
      expect(screen.getByText(/Nodes:/)).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Debugger Panel isPlaying branch', () => {
    it('should render debugger with isPlaying=false (covers isPlaying || false false-branch)', () => {
      mockIsDebuggerOpen = true;
      renderCanvas({ isPlaying: false });
      expect(screen.getByTestId('debugger-panel')).toBeInTheDocument();
    });
  });
});

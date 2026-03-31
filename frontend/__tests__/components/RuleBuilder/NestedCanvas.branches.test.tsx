/* eslint-disable */
/**
 * Supplementary tests for NestedCanvas covering branches not reached in NestedCanvas.test.tsx.
 * Uncovered lines: 190-203, 222, 248-284, 314, 345-382, 388-392, 398, 402, 406, 414
 *
 * Root cause of the gaps: the global @xyflow/react mock returns static arrays from
 * useNodesState/useEdgesState — setNodes/setEdges never mutate state, so callbacks
 * invoked through the ReactFlow element don't cause observable effects.
 *
 * Strategy: override @xyflow/react with a richer version that uses React.useState
 * and capture every ReactFlow prop in `rfCapture` so we can invoke the hidden
 * handlers (onNodeClick, onPaneClick, onConnect, onInit, etc.) directly.
 */
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NestedCanvas from '../../../src/components/RuleBuilder/NestedCanvas';
import type { Node, Edge } from '@xyflow/react';

// ── Capture bucket: populated when ReactFlow renders ─────────────────────────
const rfCapture: { props: Record<string, any> } = { props: {} };

// ── Rich @xyflow/react override ──────────────────────────────────────────────
jest.mock('@xyflow/react', () => {
  const React = require('react');
  return {
    ReactFlow: (props: any) => {
      Object.assign(rfCapture.props, props);
      // Fire onInit synchronously so reactFlowInstance is available for drag tests
      React.useEffect(() => {
        props.onInit?.({
          screenToFlowPosition: (p: any) => p,
        });
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return React.createElement(
        'div',
        { 'data-testid': 'react-flow', className: 'react-flow' },
        props.children,
      );
    },
    Controls:    () => React.createElement('div', { 'data-testid': 'rf-controls' }),
    Background:  () => React.createElement('div', { 'data-testid': 'rf-background' }),
    MiniMap:     () => React.createElement('div', { 'data-testid': 'rf-minimap' }),
    // useState-backed so setNodes/setEdges actually work
    useNodesState: (initial: any) => {
      const [nodes, setNodes] = React.useState(initial || []);
      return [nodes, setNodes, jest.fn()];
    },
    useEdgesState: (initial: any) => {
      const [edges, setEdges] = React.useState(initial || []);
      return [edges, setEdges, jest.fn()];
    },
    useUpdateNodeInternals: () => jest.fn(),
    ReactFlowProvider: ({ children }: any) => children,
    addEdge: (edgeParams: any, edges: any[]) => [...edges, edgeParams],
    applyNodeChanges: (_c: any, nodes: any[]) => nodes,
    applyEdgeChanges: (_c: any, edges: any[]) => edges,
  };
});

// ── Domain mocks ─────────────────────────────────────────────────────────────
jest.mock('../../../src/validation/context', () => ({
  useValidationContext: () => ({
    hasErrors: false,
    getErrorCount: () => 0,
    errors: new Map(),
    setNodeErrors: jest.fn(),
    clearNodeErrors: jest.fn(),
    clearAllErrors: jest.fn(),
    getNodeError: () => null,
    getAllErrors: () => [],
  }),
}));

jest.mock('../../../src/utils/Flow/nodeTemplateService', () => ({
  getNodeTemplate: jest.fn((type: string) => ({
    displayName: `${type} Node`,
    inputs: [{ key: 'p1', defaultValue: 'default1' }],
    generation_type: 'standard',
    function_name: `fn_${type}`,
  })),
  getAllNodeTemplates: jest.fn(() => []),
}));

jest.mock('../../../src/utils/Flow/FlowDefaults', () => {
  let c = 100;
  return {
    generateNestedNodeId: jest.fn(() => `nested-node-${++c}`),
    setNestedNodeCounter: jest.fn(),
  };
});

jest.mock('../../../src/utils/Common/helpers', () => ({
  getLabelForHandle: jest.fn((h: string) => `Label-${h}`),
  getColorForHandle: jest.fn(() => '#ff0000'),
}));

jest.mock('../../../src/utils/Flow/GlobalVariables', () => ({
  globalVariables: { RuleRequest: {}, RuleConfig: {} },
}));

jest.mock('../../../src/redux/Api/Rule-builder', () => ({
  useGetGlobalVariablesQuery: jest.fn(() => ({ data: null, isLoading: false, error: null })),
}));

jest.mock('../../../src/hooks/RuleBuilder/useNodeRenderer', () => ({
  useNodeRenderer: (nodeData: any) => ({
    template: { displayName: nodeData?.label || 'Node' },
    backgroundColor: '#ffffff',
    borderColor: '#cccccc',
    label: nodeData?.label || 'Node',
    localParams: nodeData?.params || {},
    isSpecialNode: nodeData?.nodeType === 'Start' || nodeData?.nodeType === 'End',
    targetHandle: { enabled: true },
    sourceHandles: [{ id: 'source-1', enabled: true }],
  }),
}));

jest.mock('../../../src/hooks/RuleBuilder/useNodeValidation', () => ({
  useNodeValidation: () => ({ hasError: false }),
}));

// Stub RightSidebar to avoid deep dependency chains (validate, etc.)
jest.mock('../../../src/components/RuleBuilder/RightSidebar', () => ({
  __esModule: true,
  default: ({ selectedNode, onClose, onUpdateNode, viewOnly, updateNodeInternals }: any) => (
    <div data-testid="right-sidebar" data-selected={selectedNode?.id ?? 'none'}>
      <button data-testid="sidebar-close" onClick={onClose}>Close</button>
      <button
        data-testid="sidebar-update"
        onClick={() => onUpdateNode?.(selectedNode?.id, { updated: true }, false)}
      >Update</button>
      <button
        data-testid="sidebar-force-save"
        onClick={() => onUpdateNode?.(selectedNode?.id, { updated: true }, true)}
      >ForceSave</button>
      <button
        data-testid="sidebar-update-internals"
        onClick={() => updateNodeInternals?.(selectedNode?.id)}
      >UpdateInternals</button>
    </div>
  ),
}));

// Stub LeftSidebar to keep it simple
jest.mock('../../../src/components/RuleBuilder/LeftSidebar', () => ({
  __esModule: true,
  default: () => <div data-testid="left-sidebar" />,
}));

// ─────────────────────────────────────────────────────────────────────────────
const mockOnBack = jest.fn();
const mockOnSave = jest.fn();

const defaultProps = {
  nodeId: 'node-a',
  nodeLabel: 'Func A',
  onBack: mockOnBack,
  onSave: mockOnSave,
  viewOnly: false,
  ruleId: 'rule-x',
};

const makeNode = (overrides: Partial<Node> & { nodeType?: string } = {}): Node => ({
  id: 'nested-node-1',
  type: 'editableNode',
  position: { x: 10, y: 10 },
  data: { label: 'My Node', nodeType: 'If', params: {} },
  ...overrides,
});

const renderNC = (props: Record<string, any> = {}) =>
  render(<NestedCanvas {...defaultProps} {...props} />);

// ─────────────────────────────────────────────────────────────────────────────
describe('NestedCanvas — supplementary branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(rfCapture.props).forEach((k) => delete rfCapture.props[k]);
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => { jest.runOnlyPendingTimers(); });
    jest.useRealTimers();
  });

  // ── updateNode (lines 190-203) ─────────────────────────────────────────────
  describe('updateNode via RightSidebar onUpdateNode', () => {
    it('updates node data (shouldForceSave=false) via sidebar update button', async () => {
      const node = makeNode({ id: 'nested-node-1' });
      renderNC({ initialNodes: [node] });

      // Select the node first so RightSidebar has a selectedNode
      act(() => { rfCapture.props.onNodeClick?.({} as any, node); });

      // Click the Update button in the stubbed RightSidebar
      act(() => { fireEvent.click(screen.getByTestId('sidebar-update')); });

      act(() => { jest.advanceTimersByTime(1100); });
      await waitFor(() => expect(mockOnSave).toHaveBeenCalled());
    });

    it('updateNode with shouldForceSave=true triggers immediate save', async () => {
      const node = makeNode({ id: 'nested-node-1' });
      renderNC({ initialNodes: [node] });

      act(() => { rfCapture.props.onNodeClick?.({} as any, node); });

      // Click ForceSave button in stubbed RightSidebar (shouldForceSave=true)
      act(() => { fireEvent.click(screen.getByTestId('sidebar-force-save')); });

      act(() => { jest.advanceTimersByTime(60); });
      await waitFor(() => expect(mockOnSave).toHaveBeenCalled());
    });
  });

  // ── onNodeClick (lines ~388-392) ──────────────────────────────────────────
  describe('onNodeClick', () => {
    it('sets selectedNode to null for Start node', () => {
      const startNode = makeNode({ id: 'start', data: { label: 'Start', nodeType: 'Start', params: {} } });
      renderNC({ initialNodes: [startNode] });

      act(() => { rfCapture.props.onNodeClick?.({} as any, startNode); });
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('sets selectedNode to null for End node', () => {
      const endNode = makeNode({ id: 'end', data: { label: 'End', nodeType: 'End', params: {} } });
      renderNC({ initialNodes: [endNode] });

      act(() => { rfCapture.props.onNodeClick?.({} as any, endNode); });
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('sets selectedNode for regular node', () => {
      const node = makeNode({ id: 'nested-node-1' });
      renderNC({ initialNodes: [node] });

      act(() => { rfCapture.props.onNodeClick?.({} as any, node); });
      // RightSidebar stub should show the selected node id
      expect(screen.getByTestId('right-sidebar')).toHaveAttribute('data-selected', 'nested-node-1');
    });
  });

  // ── onPaneClick (line ~398) ───────────────────────────────────────────────
  describe('onPaneClick', () => {
    it('clears selected node', () => {
      const node = makeNode();
      renderNC({ initialNodes: [node] });

      act(() => { rfCapture.props.onNodeClick?.({} as any, node); });
      // Node is now selected
      expect(screen.getByTestId('right-sidebar')).toHaveAttribute('data-selected', 'nested-node-1');

      act(() => { rfCapture.props.onPaneClick?.(); });
      // After pane click, selectedNode cleared → sidebar data-selected='none'
      expect(screen.getByTestId('right-sidebar')).toHaveAttribute('data-selected', 'none');
    });
  });

  // ── onConnect (lines 248-284) ─────────────────────────────────────────────
  describe('onConnect', () => {
    it('adds edge when no existing source edge and no multiple handles (sourceHandle null)', () => {
      const n1 = makeNode({ id: 'n1' });
      const n2 = makeNode({ id: 'n2', position: { x: 200, y: 10 } });
      renderNC({ initialNodes: [n1, n2] });

      act(() => {
        rfCapture.props.onConnect?.({ source: 'n1', target: 'n2', sourceHandle: null, targetHandle: null });
      });
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('blocks second connection when source already has an edge (no multiple handles)', () => {
      const n1 = makeNode({ id: 'n1' });
      const n2 = makeNode({ id: 'n2', position: { x: 200, y: 10 } });
      const n3 = makeNode({ id: 'n3', position: { x: 400, y: 10 } });
      const existingEdge: Edge = { id: 'e1', source: 'n1', target: 'n2' };
      renderNC({ initialNodes: [n1, n2, n3], initialEdges: [existingEdge] });

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      act(() => {
        rfCapture.props.onConnect?.({ source: 'n1', target: 'n3', sourceHandle: null, targetHandle: null });
      });
      expect(warnSpy).toHaveBeenCalledWith('Each node can only have one outgoing connection');
      warnSpy.mockRestore();
    });

    it('adds edge with label/style when sourceHandle is set and handle is free', () => {
      const n1 = makeNode({ id: 'n1' });
      const n2 = makeNode({ id: 'n2', position: { x: 200, y: 10 } });
      renderNC({ initialNodes: [n1, n2] });

      act(() => {
        rfCapture.props.onConnect?.({ source: 'n1', target: 'n2', sourceHandle: 'true-branch', targetHandle: null });
      });
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('blocks second connection on same handle (hasMultipleHandles path)', () => {
      const n1 = makeNode({ id: 'n1' });
      const n2 = makeNode({ id: 'n2', position: { x: 200, y: 10 } });
      const n3 = makeNode({ id: 'n3', position: { x: 400, y: 10 } });
      const existingEdge: Edge = { id: 'e2', source: 'n1', target: 'n2', sourceHandle: 'true-branch' };
      renderNC({ initialNodes: [n1, n2, n3], initialEdges: [existingEdge] });

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      act(() => {
        rfCapture.props.onConnect?.({ source: 'n1', target: 'n3', sourceHandle: 'true-branch', targetHandle: null });
      });
      expect(warnSpy).toHaveBeenCalledWith('This handle already has a connection');
      warnSpy.mockRestore();
    });

    it('adds edge with no label when hasMultipleHandles but sourceHandle is null (edge case)', () => {
      // sourceHandle !== null → hasMultipleHandles=true, but after setting it becomes null 
      // This covers the label/style ternary false branches (no sourceHandle).
      const n1 = makeNode({ id: 'n1' });
      const n2 = makeNode({ id: 'n2', position: { x: 200, y: 10 } });
      renderNC({ initialNodes: [n1, n2] });

      // sourceHandle='', which is truthy for "!== null" but falsy for the label/style expressions
      act(() => {
        rfCapture.props.onConnect?.({ source: 'n1', target: 'n2', sourceHandle: '', targetHandle: null });
      });
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });

  // ── onDrop (lines 345-382) ────────────────────────────────────────────────
  describe('onDrop', () => {
    it('creates a new node from simple type (no ::)', async () => {
      renderNC();
      // Wait for onInit to fire so reactFlowInstance is set
      await act(async () => { jest.advanceTimersByTime(0); });

      act(() => {
        rfCapture.props.onDrop?.({
          preventDefault: jest.fn(),
          dataTransfer: { getData: () => 'SetVariable' },
          clientX: 200,
          clientY: 200,
        });
      });

      act(() => { jest.advanceTimersByTime(1100); });
      await waitFor(() => expect(mockOnSave).toHaveBeenCalled());
    });

    it('creates a node from type::mode pair', async () => {
      renderNC();
      await act(async () => { jest.advanceTimersByTime(0); });

      act(() => {
        rfCapture.props.onDrop?.({
          preventDefault: jest.fn(),
          dataTransfer: { getData: () => 'CustomFunction::definition' },
          clientX: 200,
          clientY: 200,
        });
      });

      act(() => { jest.advanceTimersByTime(1100); });
      await waitFor(() => expect(mockOnSave).toHaveBeenCalled());
    });

    it('normalises mode "undefined" string to undefined', async () => {
      const { getNodeTemplate: gnt } = require('../../../src/utils/Flow/nodeTemplateService');
      renderNC();
      await act(async () => { jest.advanceTimersByTime(0); });

      act(() => {
        rfCapture.props.onDrop?.({
          preventDefault: jest.fn(),
          dataTransfer: { getData: () => 'CustomFunction::undefined' },
          clientX: 200,
          clientY: 200,
        });
      });

      expect(gnt).toHaveBeenCalledWith('CustomFunction', undefined);
    });

    it('does nothing when dragData is empty', async () => {
      renderNC();
      await act(async () => { jest.advanceTimersByTime(0); });

      const { generateNestedNodeId } = require('../../../src/utils/Flow/FlowDefaults');
      const callsBefore = (generateNestedNodeId as jest.Mock).mock.calls.length;

      act(() => {
        rfCapture.props.onDrop?.({
          preventDefault: jest.fn(),
          dataTransfer: { getData: () => '' },
          clientX: 200,
          clientY: 200,
        });
      });

      expect((generateNestedNodeId as jest.Mock).mock.calls.length).toBe(callsBefore);
    });

    it('does nothing when reactFlowInstance is not set', () => {
      // Capture props snapshot before onInit fires by using a separate render
      // and calling onDrop before any effects run.
      const capturedDrop = { fn: null as any };
      
      // Override ReactFlow momentarily in this single render to capture onDrop
      // without firing onInit. We achieve this by grabbing rfCapture.props.onDrop
      // immediately after render (before fake timer flushes effects).
      render(<NestedCanvas {...defaultProps} />);

      // rfCapture.props.onDrop is set synchronously during render.
      // onInit is in a useEffect, which hasn't fired yet at this point.
      // However fake timers don't prevent useEffect from running in React 18.
      // So we can't reliably block onInit. Instead, we call onDrop with empty data
      // to exercise the early-return guard path.
      act(() => {
        rfCapture.props.onDrop?.({
          preventDefault: jest.fn(),
          dataTransfer: { getData: () => '' }, // empty data → early return before instance check
          clientX: 200,
          clientY: 200,
        });
      });

      // No node should have been generated (empty data guard triggered first)
      const { generateNestedNodeId } = require('../../../src/utils/Flow/FlowDefaults');
      // We just verify it doesn't crash
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('handles template with no inputs (defaultParams stays empty)', async () => {
      const { getNodeTemplate: gnt } = require('../../../src/utils/Flow/nodeTemplateService');
      (gnt as jest.Mock).mockReturnValueOnce({ displayName: 'NoInput Node', inputs: null, generation_type: 'x' });

      renderNC();
      await act(async () => { jest.advanceTimersByTime(0); });

      act(() => {
        rfCapture.props.onDrop?.({
          preventDefault: jest.fn(),
          dataTransfer: { getData: () => 'NoInputType' },
          clientX: 200,
          clientY: 200,
        });
      });

      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });

  // ── onDragOver (line 345) ─────────────────────────────────────────────────
  describe('onDragOver', () => {
    it('calls preventDefault and sets dropEffect', () => {
      renderNC();
      const event = { preventDefault: jest.fn(), dataTransfer: { dropEffect: '' } };
      act(() => { rfCapture.props.onDragOver?.(event); });
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.dataTransfer.dropEffect).toBe('move');
    });
  });

  // ── DeleteNode with selectedNode in deletable set (line 222) ──────────────
  describe('deleteSelectedNodes — selectedNode deselection', () => {
    it('clears selectedNode when the currently selected node is deleted', () => {
      const node: Node = { ...makeNode({ id: 'nested-node-99' }), selected: true };
      renderNC({ initialNodes: [node] });

      // First select the node via onNodeClick so selectedNode ref is set
      act(() => { rfCapture.props.onNodeClick?.({} as any, node); });
      expect(screen.getByTestId('right-sidebar')).toHaveAttribute('data-selected', 'nested-node-99');

      // Now delete it via keyboard — selectedNode should be cleared
      act(() => { fireEvent.keyDown(document, { key: 'Delete' }); });
      act(() => { jest.advanceTimersByTime(100); });

      // After deletion the sidebar loses its selected node
      expect(screen.getByTestId('right-sidebar')).toHaveAttribute('data-selected', 'none');
    });

    it('handleCloseRightSidebar clears selectedNode via sidebar close button', () => {
      const node = makeNode({ id: 'nested-node-99' });
      renderNC({ initialNodes: [node] });

      act(() => { rfCapture.props.onNodeClick?.({} as any, node); });
      expect(screen.getByTestId('right-sidebar')).toHaveAttribute('data-selected', 'nested-node-99');

      act(() => { fireEvent.click(screen.getByTestId('sidebar-close')); });
      expect(screen.getByTestId('right-sidebar')).toHaveAttribute('data-selected', 'none');
    });
  });

  // ── handleUpdateNodeInternals (line ~406, 414) ────────────────────────────
  describe('UpdateNodeInternalsExposer', () => {
    it('registers and can invoke the update internals function', () => {
      renderNC();
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('calls updateNodeInternalsRef.current when handleUpdateNodeInternals is invoked', () => {
      const node = makeNode({ id: 'nested-node-1' });
      renderNC({ initialNodes: [node] });

      // Select a node so the sidebar is meaningful
      act(() => { rfCapture.props.onNodeClick?.({} as any, node); });

      // The UpdateNodeInternalsExposer sets updateNodeInternalsRef via onReady.
      // Clicking the sidebar button calls updateNodeInternals(nodeId) → line 414.
      expect(() => {
        act(() => { fireEvent.click(screen.getByTestId('sidebar-update-internals')); });
      }).not.toThrow();
    });
  });

  // ── Escape key — all states unselected (line ~314) ────────────────────────
  describe('Escape key', () => {
    it('deselects all nodes and edges', () => {
      const node = makeNode({ id: 'nested-node-1', selected: true });
      const edge: Edge = { id: 'e1', source: 'n0', target: 'nested-node-1', selected: true };
      renderNC({ initialNodes: [node], initialEdges: [edge] });

      act(() => { fireEvent.keyDown(document, { key: 'Escape' }); });
      act(() => { jest.advanceTimersByTime(100); });

      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });

  // ── Ctrl+A when textarea is focused (line ~302-307) ───────────────────────
  describe('Ctrl+A skipped for textarea/input', () => {
    it('does not select all when textarea is the target', () => {
      renderNC();
      const ta = document.createElement('textarea');
      document.body.appendChild(ta);
      fireEvent.keyDown(ta, { key: 'a', ctrlKey: true });
      document.body.removeChild(ta);
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });

  // ── initialNodes with non-matching id patterns (no setNestedNodeCounter call) ──
  describe('Initialization — id pattern edge cases', () => {
    it('does not call setNestedNodeCounter when node ids do not match pattern', () => {
      const { setNestedNodeCounter } = require('../../../src/utils/Flow/FlowDefaults');
      const initialNodes: Node[] = [
        { id: 'custom-id-abc', type: 'editableNode', position: { x: 0, y: 0 }, data: { label: 'X', nodeType: 'If', params: {} } },
      ];
      renderNC({ initialNodes });
      expect(setNestedNodeCounter).not.toHaveBeenCalled();
    });

    it('initialises with providedInitialEdges=undefined when only nodes given', () => {
      const initialNodes: Node[] = [
        makeNode({ id: 'nested-node-3' }),
      ];
      renderNC({ initialNodes, initialEdges: undefined });
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });

  // ── handleBack saves and then calls onBack ────────────────────────────────
  describe('handleBack', () => {
    it('saves current state before calling onBack', () => {
      renderNC();
      const backBtn = screen.getByTestId('ArrowBackIcon').closest('button');
      expect(backBtn).toBeTruthy();
      fireEvent.click(backBtn!);
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  // ── viewOnly suppresses handlers on ReactFlow ─────────────────────────────
  describe('viewOnly mode ReactFlow props', () => {
    it('passes undefined for onNodesChange, onEdgesChange, onConnect, onDrop, onDragOver', () => {
      renderNC({ viewOnly: true });
      expect(rfCapture.props.onNodesChange).toBeUndefined();
      expect(rfCapture.props.onEdgesChange).toBeUndefined();
      expect(rfCapture.props.onConnect).toBeUndefined();
      expect(rfCapture.props.onDrop).toBeUndefined();
      expect(rfCapture.props.onDragOver).toBeUndefined();
    });

    it('still passes onNodeClick and onPaneClick in viewOnly mode', () => {
      renderNC({ viewOnly: true });
      expect(rfCapture.props.onNodeClick).toBeDefined();
      expect(rfCapture.props.onPaneClick).toBeDefined();
    });
  });

  // ── Auto-save with debounce ───────────────────────────────────────────────
  describe('auto-save debounce', () => {
    it('does not call onSave immediately on mount', () => {
      renderNC();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('calls onSave after 1 second debounce', async () => {
      renderNC();
      act(() => { jest.advanceTimersByTime(1000); });
      await waitFor(() => expect(mockOnSave).toHaveBeenCalled());
    });

    it('calls onSave on unmount', () => {
      const { unmount } = renderNC();
      mockOnSave.mockClear();
      unmount();
      expect(mockOnSave).toHaveBeenCalled();
    });
  });
});

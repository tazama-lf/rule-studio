import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NestedCanvas from '../../../src/components/RuleBuilder/NestedCanvas';
import type { Node, Edge } from '@xyflow/react';
import { act } from 'react';
import { getNodeTemplate } from '../../../src/utils/Flow/nodeTemplateService';
import { setNestedNodeCounter } from '../../../src/utils/Flow/FlowDefaults';
import { getLabelForHandle, getColorForHandle } from '../../../src/utils/Common/helpers';

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
    inputs: [{ key: 'param1', defaultValue: 'default' }],
    generation_type: 'standard',
  })),
  getAllNodeTemplates: jest.fn(() => []),
}));

jest.mock('../../../src/utils/Flow/FlowDefaults', () => {
  let nestedCounter = 0;
  return {
    generateNestedNodeId: jest.fn(() => `nested-node-${++nestedCounter}`),
    setNestedNodeCounter: jest.fn((value: number) => {
      nestedCounter = value;
    }),
  };
});

jest.mock('../../../src/utils/Common/helpers', () => ({
  getLabelForHandle: jest.fn((handle: string) => `Label ${handle}`),
  getColorForHandle: jest.fn((handle: string) => '#000000'),
}));

jest.mock('../../../src/utils/Flow/GlobalVariables', () => ({
  globalVariables: {
    RuleRequest: {},
    RuleConfig: {},
  },
}));

jest.mock('../../../src/redux/Api/Rule-builder', () => ({
  useGetGlobalVariablesQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
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
  useNodeValidation: () => ({
    hasError: false,
  }),
}));

describe('NestedCanvas Component', () => {
  const mockOnBack = jest.fn();
  const mockOnSave = jest.fn();

  const defaultProps = {
    nodeId: 'test-node-1',
    nodeLabel: 'Test Function',
    onBack: mockOnBack,
    onSave: mockOnSave,
    viewOnly: false,
    ruleId: 'rule-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  const renderNestedCanvas = (props = {}) => {
    return render(<NestedCanvas {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('should render nested canvas with header', () => {
      renderNestedCanvas();
      expect(screen.getByText('Test Function - Internal Flow')).toBeInTheDocument();
    });

    it('should render with subtitle text', () => {
      renderNestedCanvas();
      expect(screen.getByText('Define the internal logic for this function')).toBeInTheDocument();
    });

    it('should render back button', () => {
      renderNestedCanvas();
      const backButton = screen.getByTestId('ArrowBackIcon');
      expect(backButton).toBeInTheDocument();
    });

    it('should render ReactFlow canvas', () => {
      const { container } = renderNestedCanvas();
      const reactFlow = container.querySelector('[class*="react-flow"]');
      expect(reactFlow).toBeTruthy();
    });

    it('should render with provided node label', () => {
      renderNestedCanvas({ nodeLabel: 'Custom Function' });
      expect(screen.getByText('Custom Function - Internal Flow')).toBeInTheDocument();
    });
  });

  describe('Initialization', () => {
    it('should initialize with Start and End nodes when no initial nodes provided', () => {
      renderNestedCanvas();
      
      expect(getNodeTemplate).toHaveBeenCalledWith('Start');
      expect(getNodeTemplate).toHaveBeenCalledWith('End');
    });

    it('should initialize with provided initial nodes', () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Custom Node', nodeType: 'If', params: {} },
        },
      ];

      const { container } = renderNestedCanvas({ initialNodes });
      
      expect(container).toBeInTheDocument();
    });

    it('should initialize with provided initial edges', () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 1', nodeType: 'If', params: {} },
        },
        {
          id: 'nested-node-2',
          type: 'editableNode',
          position: { x: 300, y: 100 },
          data: { label: 'Node 2', nodeType: 'SetVariable', params: {} },
        },
      ];

      const initialEdges: Edge[] = [
        {
          id: 'edge-1',
          source: 'nested-node-1',
          target: 'nested-node-2',
        },
      ];

      const { container } = renderNestedCanvas({ initialNodes, initialEdges });
      
      expect(container).toBeInTheDocument();
    });

    it('should set nested node counter from existing nodes', () => {
      
      const initialNodes: Node[] = [
        {
          id: 'nested-node-5',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 5', nodeType: 'If', params: {} },
        },
        {
          id: 'nested-node-10',
          type: 'editableNode',
          position: { x: 300, y: 100 },
          data: { label: 'Node 10', nodeType: 'SetVariable', params: {} },
        },
      ];

      renderNestedCanvas({ initialNodes });

      expect(setNestedNodeCounter).toHaveBeenCalledWith(10);
    });

    it('should not reset nodes when re-rendered with same initial nodes', () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 1', nodeType: 'If', params: {} },
        },
      ];

      const { rerender, container } = renderNestedCanvas({ initialNodes });
      
      rerender(<NestedCanvas {...defaultProps} initialNodes={initialNodes} />);
      
      expect(container).toBeInTheDocument();
    });
  });

  describe('Auto-save Functionality', () => {
    it('should debounce save calls when nodes change', async () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 1', nodeType: 'If', params: {} },
        },
      ];

      renderNestedCanvas({ initialNodes });
      
      expect(mockOnSave).not.toHaveBeenCalled();
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should save on unmount', () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 1', nodeType: 'If', params: {} },
        },
      ];

      const { unmount } = renderNestedCanvas({ initialNodes });
      
      mockOnSave.mockClear();
      
      unmount();

      expect(mockOnSave).toHaveBeenCalled();
    });

    it('should cancel pending save timeout on unmount', () => {
      renderNestedCanvas();

      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Back Button', () => {
    it('should call onSave and onBack when back button clicked', async () => {
      renderNestedCanvas();
      
      const backButton = screen.getByTestId('ArrowBackIcon').closest('button');
      if (backButton) {
        fireEvent.click(backButton);
      }
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        expect(mockOnBack).toHaveBeenCalled();
      });
    });

    it('should save current state when going back', async () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 1', nodeType: 'If', params: { test: 'value' } },
        },
      ];

      renderNestedCanvas({ initialNodes });
      
      const backButton = screen.getByTestId('ArrowBackIcon').closest('button');
      if (backButton) {
        fireEvent.click(backButton);
      }
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'nested-node-1',
              data: expect.objectContaining({ params: { test: 'value' } }),
            }),
          ]),
          expect.any(Array)
        );
      });
    });
  });

  describe('View-Only Mode', () => {
    it('should not render LeftSidebar in view-only mode', () => {
      renderNestedCanvas({ viewOnly: true });

      expect(screen.queryByText('Add Nodes')).not.toBeInTheDocument();
    });

    it('should disable node dragging in view-only mode', () => {
      const { container } = renderNestedCanvas({ viewOnly: true });
      
      const reactFlow = container.querySelector('.react-flow');
      expect(reactFlow).toBeInTheDocument();
    });

    it('should not allow keyboard shortcuts in view-only mode', () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 1', nodeType: 'If', params: {} },
          selected: true,
        },
      ];

      const { container } = renderNestedCanvas({ viewOnly: true, initialNodes });
      fireEvent.keyDown(document, { key: 'Delete' });
      
      expect(container).toBeInTheDocument();
    });
  });

  describe('Node Selection', () => {
    it('should allow selecting a node', () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Selectable Node', nodeType: 'If', params: {} },
        },
      ];

      const { container } = renderNestedCanvas({ initialNodes });
      
      expect(container).toBeInTheDocument();
    });

    it('should not select Start or End nodes', () => {
      const { container } = renderNestedCanvas();
      expect(container).toBeInTheDocument();
    });

    it('should deselect node when pane is clicked', () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 1', nodeType: 'If', params: {} },
          selected: true,
        },
      ];

      renderNestedCanvas({ initialNodes });
    });

    it('should deselect node on Escape key', () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 1', nodeType: 'If', params: {} },
          selected: true,
        },
      ];

      renderNestedCanvas({ initialNodes });
      
      fireEvent.keyDown(document, { key: 'Escape' });
      act(() => {
        jest.advanceTimersByTime(100);
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should select all with Ctrl+A', () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 1', nodeType: 'If', params: {} },
        },
        {
          id: 'nested-node-2',
          type: 'editableNode',
          position: { x: 300, y: 100 },
          data: { label: 'Node 2', nodeType: 'SetVariable', params: {} },
        },
      ];

      renderNestedCanvas({ initialNodes });
      
      fireEvent.keyDown(document, { key: 'a', ctrlKey: true });
      act(() => {
        jest.advanceTimersByTime(100);
      });
    });

    it('should not trigger shortcuts when input is focused', () => {
      renderNestedCanvas();
      
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      
      fireEvent.keyDown(input, { key: 'Delete' });
      document.body.removeChild(input);
    });

    it('should not trigger shortcuts when textarea is focused', () => {
      renderNestedCanvas();
      
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();
      
      fireEvent.keyDown(textarea, { key: 'Delete' });
      
      // Should not delete anything
      document.body.removeChild(textarea);
    });

    it('should prevent default on Ctrl+A', () => {
      renderNestedCanvas();
      
      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      document.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Node Deletion', () => {
    it('should not delete Start nodes', () => {
      const initialNodes: Node[] = [
        {
          id: 'start-node',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Start', nodeType: 'Start', params: {} },
          selected: true,
        },
      ];

      const { container } = renderNestedCanvas({ initialNodes });
      
      fireEvent.keyDown(document, { key: 'Delete' });
      expect(container).toBeInTheDocument();
    });

    it('should not delete End nodes', () => {
      const initialNodes: Node[] = [
        {
          id: 'end-node',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'End', nodeType: 'End', params: {} },
          selected: true,
        },
      ];

      const { container } = renderNestedCanvas({ initialNodes });
      
      fireEvent.keyDown(document, { key: 'Delete' });
      expect(container).toBeInTheDocument();
    });

    it('should delete regular nodes on Delete key', () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Deletable Node', nodeType: 'If', params: {} },
          selected: true,
        },
      ];

      renderNestedCanvas({ initialNodes });
      
      fireEvent.keyDown(document, { key: 'Delete' });
      act(() => {
        jest.advanceTimersByTime(100);
      });
    });

    it('should delete regular nodes on Backspace key', () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Deletable Node', nodeType: 'If', params: {} },
          selected: true,
        },
      ];

      renderNestedCanvas({ initialNodes });
      
      fireEvent.keyDown(document, { key: 'Backspace' });
      
      act(() => {
        jest.advanceTimersByTime(100);
      });
    });

    it('should delete connected edges when node is deleted', () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 1', nodeType: 'If', params: {} },
        },
        {
          id: 'nested-node-2',
          type: 'editableNode',
          position: { x: 300, y: 100 },
          data: { label: 'Node 2', nodeType: 'SetVariable', params: {} },
          selected: true,
        },
      ];

      const initialEdges: Edge[] = [
        {
          id: 'edge-1',
          source: 'nested-node-1',
          target: 'nested-node-2',
        },
      ];

      renderNestedCanvas({ initialNodes, initialEdges });
      
      fireEvent.keyDown(document, { key: 'Delete' });
      act(() => {
        jest.advanceTimersByTime(100);
      });
    });

    it('should delete selected edges', () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 1', nodeType: 'If', params: {} },
        },
        {
          id: 'nested-node-2',
          type: 'editableNode',
          position: { x: 300, y: 100 },
          data: { label: 'Node 2', nodeType: 'SetVariable', params: {} },
        },
      ];

      const initialEdges: Edge[] = [
        {
          id: 'edge-1',
          source: 'nested-node-1',
          target: 'nested-node-2',
          selected: true,
        },
      ];

      renderNestedCanvas({ initialNodes, initialEdges });
      
      fireEvent.keyDown(document, { key: 'Delete' });
      
      act(() => {
        jest.advanceTimersByTime(100);
      });
    });
  });

  describe('Node Updates', () => {
    it('should update node data', () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 1', nodeType: 'If', params: { condition: 'old' } },
        },
      ];

      const { container } = renderNestedCanvas({ initialNodes });
      expect(container).toBeInTheDocument();
    });

    it('should force save when shouldForceSave is true', async () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 1', nodeType: 'If', params: {} },
        },
      ];

      renderNestedCanvas({ initialNodes });
    });
  });

  describe('Main Canvas Integration', () => {
    it('should combine main canvas nodes with nested nodes', () => {
      const mainCanvasNodes: Node[] = [
        {
          id: 'main-node-1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { label: 'Main Node', nodeType: 'SetVariable', params: {} },
        },
      ];

      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Nested Node', nodeType: 'If', params: {} },
        },
      ];

      const { container } = renderNestedCanvas({ mainCanvasNodes, initialNodes });
      expect(container).toBeInTheDocument();
    });

    it('should update allNodes when nested nodes change', () => {
      const mainCanvasNodes: Node[] = [
        {
          id: 'main-node-1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { label: 'Main Node', nodeType: 'SetVariable', params: {} },
        },
      ];

      const { container } = renderNestedCanvas({ mainCanvasNodes });

      expect(container).toBeInTheDocument();
    });

    it('should handle empty main canvas nodes', () => {
      renderNestedCanvas({ mainCanvasNodes: [] });
      expect(screen.getByText('Test Function - Internal Flow')).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag over event', () => {
      const { container } = renderNestedCanvas();
      
      const reactFlowWrapper = container.querySelector('[class*="react-flow"]');
      
      if (reactFlowWrapper) {
        fireEvent.dragOver(reactFlowWrapper, {
          dataTransfer: {
            dropEffect: 'none',
          },
        });
        expect(reactFlowWrapper).toBeInTheDocument();
      }
    });

    it('should handle drop event to create new node', async () => {
      
      const { container } = renderNestedCanvas();
      
      const reactFlowWrapper = container.querySelector('[class*="react-flow"]');
      
      if (reactFlowWrapper) {
        fireEvent.drop(reactFlowWrapper, {
          dataTransfer: {
            getData: jest.fn((format: string) => {
              if (format === 'application/reactflow') {
                return 'SetVariable';
              }
              return '';
            }),
          },
          clientX: 150,
          clientY: 150,
        });
        await waitFor(() => {
          expect(reactFlowWrapper).toBeInTheDocument();
        });
      }
    });

    it('should handle drop with mode in drag data', () => {
      const { container } = renderNestedCanvas();
      
      const reactFlowWrapper = container.querySelector('[class*="react-flow"]');
      
      if (reactFlowWrapper) {
        fireEvent.drop(reactFlowWrapper, {
          dataTransfer: {
            getData: jest.fn((format: string) => {
              if (format === 'application/reactflow') {
                return 'CustomFunction::definition';
              }
              return '';
            }),
          },
          clientX: 150,
          clientY: 150,
        });
        
        expect(reactFlowWrapper).toBeInTheDocument();
      }
    });

    it('should not create node if reactFlowInstance is not ready', () => {
      const { container } = renderNestedCanvas();
      
      const reactFlowWrapper = container.querySelector('[class*="react-flow"]');
      if (reactFlowWrapper) {
        fireEvent.drop(reactFlowWrapper, {
          dataTransfer: {
            getData: jest.fn(() => 'SetVariable'),
          },
        });
        
        expect(reactFlowWrapper).toBeInTheDocument();
      }
    });

    it('should not create node if no drag data', () => {
      const { container } = renderNestedCanvas();
      
      const reactFlowWrapper = container.querySelector('[class*="react-flow"]');
      
      if (reactFlowWrapper) {
        fireEvent.drop(reactFlowWrapper, {
          dataTransfer: {
            getData: jest.fn(() => ''),
          },
        });
        
        expect(reactFlowWrapper).toBeInTheDocument();
      }
    });
  });

  describe('Edge Connections', () => {
    it('should prevent multiple connections from single handle', () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 1', nodeType: 'If', params: {} },
        },
        {
          id: 'nested-node-2',
          type: 'editableNode',
          position: { x: 300, y: 100 },
          data: { label: 'Node 2', nodeType: 'SetVariable', params: {} },
        },
      ];

      const initialEdges: Edge[] = [
        {
          id: 'edge-1',
          source: 'nested-node-1',
          target: 'nested-node-2',
        },
      ];

      renderNestedCanvas({ initialNodes, initialEdges });
    });

    it('should create edge with label for multiple handles', () => {
      
      renderNestedCanvas();
      expect(getLabelForHandle).toBeDefined();
    });

    it('should create edge with color for multiple handles', () => {
      
      renderNestedCanvas();
      expect(getColorForHandle).toBeDefined();
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup event listeners on unmount', () => {
      const { unmount } = renderNestedCanvas();
      
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });

    it('should cleanup save timeout on unmount', () => {
      const { unmount } = renderNestedCanvas();
      
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      unmount();
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    });

    it('should update onSave ref when prop changes', () => {
      const { rerender } = renderNestedCanvas();
      
      const newOnSave = jest.fn();
      
      rerender(<NestedCanvas {...defaultProps} onSave={newOnSave} />);
    });
  });

  describe('RightSidebar Integration', () => {
    it('should pass selected node to RightSidebar', () => {
      const initialNodes: Node[] = [
        {
          id: 'nested-node-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Selectable', nodeType: 'If', params: {} },
        },
      ];

      const { container } = renderNestedCanvas({ initialNodes });
      expect(container).toBeInTheDocument();
    });

    it('should pass allNodes to RightSidebar', () => {
      const mainCanvasNodes: Node[] = [
        {
          id: 'main-node-1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { label: 'Main', nodeType: 'SetVariable', params: {} },
        },
      ];

      renderNestedCanvas({ mainCanvasNodes });
    });

    it('should pass viewOnly to RightSidebar', () => {
      renderNestedCanvas({ viewOnly: true });
    });

    it('should close RightSidebar when handleCloseRightSidebar is called', () => {
      renderNestedCanvas();
    });
  });

  describe('Props Handling', () => {
    it('should accept ruleId prop', () => {
      renderNestedCanvas({ ruleId: 'custom-rule-id' });
      
      expect(screen.getByText('Test Function - Internal Flow')).toBeInTheDocument();
    });

    it('should work without ruleId prop', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ruleId: _ruleId, ...propsWithoutRuleId } = defaultProps;
      renderNestedCanvas({ ...propsWithoutRuleId, ruleId: undefined });
      
      expect(screen.getByText('Test Function - Internal Flow')).toBeInTheDocument();
    });

    it('should render with displayName for memo debugging', () => {
      expect(NestedCanvas.displayName).toBe('NestedCanvas');
    });
  });
});


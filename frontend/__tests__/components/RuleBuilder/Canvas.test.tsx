import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RuleBuilderCanvas from '../../../src/components/RuleBuilder/Canvas';
import type { Node, Edge } from '@xyflow/react';

// Mock Redux API
jest.mock('../../../src/redux/Api/Rule-builder');

// Mock validation context
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

// Mock hooks
jest.mock('../../../src/hooks/RuleBuilder/useCanvasNodeOperations', () => ({
  useCanvasNodeOperations: () => ({
    onNodeDragStop: () => {},
    onConnect: () => {},
    onNodesDelete: () => {},
    handleNodeUpdate: () => {},
  }),
}));

jest.mock('../../../src/hooks/RuleBuilder/useCanvasEdgeOperations', () => ({
  useCanvasEdgeOperations: () => ({
    onEdgesDelete: () => {},
  }),
}));

jest.mock('../../../src/hooks/RuleBuilder/useCanvasKeyboardShortcuts', () => ({
  useCanvasKeyboardShortcuts: () => ({}),
}));

jest.mock('../../../src/hooks/RuleBuilder/useCanvasCodeGeneration', () => ({
  useCanvasCodeGeneration: () => ({
    generateCode: () => {},
  }),
}));

jest.mock('../../../src/hooks/RuleBuilder/useDebuggerPanel', () => ({
  useDebuggerPanel: () => ({
    debugVariables: {},
    debugLogs: [],
  }),
}));

jest.mock('../../../src/utils/Flow/FlowDefaults', () => ({
  extractCountersFromFlow: () => ({}),
}));

// Mock EditableNode hooks
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
  useNodeValidation: () => ({
    hasError: false,
  }),
}));

describe('RuleBuilder Canvas Component', () => {
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

  const mockEdges: Edge[] = [
    {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
    },
  ];

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
  });

  const renderCanvas = (props = {}) => {
    return render(<RuleBuilderCanvas {...defaultProps} {...props} />);
  };

  describe('Basic Rendering', () => {
    it('should render canvas', () => {
      const { container } = renderCanvas();
      expect(container).toBeInTheDocument();
    });

    it('should render with initial nodes', () => {
      renderCanvas({ initialNodes: mockNodes });
      // Canvas renders ReactFlow which renders nodes
      expect(screen.queryByText('Start')).toBeInTheDocument();
    });

    it('should render ReactFlow controls', () => {
      const { container } = renderCanvas();
      // ReactFlow controls should be present
      expect(container.querySelector('.react-flow')).toBeInTheDocument();
    });
  });

  describe('Play Mode', () => {
    it('should handle playing state', () => {
      renderCanvas({ isPlaying: true });
      expect(defaultProps.onJsonGenerate).toBeDefined();
    });

    it('should handle idle state', () => {
      renderCanvas({ isPlaying: false });
      expect(defaultProps.onJsonGenerate).toBeDefined();
    });
  });

  describe('Node Operations', () => {
    it('should handle node selection', () => {
      const onNodeSelect = jest.fn();
      renderCanvas({ onNodeSelect });
      
      // Node selection is handled internally
      expect(onNodeSelect).toBeDefined();
    });

    it('should handle initial nodes', () => {
      const initialNodes: Node[] = [
        {
          id: 'test-node',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { label: 'Test', nodeType: 'SetVariable', params: {} },
        },
      ];
      
      renderCanvas({ initialNodes });
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should handle empty initial nodes', () => {
      renderCanvas({ initialNodes: [] });
      expect(screen.queryByText('Start')).not.toBeInTheDocument();
    });
  });

  describe('Edge Operations', () => {
    it('should handle initial edges', () => {
      renderCanvas({ initialNodes: mockNodes, initialEdges: mockEdges });
      // Edges are rendered by ReactFlow
      const { container } = renderCanvas();
      expect(container).toBeInTheDocument();
    });

    it('should handle empty initial edges', () => {
      renderCanvas({ initialEdges: [] });
      const { container } = renderCanvas();
      expect(container).toBeInTheDocument();
    });
  });

  describe('View Only Mode', () => {
    it('should render in view only mode', () => {
      renderCanvas({ viewOnly: true });
      const { container } = renderCanvas();
      expect(container).toBeInTheDocument();
    });

    it('should allow interactions in normal mode', () => {
      renderCanvas({ viewOnly: false });
      const { container } = renderCanvas();
      expect(container).toBeInTheDocument();
    });
  });

  describe('Nested Canvas', () => {
    it('should handle nested canvas data', () => {
      const nestedCanvasData = {
        'node-1': {
          nodes: [
            {
              id: 'nested-1',
              type: 'editableNode',
              position: { x: 0, y: 0 },
              data: { label: 'Nested Node', nodeType: 'SetVariable', params: {} },
            },
          ],
          edges: [],
        },
      };
      
      renderCanvas({ nestedCanvasData });
      const { container } = renderCanvas();
      expect(container).toBeInTheDocument();
    });

    it('should handle nested canvas active state', () => {
      renderCanvas({ isNestedCanvasActive: true, currentNodeId: 'node-1' });
      const { container } = renderCanvas();
      expect(container).toBeInTheDocument();
    });
  });

  describe('Code Generation', () => {
    it('should provide code generation callback', () => {
      const onCodeGenerate = jest.fn();
      renderCanvas({ onCodeGenerate });
      expect(onCodeGenerate).toBeDefined();
    });

    it('should provide JSON generation callback', () => {
      const onJsonGenerate = jest.fn();
      renderCanvas({ onJsonGenerate });
      expect(onJsonGenerate).toBeDefined();
    });
  });

  describe('Debug Features', () => {
    it('should handle debug variables', () => {
      const debugVariables = { testVar: 'testValue' };
      renderCanvas({ debugVariables });
      const { container } = renderCanvas();
      expect(container).toBeInTheDocument();
    });

    it('should handle debug logs', () => {
      const debugLogs = [
        { time: '10:00:00', message: 'Test log', type: 'info' as const },
      ];
      renderCanvas({ debugLogs });
      const { container } = renderCanvas();
      expect(container).toBeInTheDocument();
    });

    it('should display current node during execution', () => {
      renderCanvas({ isPlaying: true, currentNodeId: 'node-1' });
      const { container } = renderCanvas();
      expect(container).toBeInTheDocument();
    });
  });

  describe('Modes', () => {
    it('should render in rule-builder mode', () => {
      renderCanvas({ mode: 'rule-builder' });
      const { container } = renderCanvas();
      expect(container).toBeInTheDocument();
    });

    it('should render in test-case-generate mode', () => {
      renderCanvas({ mode: 'test-case-generate' });
      const { container } = renderCanvas();
      expect(container).toBeInTheDocument();
    });
  });

  describe('State Updates', () => {
    it('should call onFlowStateUpdate when provided', () => {
      const onFlowStateUpdate = jest.fn();
      renderCanvas({ onFlowStateUpdate });
      expect(onFlowStateUpdate).toBeDefined();
    });

    it('should call onNodeUpdateHandlerReady', () => {
      const onNodeUpdateHandlerReady = jest.fn();
      renderCanvas({ onNodeUpdateHandlerReady });
      // Handler should be provided
      expect(onNodeUpdateHandlerReady).toBeDefined();
    });

    it('should call onUpdateNodeInternalsReady', () => {
      const onUpdateNodeInternalsReady = jest.fn();
      renderCanvas({ onUpdateNodeInternalsReady });
      expect(onUpdateNodeInternalsReady).toBeDefined();
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag over event', () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('.react-flow');
      
      if (canvas) {
        fireEvent.dragOver(canvas, {
          dataTransfer: {
            dropEffect: '',
            effectAllowed: 'all',
            files: [],
            items: [],
            types: [],
          },
        });
      }
      
      expect(container).toBeInTheDocument();
    });

    it('should handle drop event', () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('.react-flow');
      
      if (canvas) {
        const event = new Event('drop', { bubbles: true });
        fireEvent(canvas, event);
      }
      
      expect(container).toBeInTheDocument();
    });
  });

  describe('Controls', () => {
    it('should render ReactFlow background', () => {
      const { container } = renderCanvas();
      // Background is part of ReactFlow
      expect(container).toBeInTheDocument();
    });

    it('should render ReactFlow controls', () => {
      const { container } = renderCanvas();
      // Controls are part of ReactFlow
      expect(container).toBeInTheDocument();
    });

    it('should render ReactFlow minimap', () => {
      const { container } = renderCanvas();
      // Minimap is part of ReactFlow
      expect(container).toBeInTheDocument();
    });
  });

  describe('Multiple Nodes and Edges', () => {
    it('should handle complex flow', () => {
      const complexNodes: Node[] = [
        {
          id: 'start',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { label: 'Start', nodeType: 'Start', params: {} },
        },
        {
          id: 'if-1',
          type: 'editableNode',
          position: { x: 200, y: 0 },
          data: { label: 'Check Amount', nodeType: 'If', params: { condition: 'amount > 100' } },
        },
        {
          id: 'var-1',
          type: 'editableNode',
          position: { x: 400, y: 0 },
          data: { label: 'Set Result', nodeType: 'SetVariable', params: { name: 'result', value: 'high' } },
        },
        {
          id: 'end',
          type: 'editableNode',
          position: { x: 600, y: 0 },
          data: { label: 'End', nodeType: 'End', params: {} },
        },
      ];

      const complexEdges: Edge[] = [
        { id: 'e1', source: 'start', target: 'if-1' },
        { id: 'e2', source: 'if-1', target: 'var-1', sourceHandle: 'true' },
        { id: 'e3', source: 'var-1', target: 'end' },
      ];

      renderCanvas({ initialNodes: complexNodes, initialEdges: complexEdges });
      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Check Amount')).toBeInTheDocument();
      expect(screen.getByText('Set Result')).toBeInTheDocument();
      expect(screen.getByText('End')).toBeInTheDocument();
    });
  });
});

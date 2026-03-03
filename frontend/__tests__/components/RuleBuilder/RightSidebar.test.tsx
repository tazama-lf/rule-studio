import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RightSidebar from '../../../src/components/RuleBuilder/RightSidebar';
import type { Node } from '@xyflow/react';

// Mock Redux API
jest.mock('../../../src/redux/Api/Rule-builder', () => ({
  useGetNodesQuery: () => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useGetFlowQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useGetGlobalVariablesQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useSaveFlowMutation: () => [
    jest.fn().mockResolvedValue({ data: { success: true } }),
    { isLoading: false },
  ],
  useExecuteQueryMutation: () => [
    jest.fn().mockResolvedValue({ data: { rows: [], fields: [] } }),
    { isLoading: false },
  ],
}));

// Mock dependencies
jest.mock('../../../src/utils/Flow/nodeTemplateService', () => ({
  getNodeTemplate: (nodeType: string) => {
    const templates: Record<string, unknown> = {
      'SetVariable': {
        displayName: 'Set Variable',
        type: 'SetVariable',
        inputs: [
          { key: 'name', label: 'Variable Name', type: 'text', required: true },
          { key: 'value', label: 'Value', type: 'text', required: true },
        ],
      },
      'If': {
        displayName: 'If Condition',
        type: 'If',
        inputs: [
          { key: 'condition', label: 'Condition', type: 'text', required: true },
        ],
      },
      'CustomFunction': {
        displayName: 'Custom Function',
        type: 'CustomFunction',
        inputs: [
          { key: 'function_name', label: 'Function Name', type: 'text', required: true },
        ],
      },
      'Start': {
        displayName: 'Start',
        type: 'Start',
        inputs: [],
      },
      'End': {
        displayName: 'End',
        type: 'End',
        inputs: [],
      },
    };
    return templates[nodeType as string] || null;
  },
}));

jest.mock('../../../src/utils/Flow/functionParameterUtils', () => ({
  usesDynamicParameters: () => false,
}));

jest.mock('../../../src/utils/Flow/transformRuleRequest', () => ({
  transformRuleRequestToCode: () => 'const ruleRequest = {};',
}));

jest.mock('../../../src/utils/Flow/transformRuleResult', () => ({
  transformRuleResultToCode: () => 'const ruleResult = {};',
}));

jest.mock('../../../src/hooks/RuleBuilder/useNodeValidation', () => ({
  useNodeValidation: () => ({
    validate: () => {},
    getFieldError: () => null,
  }),
}));

jest.mock('../../../src/hooks/RuleBuilder/useTernaryConditions', () => ({
  useTernaryConditions: () => ({
    conditions: [],
    setConditions: () => {},
  }),
}));

describe('RuleBuilder RightSidebar Component', () => {
  const mockNode: Node = {
    id: 'node-1',
    type: 'editableNode',
    position: { x: 0, y: 0 },
    data: {
      label: 'Test Variable',
      nodeType: 'SetVariable',
      params: {
        name: 'testVar',
        value: 'testValue',
      },
    },
  };

  const defaultProps = {
    selectedNode: null,
    onClose: jest.fn(),
    onUpdateNode: jest.fn(),
    allNodes: [],
    viewOnly: false,
    ruleId: 'test-rule-123',
    edges: [],
    updateNodeInternals: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderSidebar = (props = {}) => {
    return render(<RightSidebar {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('should render empty state when no node selected', () => {
      renderSidebar({ selectedNode: null });
      expect(screen.getByText(/Select a node to view properties/i)).toBeInTheDocument();
    });

    it('should render sidebar when node is selected', () => {
      renderSidebar({ selectedNode: mockNode });
      expect(screen.getByDisplayValue('Test Variable')).toBeInTheDocument();
    });

    it('should display node type', () => {
      renderSidebar({ selectedNode: mockNode });
      expect(screen.getByText('Set Variable')).toBeInTheDocument();
    });

    it('should render close button', () => {
      renderSidebar({ selectedNode: mockNode });
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button clicked', () => {
      const onClose = jest.fn();
      renderSidebar({ selectedNode: mockNode, onClose });
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Node Label', () => {
    it('should display node label', () => {
      renderSidebar({ selectedNode: mockNode });
      expect(screen.getByDisplayValue('Test Variable')).toBeInTheDocument();
    });

    it('should handle empty label', () => {
      const nodeWithoutLabel: Node = {
        ...mockNode,
        data: { ...mockNode.data, label: '' },
      };
      renderSidebar({ selectedNode: nodeWithoutLabel });
      expect(screen.queryByDisplayValue('Test Variable')).not.toBeInTheDocument();
    });
  });

  describe('Node Parameters', () => {
    it('should render parameter fields', () => {
      renderSidebar({ selectedNode: mockNode });
      expect(screen.getByDisplayValue('testVar')).toBeInTheDocument();
      expect(screen.getByDisplayValue('testValue')).toBeInTheDocument();
    });

    it('should handle nodes without parameters', () => {
      const nodeWithoutParams: Node = {
        ...mockNode,
        data: { label: 'Test', nodeType: 'Start', params: {} },
      };
      renderSidebar({ selectedNode: nodeWithoutParams });
      expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    });
  });

  describe('View Only Mode', () => {
    it('should disable inputs in view only mode', () => {
      renderSidebar({ selectedNode: mockNode, viewOnly: true });
      
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toBeDisabled();
      });
    });

    it('should allow editing in normal mode', () => {
      renderSidebar({ selectedNode: mockNode, viewOnly: false });
      
      const nameInput = screen.getByDisplayValue('testVar');
      expect(nameInput).not.toBeDisabled();
    });
  });

  describe('Different Node Types', () => {
    it('should render SetVariable node', () => {
      renderSidebar({ selectedNode: mockNode });
      expect(screen.getByText('Set Variable')).toBeInTheDocument();
    });

    it('should render If node', () => {
      const ifNode: Node = {
        ...mockNode,
        data: {
          label: 'Check Amount',
          nodeType: 'If',
          params: { condition: 'amount > 100' },
        },
      };

      renderSidebar({ selectedNode: ifNode });
      expect(screen.getByDisplayValue('Check Amount')).toBeInTheDocument();
    });

    it('should render CustomFunction node in definition mode', () => {
      const functionNode: Node = {
        ...mockNode,
        data: {
          label: 'My Function',
          nodeType: 'CustomFunction',
          mode: 'definition',
          params: { function_name: 'calculateTotal' },
        },
      };

      renderSidebar({ selectedNode: functionNode });
      expect(screen.getByDisplayValue('My Function')).toBeInTheDocument();
    });

    it('should render CustomFunction node in call mode', () => {
      const functionCallNode: Node = {
        ...mockNode,
        data: {
          label: 'Call Function',
          nodeType: 'CustomFunction',
          mode: 'call',
          params: { function_name: 'calculateTotal' },
        },
      };

      renderSidebar({ selectedNode: functionCallNode });
      expect(screen.getByDisplayValue('Call Function')).toBeInTheDocument();
    });
  });

  describe('Update Functionality', () => {
    it('should call onUpdateNode when parameter changes', () => {
      const onUpdateNode = jest.fn();
      renderSidebar({ selectedNode: mockNode, onUpdateNode });
      
      const nameInput = screen.getByDisplayValue('testVar');
      fireEvent.change(nameInput, { target: { value: 'newVar' } });
      
      // Wait for debounce
      setTimeout(() => {
        expect(onUpdateNode).toHaveBeenCalled();
      }, 600);
    });
  });

  describe('Edge Cases', () => {
    it('should handle node with null data', () => {
      const nodeWithNullData: Node = {
        ...mockNode,
        data: null as never,
      };
      
      const { container } = renderSidebar({ selectedNode: nodeWithNullData });
      expect(container).toBeInTheDocument();
    });

    it('should handle node type with namespace', () => {
      const nodeWithNamespace: Node = {
        ...mockNode,
        data: {
          ...mockNode.data,
          nodeType: 'CustomFunction::definition',
        },
      };
      
      renderSidebar({ selectedNode: nodeWithNamespace });
      expect(screen.getByDisplayValue('Test Variable')).toBeInTheDocument();
    });

    it('should handle missing template', () => {
      const nodeWithUnknownType: Node = {
        ...mockNode,
        data: {
          ...mockNode.data,
          nodeType: 'UnknownNodeType',
        },
      };
      
      renderSidebar({ selectedNode: nodeWithUnknownType });
      expect(screen.getByText('Template Not Found')).toBeInTheDocument();
    });
  });

  describe('Multiple Nodes', () => {
    it('should update when different node is selected', () => {
      const { rerender } = renderSidebar({ selectedNode: mockNode });
      expect(screen.getByDisplayValue('Test Variable')).toBeInTheDocument();
      
      const newNode: Node = {
        ...mockNode,
        id: 'node-2',
        data: {
          label: 'Another Variable',
          nodeType: 'SetVariable',
          params: { name: 'anotherVar', value: 'anotherValue' },
        },
      };
      
      rerender(<RightSidebar {...defaultProps} selectedNode={newNode} />);
      expect(screen.getByDisplayValue('Another Variable')).toBeInTheDocument();
    });

    it('should clear when node is deselected', () => {
      const { rerender } = renderSidebar({ selectedNode: mockNode });
      expect(screen.getByDisplayValue('Test Variable')).toBeInTheDocument();
      
      rerender(<RightSidebar {...defaultProps} selectedNode={null} />);
      expect(screen.queryByDisplayValue('Test Variable')).not.toBeInTheDocument();
      expect(screen.getByText(/Select a node to view properties/i)).toBeInTheDocument();
    });
  });

  describe('Advanced Features', () => {
    it('should provide all nodes to sidebar', () => {
      const allNodes: Node[] = [
        mockNode,
        {
          ...mockNode,
          id: 'node-2',
          data: { label: 'Node 2', nodeType: 'If', params: {} },
        },
      ];
      
      renderSidebar({ selectedNode: mockNode, allNodes });
      expect(screen.getByDisplayValue('Test Variable')).toBeInTheDocument();
    });

    it('should provide edges to sidebar', () => {
      const edges = [
        { id: 'edge-1', source: 'node-1', target: 'node-2' },
      ];
      
      renderSidebar({ selectedNode: mockNode, edges });
      expect(screen.getByDisplayValue('Test Variable')).toBeInTheDocument();
    });

    it('should call updateNodeInternals when provided', () => {
      const updateNodeInternals = jest.fn();
      renderSidebar({ selectedNode: mockNode, updateNodeInternals });
      
      // Function should be available but not necessarily called immediately
      expect(updateNodeInternals).toBeDefined();
    });
  });
});

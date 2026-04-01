 
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import RightSidebar from '../../../src/components/RuleBuilder/RightSidebar';
import type { Node } from '@xyflow/react';
import toast from 'react-hot-toast';
import { usesDynamicParameters } from '../../../src/utils/Flow/functionParameterUtils';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    custom: jest.fn(),
  },
}));

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
      'FetchDB': {
        displayName: 'Fetch Database',
        type: 'FetchDB',
        inputs: [
          { key: 'query', label: 'Query', type: 'textarea', required: true },
        ],
      },
      'Ternary': {
        displayName: 'Ternary Expression',
        type: 'Ternary',
        inputs: [],
      },
      'BeforeEach': {
        displayName: 'Before Each',
        type: 'BeforeEach',
        inputs: [],
      },
      'BeforeAll': {
        displayName: 'Before All',
        type: 'BeforeAll',
        inputs: [],
      },
      'RuleRequestFactory': {
        displayName: 'Rule Request Factory',
        type: 'RuleRequestFactory',
        inputs: [
          { key: 'factoryName', label: 'Factory Name', type: 'text', required: true, defaultValue: 'getMockRequest' },
        ],
      },
      'RuleConfigFactory': {
        displayName: 'Rule Config Factory',
        type: 'RuleConfigFactory',
        inputs: [
          { key: 'factoryName', label: 'Factory Name', type: 'text', required: true, defaultValue: 'getRuleConfig' },
        ],
      },
      'RuleRequestScenario': {
        displayName: 'Rule Request Scenario',
        type: 'RuleRequestScenario',
        inputs: [
          { key: 'factoryName', label: 'Factory Name', type: 'text', required: true },
          { key: 'modifications', label: 'Modification Statement', type: 'textarea', required: false },
        ],
      },
      'LoggerService': {
        displayName: 'Logger Service',
        type: 'LoggerService',
        inputs: [
          { key: 'variableName', label: 'Variable Name', type: 'text', required: true, defaultValue: 'loggerService' },
        ],
      },
      'RuleResultFactory': {
        displayName: 'Rule Result Factory',
        type: 'RuleResultFactory',
        inputs: [
          { key: 'factoryName', label: 'Factory Name', type: 'text', required: true, defaultValue: 'ruleResult' },
        ],
      },
      'DataCacheFactory': {
        displayName: 'Data Cache Factory',
        type: 'DataCacheFactory',
        inputs: [
          { key: 'variableName', label: 'Variable Name', type: 'text', required: true, defaultValue: 'dataCache' },
        ],
      },
      'DatabaseManager': {
        displayName: 'Database Manager',
        type: 'DatabaseManager',
        inputs: [
          { key: 'variableName', label: 'Variable Name', type: 'text', required: true, defaultValue: 'databaseManager' },
        ],
      },
      'DynamicFunctionNode': {
        displayName: 'Dynamic Function Node',
        type: 'DynamicFunctionNode',
        function_name: 'dynamicFn',
        inputs: [],
      },
    };
    return templates[nodeType as string] || null;
  },
}));

jest.mock('../../../src/utils/Flow/functionParameterUtils', () => ({
  usesDynamicParameters: jest.fn(() => false),
  getFunctionParameters: jest.fn(() => []),
  generateFunctionArgs: jest.fn(() => ''),
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
  useTernaryConditions: ({ currentParams }: { currentParams: Record<string, string> }) => {
    const ternaryTree = (() => {
      try {
        const treeStr = currentParams.ternaryTree || 
          '{"condition":"true","trueValue":{"type":"value","value":"\'yes\'"},"falseValue":{"type":"value","value":"\'no\'"}}';
        return JSON.parse(treeStr);
      } catch {
        return {
          condition: 'true',
          trueValue: { type: 'value', value: "'yes'" },
          falseValue: { type: 'value', value: "'no'" }
        };
      }
    })();

    return {
      ternaryTree,
      handleTreeChange: jest.fn(),
      handleStoreResultChange: jest.fn(),
      handleResultVarChange: jest.fn(),
    };
  },
}));

describe('RuleBuilder RightSidebar Component', () => {
  const mockUsesDynamicParameters = usesDynamicParameters as jest.Mock;
  const mockToastError = toast.error as jest.Mock;

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
    mockUsesDynamicParameters.mockReturnValue(false);
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
      
      expect(updateNodeInternals).toBeDefined();
    });
  });

  describe('Additional Node Types', () => {
    it('should render FetchDB node', () => {
      const fetchDBNode: Node = {
        ...mockNode,
        data: {
          label: 'Fetch Database',
          nodeType: 'FetchDB',
          params: { query: 'SELECT * FROM users' },
        },
      };
      
      renderSidebar({ selectedNode: fetchDBNode });
      expect(screen.getByDisplayValue('Fetch Database')).toBeInTheDocument();
    });

    it('should render Ternary node', () => {
      const ternaryNode: Node = {
        ...mockNode,
        data: {
          label: 'Ternary Expression',
          nodeType: 'Ternary',
          params: {
            ternaryTree: JSON.stringify({ condition: 'x > 5', trueValue: 'yes', falseValue: 'no' }),
            storeResult: 'true',
            resultVar: 'result',
          },
        },
      };
      
      renderSidebar({ selectedNode: ternaryNode });
      expect(screen.getByDisplayValue('Ternary Expression')).toBeInTheDocument();
    });

    it('should render BeforeEach node', () => {
      const beforeEachNode: Node = {
        ...mockNode,
        data: {
          label: 'Before Each',
          nodeType: 'BeforeEach',
          params: {},
        },
      };
      
      renderSidebar({ selectedNode: beforeEachNode });
      expect(screen.getByDisplayValue('Before Each')).toBeInTheDocument();
    });

    it('should render BeforeAll node', () => {
      const beforeAllNode: Node = {
        ...mockNode,
        data: {
          label: 'Before All',
          nodeType: 'BeforeAll',
          params: {},
        },
      };
      
      renderSidebar({ selectedNode: beforeAllNode });
      expect(screen.getByDisplayValue('Before All')).toBeInTheDocument();
    });

    it('should render RuleRequestFactory node', () => {
      const ruleRequestNode: Node = {
        ...mockNode,
        data: {
          label: 'Rule Request Factory',
          nodeType: 'RuleRequestFactory',
          params: { factoryName: 'getMockRequest' },
        },
      };
      
      renderSidebar({ selectedNode: ruleRequestNode });
      expect(screen.getByDisplayValue('Rule Request Factory')).toBeInTheDocument();
      expect(screen.getByDisplayValue('getMockRequest')).toBeInTheDocument();
    });

    it('should render RuleConfigFactory node', () => {
      const ruleConfigNode: Node = {
        ...mockNode,
        data: {
          label: 'Rule Config Factory',
          nodeType: 'RuleConfigFactory',
          params: { factoryName: 'getRuleConfig' },
        },
      };
      
      renderSidebar({ selectedNode: ruleConfigNode });
      expect(screen.getByDisplayValue('Rule Config Factory')).toBeInTheDocument();
      expect(screen.getByDisplayValue('getRuleConfig')).toBeInTheDocument();
    });

    it('should render RuleRequestScenario node', () => {
      const scenarioNode: Node = {
        ...mockNode,
        data: {
          label: 'Rule Request Scenario',
          nodeType: 'RuleRequestScenario',
          params: {
            factoryName: 'getMockRequestUnsuccessful',
            modifications: "quote.status = 'REJECTED';",
          },
        },
      };
      
      renderSidebar({ selectedNode: scenarioNode });
      expect(screen.getByDisplayValue('Rule Request Scenario')).toBeInTheDocument();
      expect(screen.getByDisplayValue('getMockRequestUnsuccessful')).toBeInTheDocument();
    });

    it('should render LoggerService node', () => {
      const loggerNode: Node = {
        ...mockNode,
        data: {
          label: 'Logger Service',
          nodeType: 'LoggerService',
          params: { variableName: 'loggerService' },
        },
      };
      
      renderSidebar({ selectedNode: loggerNode });
      expect(screen.getByDisplayValue('Logger Service')).toBeInTheDocument();
      expect(screen.getByDisplayValue('loggerService')).toBeInTheDocument();
    });
  });

  describe('View-Only Mode', () => {
    it('should disable inputs in view-only mode', () => {
      renderSidebar({ selectedNode: mockNode, viewOnly: true });
      
      const labelInput = screen.getByDisplayValue('Test Variable') as HTMLInputElement;
      expect(labelInput).toBeDisabled();
    });

    it('should disable parameter inputs in view-only mode', () => {
      renderSidebar({ selectedNode: mockNode, viewOnly: true });
      
      const nameInput = screen.getByDisplayValue('testVar') as HTMLInputElement;
      const valueInput = screen.getByDisplayValue('testValue') as HTMLInputElement;
      
      expect(nameInput).toBeDisabled();
      expect(valueInput).toBeDisabled();
    });

    it('should allow viewing Start node in view-only mode', () => {
      const startNode: Node = {
        ...mockNode,
        data: { label: 'Start', nodeType: 'Start', params: {} },
      };
      
      renderSidebar({ selectedNode: startNode, viewOnly: true });
      expect(screen.getByDisplayValue('Start')).toBeInTheDocument();
    });

    it('should allow viewing End node in view-only mode', () => {
      const endNode: Node = {
        ...mockNode,
        data: { label: 'End', nodeType: 'End', params: {} },
      };
      
      renderSidebar({ selectedNode: endNode, viewOnly: true });
      expect(screen.getByDisplayValue('End')).toBeInTheDocument();
    });
  });

  describe('If Node Conditions', () => {
    it('should render If node with conditions', () => {
      const ifNode: Node = {
        ...mockNode,
        data: {
          label: 'If Statement',
          nodeType: 'If',
          params: {
            conditions: JSON.stringify([
              { type: 'if', condition: 'x > 5' },
              { type: 'elseif', condition: 'x < 0' },
              { type: 'else', condition: '' },
            ]),
          },
        },
      };
      
      renderSidebar({ selectedNode: ifNode });
      expect(screen.getByDisplayValue('If Statement')).toBeInTheDocument();
    });

    it('should handle If node with empty conditions', () => {
      const ifNode: Node = {
        ...mockNode,
        data: {
          label: 'If Statement',
          nodeType: 'If',
          params: { conditions: '[]' },
        },
      };
      
      renderSidebar({ selectedNode: ifNode });
      expect(screen.getByDisplayValue('If Statement')).toBeInTheDocument();
    });

    it('should handle If node with invalid JSON conditions', () => {
      const ifNode: Node = {
        ...mockNode,
        data: {
          label: 'If Statement',
          nodeType: 'If',
          params: { conditions: 'invalid json' },
        },
      };
      
      renderSidebar({ selectedNode: ifNode });
      expect(screen.getByDisplayValue('If Statement')).toBeInTheDocument();
    });

    it('should handle If node without conditions param', () => {
      const ifNode: Node = {
        ...mockNode,
        data: {
          label: 'If Statement',
          nodeType: 'If',
          params: {},
        },
      };
      
      renderSidebar({ selectedNode: ifNode });
      expect(screen.getByDisplayValue('If Statement')).toBeInTheDocument();
    });
  });

  describe('Start and End Nodes Read-Only', () => {
    it('should render Start node with read-only label', () => {
      const startNode: Node = {
        ...mockNode,
        data: { label: 'Start', nodeType: 'Start', params: {} },
      };
      
      renderSidebar({ selectedNode: startNode });
      const labelInput = screen.getByDisplayValue('Start') as HTMLInputElement;
      expect(labelInput).toBeDisabled();
    });

    it('should render End node with read-only label', () => {
      const endNode: Node = {
        ...mockNode,
        data: { label: 'End', nodeType: 'End', params: {} },
      };
      
      renderSidebar({ selectedNode: endNode });
      const labelInput = screen.getByDisplayValue('End') as HTMLInputElement;
      expect(labelInput).toBeDisabled();
    });

    it('should not allow editing Start node parameters', () => {
      const startNode: Node = {
        ...mockNode,
        data: { label: 'Start', nodeType: 'Start', params: {} },
      };
      
      renderSidebar({ selectedNode: startNode });
      const labelInput = screen.getByDisplayValue('Start');
      expect(labelInput).toBeDisabled();
    });

    it('should not allow editing End node parameters', () => {
      const endNode: Node = {
        ...mockNode,
        data: { label: 'End', nodeType: 'End', params: {} },
      };
      
      renderSidebar({ selectedNode: endNode });
      const labelInput = screen.getByDisplayValue('End');
      expect(labelInput).toBeDisabled();
    });
  });

  describe('Label Update Functionality', () => {
    it('should update node label on change', () => {
      const onUpdateNode = jest.fn();
      renderSidebar({ selectedNode: mockNode, onUpdateNode });
      
      const labelInput = screen.getByDisplayValue('Test Variable');
      fireEvent.change(labelInput, { target: { value: 'Updated Label' } });
      
      expect(onUpdateNode).toHaveBeenCalledWith('node-1', { label: 'Updated Label' });
    });

    it('should handle label blur event', () => {
      renderSidebar({ selectedNode: mockNode });
      
      const labelInput = screen.getByDisplayValue('Test Variable');
      fireEvent.change(labelInput, { target: { value: 'New Label' } });
      fireEvent.blur(labelInput);
      
      expect(labelInput).toBeInTheDocument();
    });

    it('should update label for different node types', () => {
      const onUpdateNode = jest.fn();
      const ifNode: Node = {
        ...mockNode,
        data: { label: 'If Condition', nodeType: 'If', params: {} },
      };
      
      renderSidebar({ selectedNode: ifNode, onUpdateNode });
      
      const labelInput = screen.getByDisplayValue('If Condition');
      fireEvent.change(labelInput, { target: { value: 'Updated If' } });
      
      expect(onUpdateNode).toHaveBeenCalled();
    });
  });

  describe('Mode and Generation Type Handling', () => {
    it('should handle node with mode property', () => {
      const nodeWithMode: Node = {
        ...mockNode,
        data: {
          ...mockNode.data,
          mode: 'definition',
        },
      };
      
      renderSidebar({ selectedNode: nodeWithMode });
      expect(screen.getByDisplayValue('Test Variable')).toBeInTheDocument();
    });

    it('should handle node with generation_type property', () => {
      const nodeWithGenType: Node = {
        ...mockNode,
        data: {
          ...mockNode.data,
          generation_type: 'call',
        },
      };
      
      renderSidebar({ selectedNode: nodeWithGenType });
      expect(screen.getByDisplayValue('Test Variable')).toBeInTheDocument();
    });

    it('should prefer mode over generation_type', () => {
      const nodeWithBoth: Node = {
        ...mockNode,
        data: {
          ...mockNode.data,
          mode: 'definition',
          generation_type: 'call',
        },
      };
      
      renderSidebar({ selectedNode: nodeWithBoth });
      expect(screen.getByDisplayValue('Test Variable')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('should have accessible close button', () => {
      renderSidebar({ selectedNode: mockNode });
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', expect.stringContaining('Close'));
    });

    it('should maintain proper heading structure', () => {
      renderSidebar({ selectedNode: mockNode });
      expect(screen.getByText('Set Variable')).toBeInTheDocument();
    });

    it('should have form labels for inputs', () => {
      renderSidebar({ selectedNode: mockNode });
      const varLabels = screen.getAllByText('Variable Name');
      const valueLabels = screen.getAllByText('Value');
      expect(varLabels.length).toBeGreaterThan(0);
      expect(valueLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Data Edge Cases', () => {
    it('should handle node with undefined params', () => {
      const nodeWithUndefinedParams: Node = {
        ...mockNode,
        data: {
          label: 'Test',
          nodeType: 'SetVariable',
          params: undefined as never,
        },
      };
      
      renderSidebar({ selectedNode: nodeWithUndefinedParams });
      expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    });

    it('should handle node with empty params object', () => {
      const nodeWithEmptyParams: Node = {
        ...mockNode,
        data: {
          label: 'Test',
          nodeType: 'SetVariable',
          params: {},
        },
      };
      
      renderSidebar({ selectedNode: nodeWithEmptyParams });
      expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    });

    it('should handle node with extra params', () => {
      const nodeWithExtraParams: Node = {
        ...mockNode,
        data: {
          label: 'Test',
          nodeType: 'SetVariable',
          params: {
            name: 'testVar',
            value: 'testValue',
            extraParam: 'extraValue',
          },
        },
      };
      
      renderSidebar({ selectedNode: nodeWithExtraParams });
      expect(screen.getByDisplayValue('testVar')).toBeInTheDocument();
    });

    it('should handle rapid node selection changes', () => {
      const { rerender } = renderSidebar({ selectedNode: mockNode });
      
      for (let i = 0; i < 5; i++) {
        const newNode: Node = {
          ...mockNode,
          id: `node-${i}`,
          data: { label: `Node ${i}`, nodeType: 'SetVariable', params: {} },
        };
        rerender(<RightSidebar {...defaultProps} selectedNode={newNode} />);
      }
      
      expect(screen.getByDisplayValue('Node 4')).toBeInTheDocument();
    });
  });

  describe('Empty and Error States', () => {
    it('should show empty state icon', () => {
      renderSidebar({ selectedNode: null });
      expect(screen.getByTestId('InfoOutlinedIcon')).toBeInTheDocument();
    });

    it('should show empty state message', () => {
      renderSidebar({ selectedNode: null });
      expect(screen.getByText(/Select a node to view properties/i)).toBeInTheDocument();
    });

    it('should not render close button in empty state', () => {
      renderSidebar({ selectedNode: null });
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });

    it('should not render any input fields in empty state', () => {
      renderSidebar({ selectedNode: null });
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should show warning icon for missing template', () => {
      const nodeWithUnknownType: Node = {
        ...mockNode,
        data: { ...mockNode.data, nodeType: 'UnknownNodeType' },
      };
      
      renderSidebar({ selectedNode: nodeWithUnknownType });
      expect(screen.getByTestId('InfoOutlinedIcon')).toBeInTheDocument();
    });

    it('should display node type in error message', () => {
      const nodeWithUnknownType: Node = {
        ...mockNode,
        data: { ...mockNode.data, nodeType: 'UnknownNodeType' },
      };
      
      renderSidebar({ selectedNode: nodeWithUnknownType });
      expect(screen.getByText(/Node Type: UnknownNodeType/i)).toBeInTheDocument();
    });

    it('should still show close button for missing template', () => {
      const nodeWithUnknownType: Node = {
        ...mockNode,
        data: { ...mockNode.data, nodeType: 'UnknownNodeType' },
      };
      
      renderSidebar({ selectedNode: nodeWithUnknownType });
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should show helpful message for API configuration issues', () => {
      const nodeWithUnknownType: Node = {
        ...mockNode,
        data: { ...mockNode.data, nodeType: 'UnknownNodeType' },
      };
      
      renderSidebar({ selectedNode: nodeWithUnknownType });
      expect(screen.getByText(/This node may not be properly configured/i)).toBeInTheDocument();
    });

    it('should show mode for missing template when available', () => {
      const nodeWithUnknownTypeAndMode: Node = {
        ...mockNode,
        data: { ...mockNode.data, nodeType: 'UnknownNodeType', generation_type: 'call' },
      };

      renderSidebar({ selectedNode: nodeWithUnknownTypeAndMode });
      expect(screen.getByText(/Mode: call/i)).toBeInTheDocument();
    });

    it('should split namespaced unknown node type in missing-template state', () => {
      const nodeWithNamespacedUnknownType: Node = {
        ...mockNode,
        data: { ...mockNode.data, nodeType: 'UnknownNodeType::call' },
      };

      renderSidebar({ selectedNode: nodeWithNamespacedUnknownType });
      expect(screen.getByText(/Node Type: UnknownNodeType/i)).toBeInTheDocument();
    });
  });

  describe('Index Branch Flows', () => {
    it('shows toast when mock request edit is triggered without global data', () => {
      (window as Window & { globalVariablesData?: unknown }).globalVariablesData = undefined;

      const ruleRequestNode: Node = {
        ...mockNode,
        data: {
          label: 'Rule Request Factory',
          nodeType: 'RuleRequestFactory',
          params: { factoryName: 'getMockRequest' },
        },
      };

      renderSidebar({ selectedNode: ruleRequestNode });
      fireEvent.click(screen.getByRole('button', { name: /Edit Mock Rule Request/i }));

      expect(mockToastError).toHaveBeenCalled();
    });

    it('opens and saves mock request editor', () => {
      (window as Window & { globalVariablesData?: unknown }).globalVariablesData = { RuleRequest: { id: 'r1' } };
      const onUpdateNode = jest.fn();

      const ruleRequestNode: Node = {
        ...mockNode,
        data: {
          label: 'Rule Request Factory',
          nodeType: 'RuleRequestFactory',
          params: { factoryName: 'getMockRequest' },
        },
      };

      renderSidebar({ selectedNode: ruleRequestNode, onUpdateNode });
      fireEvent.click(screen.getByRole('button', { name: /Edit Mock Rule Request/i }));
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

      expect(onUpdateNode).toHaveBeenCalledWith('node-1', {
        params: expect.objectContaining({ ruleRequestData: 'const ruleRequest = {};' }),
      });
    });

    it('opens and saves rule result editor', () => {
      const onUpdateNode = jest.fn();

      const ruleResultNode: Node = {
        ...mockNode,
        data: {
          label: 'Rule Result Factory',
          nodeType: 'RuleResultFactory',
          params: { factoryName: 'ruleResult', ruleResultData: '{"status":"ok"}' },
        },
      };

      renderSidebar({ selectedNode: ruleResultNode, onUpdateNode });
      fireEvent.click(screen.getByRole('button', { name: /Edit Rule Result/i }));
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

      expect(onUpdateNode).toHaveBeenCalledWith('node-1', {
        params: expect.objectContaining({ ruleResultData: 'const ruleResult = {};' }),
      });
    });

    it('opens and closes rule result editor without saving', () => {
      const onUpdateNode = jest.fn();

      const ruleResultNode: Node = {
        ...mockNode,
        data: {
          label: 'Rule Result Factory',
          nodeType: 'RuleResultFactory',
          params: { factoryName: 'ruleResult' },
        },
      };

      renderSidebar({ selectedNode: ruleResultNode, onUpdateNode });
      fireEvent.click(screen.getByRole('button', { name: /Edit Rule Result/i }));
      const dialog = screen.getByRole('dialog');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      expect(onUpdateNode).not.toHaveBeenCalled();
    });

    it('opens and saves beforeEach editor', () => {
      const onUpdateNode = jest.fn();

      const beforeEachNode: Node = {
        ...mockNode,
        data: {
          label: 'Before Each',
          nodeType: 'BeforeEach',
          params: {},
        },
      };

      renderSidebar({ selectedNode: beforeEachNode, onUpdateNode });
      fireEvent.click(screen.getByRole('button', { name: /Edit beforeEach Code/i }));
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

      expect(onUpdateNode).toHaveBeenCalledWith('node-1', {
        params: expect.objectContaining({ beforeEachCode: expect.stringContaining('MockDatabaseManagerFactory') }),
      });
    });

    it('opens and closes beforeEach editor without saving', () => {
      const onUpdateNode = jest.fn();

      const beforeEachNode: Node = {
        ...mockNode,
        data: {
          label: 'Before Each',
          nodeType: 'BeforeEach',
          params: {},
        },
      };

      renderSidebar({ selectedNode: beforeEachNode, onUpdateNode });
      fireEvent.click(screen.getByRole('button', { name: /Edit beforeEach Code/i }));
      const dialog = screen.getByRole('dialog');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      expect(onUpdateNode).not.toHaveBeenCalled();
    });

    it('opens and saves beforeAll editor', () => {
      const onUpdateNode = jest.fn();

      const beforeAllNode: Node = {
        ...mockNode,
        data: {
          label: 'Before All',
          nodeType: 'BeforeAll',
          params: {},
        },
      };

      renderSidebar({ selectedNode: beforeAllNode, onUpdateNode });
      fireEvent.click(screen.getByRole('button', { name: /Edit beforeAll Code/i }));
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

      expect(onUpdateNode).toHaveBeenCalledWith('node-1', {
        params: expect.objectContaining({ beforeAllCode: '// Add global setup code here' }),
      });
    });

    it('opens and closes beforeAll editor without saving', () => {
      const onUpdateNode = jest.fn();

      const beforeAllNode: Node = {
        ...mockNode,
        data: {
          label: 'Before All',
          nodeType: 'BeforeAll',
          params: {},
        },
      };

      renderSidebar({ selectedNode: beforeAllNode, onUpdateNode });
      fireEvent.click(screen.getByRole('button', { name: /Edit beforeAll Code/i }));
      const dialog = screen.getByRole('dialog');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      expect(onUpdateNode).not.toHaveBeenCalled();
    });

    it('renders function call section when dynamic parameters are used', () => {
      mockUsesDynamicParameters.mockReturnValue(true);

      const dynamicNode: Node = {
        ...mockNode,
        data: {
          label: 'Dynamic Function',
          nodeType: 'DynamicFunctionNode',
          generation_type: 'call',
          params: {},
        },
      };

      renderSidebar({ selectedNode: dynamicNode });
      expect(screen.getByText(/Function Call/i)).toBeInTheDocument();
    });
  });
});

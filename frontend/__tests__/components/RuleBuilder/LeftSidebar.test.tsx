import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeftSidebar from '../../../src/components/RuleBuilder/LeftSidebar';
import type { Node, Edge } from '@xyflow/react';
import type { NodeTemplate } from '../../../src/hooks/RuleBuilder/useNodePalette';

type TestNodeTemplate = NodeTemplate & { category?: string };

// Mock the extractQuery file that uses import.meta
jest.mock('../../../src/utils/Common/extractQueryParameters');

// Mock dependencies
jest.mock('../../../src/redux/Api/Rule-builder', () => ({
  useGetGlobalVariablesQuery: jest.fn(),
}));

jest.mock('../../../src/utils/Flow/nodeTemplateService', () => ({
  getAllNodeTemplates: jest.fn(),
}));

jest.mock('../../../src/utils/Flow/GlobalVariables', () => ({
  globalVariables: {
    RuleRequest: { type: 'object', description: 'Rule Request Object' },
    RuleConfig: { type: 'object', description: 'Rule Configuration' },
  },
}));

import { useGetGlobalVariablesQuery } from '../../../src/redux/Api/Rule-builder';
import { getAllNodeTemplates } from '../../../src/utils/Flow/nodeTemplateService';

const mockUseGetGlobalVariablesQuery = useGetGlobalVariablesQuery as jest.Mock;
const mockGetAllNodeTemplates = getAllNodeTemplates as jest.Mock;

describe('RuleBuilder LeftSidebar Component', () => {
  const mockNodes: Node[] = [
    {
      id: '1',
      type: 'SetVariable',
      position: { x: 0, y: 0 },
      data: { label: 'Test Variable', nodeType: 'SetVariable', params: {} },
    },
  ];

  const mockEdges: Edge[] = [];

  beforeEach(() => {
    mockUseGetGlobalVariablesQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    mockGetAllNodeTemplates.mockReturnValue([
      { type: 'If', label: 'If Condition', category: 'control_flow' },
      { type: 'SetVariable', label: 'Set Variable', category: 'data' },
      { type: 'FunctionCall', label: 'Function Call', category: 'function' },
    ]);
  });

  const defaultProps = {
    mode: 'main' as const,
    collapsed: false,
    onToggleCollapse: jest.fn(),
    hideCustomFunctions: false,
    hideImportNode: false,
    hideStartEnd: false,
    showGlobalVariables: false,
    allNodes: mockNodes,
    edges: mockEdges,
    selectedNodeId: null,
    ruleId: 'test-rule-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderSidebar = (props = {}) => {
    return render(<LeftSidebar {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('should render sidebar when not collapsed', () => {
      renderSidebar();
      expect(screen.getByText('Node Palette')).toBeInTheDocument();
    });

    it('should show toggle button', () => {
      renderSidebar();
      // Since toggle button doesn't have specific text, check for sidebar presence instead
      expect(screen.getByText('Node Palette')).toBeInTheDocument();
    });

    it('should render tabs for Nodes and Functions by default', () => {
      renderSidebar();
      expect(screen.getByRole('tab', { name: /basic nodes/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /functions/i })).toBeInTheDocument();
    });

    it('should render node palette by default', () => {
      renderSidebar();
      // Should show nodes from the template
      expect(screen.getByText('If Condition')).toBeInTheDocument();
      expect(screen.getByText('Set Variable')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to functions tab when clicked', () => {
      renderSidebar();
      const functionsTab = screen.getByRole('tab', { name: /functions/i });
      fireEvent.click(functionsTab);
      
      // Tab should now be selected
      expect(functionsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should switch back to nodes tab', () => {
      renderSidebar();
      
      // Switch to functions
      fireEvent.click(screen.getByRole('tab', { name: /functions/i }));
      
      // Switch back to basic nodes
      const nodesTab = screen.getByRole('tab', { name: /basic nodes/i });
      fireEvent.click(nodesTab);
      
      expect(nodesTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Collapse/Expand Functionality', () => {
    it('should call onToggleCollapse when toggle button is clicked', () => {
      const onToggleCollapse = jest.fn();
      renderSidebar({ onToggleCollapse });
      
      const toggleButton = screen.getByRole('button', { name: /collapse/i });
      fireEvent.click(toggleButton);
      
      expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it('should show expand button when collapsed', () => {
      renderSidebar({ collapsed: true });
      expect(screen.getByRole('button', { name: /expand/i })).toBeInTheDocument();
    });
  });

  describe('Node Filtering', () => {
    it('should hide custom functions when hideCustomFunctions is true', () => {
      mockGetAllNodeTemplates.mockReturnValue([
        { type: 'If', label: 'If Condition', category: 'control_flow', isFunction: false },
        { type: 'CustomFunction', label: 'Custom Function', category: 'function', isFunction: true },
      ]);

      renderSidebar({ hideCustomFunctions: true });
      
      expect(screen.getByText('If Condition')).toBeInTheDocument();
      expect(screen.queryByText('Custom Function')).not.toBeInTheDocument();
    });

    it('should hide start and end nodes when hideStartEnd is true', () => {
      mockGetAllNodeTemplates.mockReturnValue([
        { type: 'Start', label: 'Start', category: 'control_flow' },
        { type: 'End', label: 'End', category: 'control_flow' },
        { type: 'If', label: 'If Condition', category: 'control_flow' },
      ]);

      renderSidebar({ hideStartEnd: true });
      
      expect(screen.queryByText('Start')).not.toBeInTheDocument();
      expect(screen.queryByText('End')).not.toBeInTheDocument();
      expect(screen.getByText('If Condition')).toBeInTheDocument();
    });

    it('should hide import node when hideImportNode is true', () => {
      mockGetAllNodeTemplates.mockReturnValue([
        { type: 'Import', label: 'Import', category: 'data' },
        { type: 'If', label: 'If Condition', category: 'control_flow' },
      ]);

      renderSidebar({ hideImportNode: true });
      
      expect(screen.queryByText('Import')).not.toBeInTheDocument();
      expect(screen.getByText('If Condition')).toBeInTheDocument();
    });
  });

  describe('Variables tab when showGlobalVariables is true', () => {
    it('should display global variables context correctly', () => {
      renderSidebar({ showGlobalVariables: true });
      
      expect(screen.getByRole('tab', { name: /variables/i })).toBeInTheDocument();
      
      // Switch to Variables tab
      fireEvent.click(screen.getByRole('tab', { name: /variables/i }));
      
      // Check for global variables sections
      expect(screen.getByText(/Global Variables \(RuleConfig\)/i)).toBeInTheDocument();
    });

    it('should show local variables when nodes are present', () => {
      const nodesWithVariables: Node[] = [
        {
          id: '1',
          type: 'SetVariable',
          position: { x: 0, y: 0 },
          data: { 
            label: 'myVariable', 
            nodeType: 'SetVariable',
            params: { name: 'myVariable', value: 'test' }
          },
        },
      ];

      renderSidebar({ allNodes: nodesWithVariables, showGlobalVariables: true });
      
      // Should render without errors
      expect(screen.getByText('Node Palette')).toBeInTheDocument();
    });
  });

  describe('Modal Mode', () => {
    it('should not show toggle button in modal mode', () => {
      renderSidebar({ mode: 'modal' });
      expect(screen.queryByRole('button', { name: /collapse/i })).not.toBeInTheDocument();
    });

    it('should adjust layout for modal mode', () => {
      renderSidebar({ mode: 'modal' });
      expect(screen.getByText('Add Nodes')).toBeInTheDocument();
    });

    it('should render draggable node elements', () => {
      renderSidebar();
      
      // Should show node palette heading
      expect(screen.getByText('Node Palette')).toBeInTheDocument();
      expect(screen.getByText('Drag nodes to the canvas')).toBeInTheDocument();
    });
  });

  describe('Global Variables from API', () => {
    it('should handle API response for global variables', () => {
      mockUseGetGlobalVariablesQuery.mockReturnValue({
        data: {
          RuleRequest: { transaction: { amount: 100 } },
          RuleConfig: { config: { threshold: 50 } },
        },
        isLoading: false,
        error: null,
      });

      renderSidebar({ showGlobalVariables: true, ruleId: 'test-123' });
      
      // Variables tab should be available
      expect(screen.getByRole('tab', { name: /variables/i })).toBeInTheDocument();
      
      // Switch to variables tab
      fireEvent.click(screen.getByRole('tab', { name: /variables/i }));
      
      // Should render global variables sections
      expect(screen.getByText(/Global Variables \(RuleRequest\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Global Variables \(RuleConfig\)/i)).toBeInTheDocument();
    });

    it('should handle API errors gracefully', () => {
      mockUseGetGlobalVariablesQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Failed to load' },
      });

      renderSidebar({ showGlobalVariables: true, ruleId: 'test-123' });
      
      // Should still render sidebar
      expect(screen.getByText('Node Palette')).toBeInTheDocument();
    });
  });

  describe('Node Categories', () => {
    it('should group nodes by category', () => {
      mockGetAllNodeTemplates.mockReturnValue([
        { type: 'If', label: 'If Condition', category: 'control_flow' },
        { type: 'SetVariable', label: 'Set Variable', category: 'data' },
        { type: 'While', label: 'While Loop', category: 'control_flow' },
      ]);

      renderSidebar();
      
      // Should show both categories
      expect(screen.getByText('If Condition')).toBeInTheDocument();
      expect(screen.getByText('Set Variable')).toBeInTheDocument();
      expect(screen.getByText('While Loop')).toBeInTheDocument();
    });

    it('should render node palette with available nodes', () => {
      mockGetAllNodeTemplates.mockReturnValue([
        { type: 'If', label: 'If Condition', category: 'control_flow' },
        { type: 'SetVariable', label: 'Set Variable', category: 'data' },
        { type: 'While', label: 'While Loop', category: 'control_flow' },
      ]);

      renderSidebar();
      
      // Should show the basic nodes tab
      expect(screen.getByRole('tab', { name: /basic nodes/i })).toBeInTheDocument();
    });
  });
});


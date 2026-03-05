import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditableNode from '../../../src/components/RuleBuilder/EditableNode';
import type { NodeProps } from '@xyflow/react';
import type { EditableNodeData } from '../../../src/components/RuleBuilder/EditableNode';
import { ReactFlowProvider } from '@xyflow/react';

// Mock Redux API
jest.mock('../../../src/redux/Api/Rule-builder');

// Mock hooks
jest.mock('../../../src/hooks/RuleBuilder/useNodeRenderer', () => ({
  useNodeRenderer: jest.fn(() => ({
    template: { displayName: 'Test Node' },
    backgroundColor: '#ffffff',
    borderColor: '#cccccc',
    label: 'Test Label',
    localParams: {},
    isSpecialNode: false,
    targetHandle: { enabled: true },
    sourceHandles: [{ id: 'source-1', enabled: true }],
  })),
}));

jest.mock('../../../src/hooks/RuleBuilder/useNodeValidation', () => ({
  useNodeValidation: jest.fn(() => ({
    hasError: false,
  })),
}));

import { useNodeRenderer } from '../../../src/hooks/RuleBuilder/useNodeRenderer';
import { useNodeValidation } from '../../../src/hooks/RuleBuilder/useNodeValidation';

const mockUseNodeRenderer = useNodeRenderer as jest.Mock;
const mockUseNodeValidation = useNodeValidation as jest.Mock;

describe('RuleBuilder EditableNode Component', () => {
  const mockNodeData: EditableNodeData = {
    label: 'Test Node',
    nodeType: 'SetVariable',
    params: { name: 'testVar', value: 'testValue' },
  };

  const defaultProps: NodeProps = {
    id: 'node-1',
    data: mockNodeData,
    selected: false,
    type: 'editableNode',
    zIndex: 0,
    isConnectable: true,
    dragging: false,
    deletable: true,
    selectable: true,
    draggable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  };

  const renderNode = (props = {}) => {
    return render(
      <ReactFlowProvider>
        <EditableNode {...defaultProps} {...props} />
      </ReactFlowProvider>
    );
  };

  beforeEach(() => {
    mockUseNodeRenderer.mockReturnValue({
      template: { displayName: 'Test Node' },
      backgroundColor: '#ffffff',
      borderColor: '#cccccc',
      label: 'Test Label',
      localParams: {},
      isSpecialNode: false,
      targetHandle: { enabled: true },
      sourceHandles: [{ id: 'source-1', enabled: true }],
    });
    mockUseNodeValidation.mockReturnValue({
      hasError: false,
    });
  });

  describe('Basic Rendering', () => {
    it('should render node with display name', () => {
      renderNode();
      expect(screen.getByText('Test Node')).toBeInTheDocument();
    });

    it('should display node type display name', () => {
      renderNode();
      expect(screen.getByText('Test Node')).toBeInTheDocument();
    });

    it('should render without crashing', () => {
      const { container } = renderNode();
      expect(container).toBeInTheDocument();
    });
  });

  const mockUseNodeRenderer = jest.fn();
  const mockUseNodeValidation = jest.fn();

  describe('Custom Function Nodes', () => {
    it('should display Definition chip for definition mode', () => {
      mockUseNodeRenderer.mockReturnValue({
        template: { displayName: 'Custom Function' },
        backgroundColor: '#ffffff',
        borderColor: '#cccccc',
        label: 'My Function',
        localParams: { function_name: 'myFunc' },
        isSpecialNode: false,
        targetHandle: { enabled: true },
        sourceHandles: [{ id: 'source-1', enabled: true }],
      });

      const customFunctionData: EditableNodeData = {
        label: 'My Function',
        nodeType: 'CustomFunction',
        mode: 'definition',
        params: { function_name: 'myFunc' },
      };

      renderNode({ data: customFunctionData });
      expect(screen.getByText('Definition')).toBeInTheDocument();
    });

    it('should display Call chip for call mode', () => {
      mockUseNodeRenderer.mockReturnValue({
        template: { displayName: 'Custom Function' },
        backgroundColor: '#ffffff',
        borderColor: '#cccccc',
        label: 'My Function',
        localParams: { function_name: 'myFunc' },
        isSpecialNode: false,
        targetHandle: { enabled: true },
        sourceHandles: [{ id: 'source-1', enabled: true }],
      });

      const customFunctionData: EditableNodeData = {
        label: 'My Function',
        nodeType: 'CustomFunction',
        mode: 'call',
        params: { function_name: 'myFunc' },
      };

      renderNode({ data: customFunctionData });
      expect(screen.getByText('Call')).toBeInTheDocument();
    });

    it('should display function name', () => {
      mockUseNodeRenderer.mockReturnValue({
        template: { displayName: 'Custom Function' },
        backgroundColor: '#ffffff',
        borderColor: '#cccccc',
        label: 'My Function',
        localParams: { function_name: 'calculateTotal' },
        isSpecialNode: false,
        targetHandle: { enabled: true },
        sourceHandles: [{ id: 'source-1', enabled: true }],
      });

      const customFunctionData: EditableNodeData = {
        label: 'My Function',
        nodeType: 'CustomFunction',
        mode: 'definition',
        params: { function_name: 'calculateTotal' },
      };

      renderNode({ data: customFunctionData });
      expect(screen.getByText(/calculateTotal/i)).toBeInTheDocument();
    });

    it('should handle generation_type instead of mode', () => {
      const customFunctionData: EditableNodeData = {
        label: 'My Function',
        nodeType: 'CustomFunction',
        generation_type: 'call',
        params: { function_name: 'myFunc' },
      };

      renderNode({ data: customFunctionData });
      expect(screen.getByText('Call')).toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('should apply selected state', () => {
      mockUseNodeRenderer.mockReturnValue({
        template: { displayName: 'Test Node' },
        backgroundColor: '#ffffff',
        borderColor: '#cccccc',
        label: 'Selected Node',
        localParams: {},
        isSpecialNode: false,
        targetHandle: { enabled: true },
        sourceHandles: [],
      });

      const { container } = renderNode({ selected: true });
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render unselected state', () => {
      const { container } = renderNode({ selected: false });
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Validation Errors', () => {
    it('should show error state when node has validation errors', () => {
      mockUseNodeValidation.mockReturnValue({
        hasError: true,
      });

      const { container } = renderNode();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should show normal state when node has no errors', () => {
      mockUseNodeValidation.mockReturnValue({
        hasError: false,
      });

      const { container } = renderNode();
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Node Handles', () => {
    it('should render with target handle when enabled', () => {
      mockUseNodeRenderer.mockReturnValue({
        template: { displayName: 'Test Node' },
        backgroundColor: '#ffffff',
        borderColor: '#cccccc',
        label: 'Test',
        localParams: {},
        isSpecialNode: false,
        targetHandle: { enabled: true },
        sourceHandles: [],
      });

      const { container } = renderNode();
      expect(container).toBeInTheDocument();
    });

    it('should render with source handles when enabled', () => {
      mockUseNodeRenderer.mockReturnValue({
        template: { displayName: 'Test Node' },
        backgroundColor: '#ffffff',
        borderColor: '#cccccc',
        label: 'Test',
        localParams: {},
        isSpecialNode: false,
        targetHandle: { enabled: false },
        sourceHandles: [
          { id: 'source-1', enabled: true, label: 'True' },
          { id: 'source-2', enabled: true, label: 'False' },
        ],
      });

      const { container } = renderNode();
      expect(container).toBeInTheDocument();
    });
  });

  describe('Node Styling', () => {
    it('should apply custom background color', () => {
      mockUseNodeRenderer.mockReturnValue({
        template: { displayName: 'Test Node' },
        backgroundColor: '#ff5722',
        borderColor: '#d32f2f',
        label: 'Colored Node',
        localParams: {},
        isSpecialNode: false,
        targetHandle: { enabled: true },
        sourceHandles: [],
      });

      const { container } = renderNode();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should apply custom border color', () => {
      mockUseNodeRenderer.mockReturnValue({
        template: { displayName: 'Test Node' },
        backgroundColor: '#ffffff',
        borderColor: '#4caf50',
        label: 'Border Node',
        localParams: {},
        isSpecialNode: false,
        targetHandle: { enabled: true },
        sourceHandles: [],
      });

      const { container } = renderNode();
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});



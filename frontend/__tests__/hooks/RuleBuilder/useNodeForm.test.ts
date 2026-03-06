import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useNodeForm } from '../../../src/hooks/RuleBuilder/useNodeForm';
import * as variableManager from '../../../src/utils/Flow/VariableManager';
import type { Node } from '@xyflow/react';

jest.mock('../../../src/utils/Flow/VariableManager');

const mockedVariableManager = variableManager as jest.Mocked<typeof variableManager>;

describe('useNodeForm', () => {
  let mockOnUpdateNode: jest.Mock;
  let mockSelectedNode: Node;
  let allNodes: Node[];

  beforeEach(() => {
    jest.clearAllMocks();

    mockOnUpdateNode = jest.fn();

    mockSelectedNode = {
      id: 'node-1',
      type: 'editableNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Test Node',
        nodeType: 'SetVariable',
        params: {
          name: 'myVar',
          value: 'myValue',
        },
      },
    };

    allNodes = [mockSelectedNode];

    mockedVariableManager.extractVariablesFromNodes.mockReturnValue([]);
    mockedVariableManager.validateVariableName.mockReturnValue({
      isValid: true,
    });
  });

  describe('Initialization', () => {
    it('should return all expected properties and functions', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      expect(result.current).toHaveProperty('currentLabel');
      expect(result.current).toHaveProperty('currentParams');
      expect(result.current).toHaveProperty('variableError');
      expect(result.current).toHaveProperty('inputRefs');
      expect(typeof result.current.handleLabelChange).toBe('function');
      expect(typeof result.current.handleLabelBlur).toBe('function');
      expect(typeof result.current.handleParamChange).toBe('function');
      expect(typeof result.current.handleDrop).toBe('function');
      expect(typeof result.current.handleDragOver).toBe('function');
    });

    it('should initialize with node label and params', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      expect(result.current.currentLabel).toBe('Test Node');
      expect(result.current.currentParams).toEqual({
        name: 'myVar',
        value: 'myValue',
      });
    });

    it('should initialize with null error', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      expect(result.current.variableError).toBeNull();
    });
  });

  describe('handleLabelChange', () => {
    it('should update current label on change', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      const event = {
        target: { value: 'New Label' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleLabelChange(event);
      });

      expect(result.current.currentLabel).toBe('New Label');
    });

    it('should call onUpdateNode with new label', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      const event = {
        target: { value: 'Updated Label' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleLabelChange(event);
      });

      expect(mockOnUpdateNode).toHaveBeenCalledWith('node-1', {
        label: 'Updated Label',
      });
    });

    it('should handle empty label', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      const event = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleLabelChange(event);
      });

      expect(result.current.currentLabel).toBe('');
      expect(mockOnUpdateNode).toHaveBeenCalledWith('node-1', { label: '' });
    });
  });

  describe('handleLabelBlur', () => {
    it('should reset editing state on blur', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      const event = {
        target: { value: 'Changed' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleLabelChange(event);
      });

      act(() => {
        result.current.handleLabelBlur();
      });

      expect(result.current.currentLabel).toBe('Test Node');
    });
  });

  describe('handleParamChange', () => {
    it('should update param value', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      const event = {
        target: { value: 'newValue' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleParamChange('value')(event);
      });

      expect(result.current.currentParams.value).toBe('newValue');
    });

    it('should call onUpdateNode with updated params', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      const event = {
        target: { value: 'updatedValue' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleParamChange('value')(event);
      });

      expect(mockOnUpdateNode).toHaveBeenCalledWith('node-1', {
        params: {
          name: 'myVar',
          value: 'updatedValue',
        },
      });
    });

    it('should validate variable name for SetVariable node', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      const event = {
        target: { value: 'newVarName' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleParamChange('name')(event);
      });

      expect(mockedVariableManager.validateVariableName).toHaveBeenCalledWith(
        'newVarName',
        'node-1',
        []
      );
    });

    it('should set error for invalid variable name', () => {
      mockedVariableManager.validateVariableName.mockReturnValue({
        isValid: false,
        error: 'Variable name already exists',
      });

      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      const event = {
        target: { value: 'duplicateName' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleParamChange('name')(event);
      });

      expect(result.current.variableError).toBe('Variable name already exists');
    });

    it('should clear error for valid variable name', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      // Set error state by providing invalid variable name
      mockedVariableManager.validateVariableName.mockReturnValue({
        isValid: false,
        error: 'Error',
      });

      const event1 = {
        target: { value: 'invalid' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleParamChange('name')(event1);
      });

      expect(result.current.variableError).toBe('Error');

      // Clear error with valid variable name
      mockedVariableManager.validateVariableName.mockReturnValue({
        isValid: true,
      });

      const event2 = {
        target: { value: 'validName' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleParamChange('name')(event2);
      });

      expect(result.current.variableError).toBeNull();
    });

    it('should handle textarea input', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      const event = {
        target: { value: 'multiline\nvalue' },
      } as React.ChangeEvent<HTMLTextAreaElement>;

      act(() => {
        result.current.handleParamChange('description')(event);
      });

      expect(result.current.currentParams.description).toBe('multiline\nvalue');
    });

    it('should not validate for non-SetVariable nodes', () => {
      const otherNode: Node = {
        ...mockSelectedNode,
        data: {
          ...mockSelectedNode.data,
          nodeType: 'If',
        },
      };

      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: otherNode,
          allNodes: [otherNode],
          onUpdateNode: mockOnUpdateNode,
        })
      );

      const event = {
        target: { value: 'anyValue' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleParamChange('condition')(event);
      });

      expect(mockedVariableManager.validateVariableName).not.toHaveBeenCalled();
    });
  });

  describe('handleDrop', () => {
    it('should insert variable path into param', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      const event = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn((key: string) => {
            if (key === 'variablePath') return 'droppedVar.path';
            return '';
          }),
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      const dropHandler = result.current.handleDrop('value');
      dropHandler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOnUpdateNode).toHaveBeenCalledWith('node-1', {
        params: expect.objectContaining({
          value: expect.stringContaining('droppedVar.path'),
        }),
      });
    });

    it('should append variable path to existing value', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      const event = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn((key: string) => {
            if (key === 'variablePath') return 'newVar';
            return '';
          }),
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      const dropHandler = result.current.handleDrop('value');
      dropHandler(event);

      expect(mockOnUpdateNode).toHaveBeenCalledWith('node-1', {
        params: {
          name: 'myVar',
          value: expect.stringContaining('newVar'),
        },
      });
    });

    it('should handle drop when no variable path', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      const event = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn(() => ''),
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      mockOnUpdateNode.mockClear();

      const dropHandler = result.current.handleDrop('value');
      dropHandler(event);

      expect(mockOnUpdateNode).not.toHaveBeenCalled();
    });
  });

  describe('handleDragOver', () => {
    it('should prevent default and set dropEffect', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      const event = {
        preventDefault: jest.fn(),
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      result.current.handleDragOver(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.dataTransfer.dropEffect).toBe('copy');
    });
  });

  describe('Node Change Handling', () => {
    it('should reset state when selected node changes', () => {
      const { result, rerender } = renderHook(
        ({ node }) =>
          useNodeForm({
            selectedNode: node,
            allNodes: [node],
            onUpdateNode: mockOnUpdateNode,
          }),
        { initialProps: { node: mockSelectedNode } }
      );

      const event = {
        target: { value: 'Changed Label' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleLabelChange(event);
      });

      const newNode: Node = {
        id: 'node-2',
        type: 'editableNode',
        position: { x: 200, y: 200 },
        data: {
          label: 'Different Node',
          nodeType: 'If',
          params: {},
        },
      };

      rerender({ node: newNode });

      expect(result.current.currentLabel).toBe('Different Node');
    });

    it('should handle null selected node', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: null,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      expect(result.current.currentLabel).toBe('');
      expect(result.current.currentParams).toEqual({});
    });
  });

  describe('Computed Variable Error', () => {
    it('should show computed error for SetVariable with invalid name', () => {
      mockedVariableManager.validateVariableName.mockReturnValue({
        isValid: false,
        error: 'Invalid variable name',
      });

      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      expect(result.current.variableError).toBe('Invalid variable name');
    });

    it('should not show error for non-SetVariable nodes', () => {
      mockedVariableManager.validateVariableName.mockReturnValue({
        isValid: false,
        error: 'Some error',
      });

      const otherNode: Node = {
        ...mockSelectedNode,
        data: {
          ...mockSelectedNode.data,
          nodeType: 'If',
        },
      };

      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: otherNode,
          allNodes: [otherNode],
          onUpdateNode: mockOnUpdateNode,
        })
      );

      expect(result.current.variableError).toBeNull();
    });

    it('should not show error when variable name is empty', () => {
      const nodeWithoutName: Node = {
        ...mockSelectedNode,
        data: {
          ...mockSelectedNode.data,
          params: {
            name: '',
            value: 'value',
          },
        },
      };

      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: nodeWithoutName,
          allNodes: [nodeWithoutName],
          onUpdateNode: mockOnUpdateNode,
        })
      );

      expect(result.current.variableError).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle node with missing params', () => {
      const nodeWithoutParams: Node = {
        ...mockSelectedNode,
        data: {
          label: 'No Params',
          nodeType: 'Start',
        },
      };

      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: nodeWithoutParams,
          allNodes: [nodeWithoutParams],
          onUpdateNode: mockOnUpdateNode,
        })
      );

      expect(result.current.currentParams).toEqual({});
    });

    it('should handle param change with special characters', () => {
      const { result } = renderHook(() =>
        useNodeForm({
          selectedNode: mockSelectedNode,
          allNodes,
          onUpdateNode: mockOnUpdateNode,
        })
      );

      const event = {
        target: { value: 'value with $pecial ch@rs!' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleParamChange('value')(event);
      });

      expect(result.current.currentParams.value).toBe('value with $pecial ch@rs!');
    });
  });
});

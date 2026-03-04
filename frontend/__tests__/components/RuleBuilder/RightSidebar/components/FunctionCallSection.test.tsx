import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FunctionCallSection from '../../../../../src/components/RuleBuilder/RightSidebar/components/FunctionCallSection';
import type { Node } from '@xyflow/react';

// Mock the utilities
jest.mock('../../../../../src/utils/Flow/functionParameterUtils', () => ({
  getFunctionParameters: jest.fn(),
  generateFunctionArgs: jest.fn((params) => {
    if (!params || params.length === 0) return '';
    return params.map((p: { name: string }) => `${p.name}Value`).join(', ');
  }),
}));

jest.mock('../../../../../src/utils/cursorPreservation', () => ({
  withCursorPreservation: (fn: (e: React.ChangeEvent<HTMLInputElement>) => void) => fn,
}));

describe('FunctionCallSection Component', () => {
  const mockOnParamChange = jest.fn(() => jest.fn());
  const mockOnParamBlur = jest.fn();
  const mockOnDrop = jest.fn(() => jest.fn());
  const mockOnDragOver = jest.fn();
  const mockInputRefs = { current: {} };
  const mockGetFieldError = jest.fn();

  const defaultProps = {
    functionName: 'testFunction',
    currentParams: {},
    onParamChange: mockOnParamChange,
    onParamBlur: mockOnParamBlur,
    onDrop: mockOnDrop,
    onDragOver: mockOnDragOver,
    inputRefs: mockInputRefs,
    isReadOnly: false,
    viewOnly: false,
    getFieldError: mockGetFieldError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockInputRefs.current = {};
  });

  describe('CustomFunction Call Mode - No Function Selected', () => {
    it('should show no functions message when no custom functions available', () => {
      const { getFunctionParameters } = require('../../../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValue(null);

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName=""
          nodeType="CustomFunction"
          allNodes={[]}
        />
      );

      expect(screen.getByText(/no custom functions found/i)).toBeInTheDocument();
      expect(screen.getByText(/create a custom function definition/i)).toBeInTheDocument();
    });

    it('should show function selector when custom functions are available', () => {
      const { getFunctionParameters } = require('../../../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValue(null);

      const customFunctionNode: Node = {
        id: 'func-1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'CustomFunction',
          mode: 'definition',
          params: { function_name: 'myCustomFunc' },
        },
      };

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName=""
          nodeType="CustomFunction"
          allNodes={[customFunctionNode]}
        />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText(/choose which custom function to call/i)).toBeInTheDocument();
    });

    it('should allow selecting a custom function', () => {
      const { getFunctionParameters } = require('../../../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValue(null);

      const customFunctionNode: Node = {
        id: 'func-1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'CustomFunction',
          mode: 'definition',
          params: { function_name: 'myCustomFunc' },
        },
      };

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName=""
          nodeType="CustomFunction"
          allNodes={[customFunctionNode]}
        />
      );

      const selectElement = screen.getByRole('combobox');
      fireEvent.mouseDown(selectElement);

      expect(screen.getByRole('option', { name: 'myCustomFunc' })).toBeInTheDocument();
    });

    it('should filter nodes by generation_type for custom functions', () => {
      const { getFunctionParameters } = require('../../../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValue(null);

      const customFunctionNode: Node = {
        id: 'func-1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'CustomFunction',
          generation_type: 'definition',
          params: { function_name: 'myCustomFunc' },
        },
      };

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName=""
          nodeType="CustomFunction"
          allNodes={[customFunctionNode]}
        />
      );

      const selectElement = screen.getByRole('combobox');
      fireEvent.mouseDown(selectElement);

      expect(screen.getByRole('option', { name: 'myCustomFunc' })).toBeInTheDocument();
    });

    it('should disable function selector in viewOnly mode', () => {
      const { getFunctionParameters } = require('../../../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValue(null);

      const customFunctionNode: Node = {
        id: 'func-1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'CustomFunction',
          mode: 'definition',
          params: { function_name: 'myCustomFunc' },
        },
      };

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName=""
          nodeType="CustomFunction"
          viewOnly={true}
          allNodes={[customFunctionNode]}
        />
      );

      const selectElement = screen.getByRole('combobox');
      expect(selectElement).toHaveAttribute('aria-disabled', 'true');
    });

    it('should disable function selector in readOnly mode', () => {
      const { getFunctionParameters } = require('../../../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValue(null);

      const customFunctionNode: Node = {
        id: 'func-1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'CustomFunction',
          mode: 'definition',
          params: { function_name: 'myCustomFunc' },
        },
      };

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName=""
          nodeType="CustomFunction"
          isReadOnly={true}
          allNodes={[customFunctionNode]}
        />
      );

      const selectElement = screen.getByRole('combobox');
      expect(selectElement).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Function with No Parameters', () => {
    it('should show no parameters message', () => {
      const { getFunctionParameters } = require('../../../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValue([]);

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="myFunction"
        />
      );

      expect(screen.getByText(/no parameters found for function "myFunction"/i)).toBeInTheDocument();
    });

    it('should show function selector for custom function call with no parameters', () => {
      const { getFunctionParameters } = require('../../../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValue([]);

      const customFunctionNode: Node = {
        id: 'func-1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'CustomFunction',
          mode: 'definition',
          params: { function_name: 'myCustomFunc' },
        },
      };

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="myCustomFunc"
          nodeType="CustomFunction"
          currentParams={{ function_name: 'myCustomFunc' }}
          allNodes={[customFunctionNode]}
        />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText(/no parameters found/i)).toBeInTheDocument();
    });
  });

  describe('Function with Parameters', () => {
    const mockParams = [
      { name: 'param1', label: 'First Parameter', type: 'string' },
      { name: 'param2', label: 'Second Parameter', type: 'number' },
    ];

    beforeEach(() => {
      const { getFunctionParameters } = require('../../../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValue(mockParams);
    });

    it('should render function call section with parameters', () => {
      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
        />
      );

      expect(screen.getByText(/function call: testFunction/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first parameter \(string\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/second parameter \(number\)/i)).toBeInTheDocument();
    });

    it('should render store result checkbox', () => {
      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
        />
      );

      expect(screen.getByRole('checkbox', { name: /store result in variable/i })).toBeInTheDocument();
    });

    it('should show result variable input when store result is checked', () => {
      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
          currentParams={{ storeResult: 'true' }}
        />
      );

      expect(screen.getByLabelText(/result variable name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('result')).toBeInTheDocument();
    });

    it('should hide result variable input when store result is unchecked', () => {
      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
          currentParams={{ storeResult: 'false' }}
        />
      );

      expect(screen.queryByLabelText(/result variable name/i)).not.toBeInTheDocument();
    });

    it('should default to storeResult=true when not specified', () => {
      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
          currentParams={{}}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /store result in variable/i });
      expect(checkbox).toBeChecked();
    });

    it('should handle store result checkbox toggle', () => {
      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /store result in variable/i });
      fireEvent.click(checkbox);

      expect(mockOnParamChange).toHaveBeenCalledWith('storeResult');
    });

    it('should render parameter inputs with correct values', () => {
      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
          currentParams={{
            param1: 'value1',
            param2: '42',
          }}
        />
      );

      expect(screen.getByDisplayValue('value1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('42')).toBeInTheDocument();
    });

    it('should show helper text for parameters', () => {
      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
        />
      );

      expect(screen.getByText(/argument 1: param1/i)).toBeInTheDocument();
      expect(screen.getByText(/argument 2: param2/i)).toBeInTheDocument();
    });

    it('should highlight parameter with global variable', () => {
      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
          currentParams={{
            param1: '{{ globalVar }}',
          }}
        />
      );

      expect(screen.getByText(/✓ using global variable/i)).toBeInTheDocument();
    });

    it('should call onParamChange when parameter value changes', () => {
      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
        />
      );

      const input = screen.getByLabelText(/first parameter \(string\)/i);
      fireEvent.change(input, { target: { value: 'newValue' } });

      expect(mockOnParamChange).toHaveBeenCalledWith('param1');
    });

    it('should call onParamBlur when parameter loses focus', () => {
      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
        />
      );

      const input = screen.getByLabelText(/first parameter \(string\)/i);
      fireEvent.blur(input);

      expect(mockOnParamBlur).toHaveBeenCalled();
    });

    it('should disable inputs in viewOnly mode', () => {
      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
          viewOnly={true}
        />
      );

      const input = screen.getByLabelText(/first parameter \(string\)/i);
      expect(input).toBeDisabled();
    });

    it('should disable inputs in readOnly mode', () => {
      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
          isReadOnly={true}
        />
      );

      const input = screen.getByLabelText(/first parameter \(string\)/i);
      expect(input).toBeDisabled();
    });

    it('should show generated code preview', () => {
      const { generateFunctionArgs } = require('../../../../../src/utils/Flow/functionParameterUtils');
      generateFunctionArgs.mockReturnValue('param1Value, param2Value');

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
          currentParams={{ storeResult: 'true', resultVariable: 'myResult' }}
        />
      );

      expect(screen.getByText(/generated code:/i)).toBeInTheDocument();
      expect(screen.getByText(/const myResult = testFunction\(param1Value, param2Value\)/i)).toBeInTheDocument();
    });

    it('should show generated code without result variable when not storing', () => {
      const { generateFunctionArgs } = require('../../../../../src/utils/Flow/functionParameterUtils');
      generateFunctionArgs.mockReturnValue('param1Value, param2Value');

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
          currentParams={{ storeResult: 'false' }}
        />
      );

      expect(screen.getByText(/testFunction\(param1Value, param2Value\)/i)).toBeInTheDocument();
      expect(screen.queryByText(/const/)).not.toBeInTheDocument();
    });

    it('should display field errors', () => {
      mockGetFieldError.mockImplementation((field: string) => {
        if (field === 'param1') return 'Parameter 1 is required';
        return undefined;
      });

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
        />
      );

      expect(screen.getByText('Parameter 1 is required')).toBeInTheDocument();
    });

    it('should display error for result variable', () => {
      mockGetFieldError.mockImplementation((field: string) => {
        if (field === 'resultVariable') return 'Invalid variable name';
        return undefined;
      });

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
          currentParams={{ storeResult: 'true' }}
        />
      );

      expect(screen.getByText('Invalid variable name')).toBeInTheDocument();
    });

    it('should register input refs', () => {
      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
          currentParams={{ storeResult: 'true' }}
        />
      );

      expect(mockInputRefs.current).toHaveProperty('param1');
      expect(mockInputRefs.current).toHaveProperty('param2');
      expect(mockInputRefs.current).toHaveProperty('resultVariable');
    });
  });

  describe('CustomFunction Call with Parameters', () => {
    const mockParams = [
      { name: 'x', label: 'X Value', type: 'number' },
    ];

    beforeEach(() => {
      const { getFunctionParameters } = require('../../../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValue(mockParams);
    });

    it('should show function selector when custom function is selected', () => {
      const customFunctionNode: Node = {
        id: 'func-1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'CustomFunction',
          mode: 'definition',
          params: { function_name: 'myCustomFunc' },
        },
      };

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="myCustomFunc"
          nodeType="CustomFunction"
          currentParams={{ function_name: 'myCustomFunc' }}
          allNodes={[customFunctionNode]}
        />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText(/change function if needed/i)).toBeInTheDocument();
    });

    it('should allow changing the selected function', () => {
      const customFunctionNodes: Node[] = [
        {
          id: 'func-1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'CustomFunction',
            mode: 'definition',
            params: { function_name: 'func1' },
          },
        },
        {
          id: 'func-2',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: {
            nodeType: 'CustomFunction',
            mode: 'definition',
            params: { function_name: 'func2' },
          },
        },
      ];

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="func1"
          nodeType="CustomFunction"
          currentParams={{ function_name: 'func1' }}
          allNodes={customFunctionNodes}
        />
      );

      const selectElement = screen.getByRole('combobox');
      fireEvent.mouseDown(selectElement);

      expect(screen.getByRole('option', { name: 'func1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'func2' })).toBeInTheDocument();
    });

    it('should not show function selector when no custom functions available', () => {
      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="myCustomFunc"
          nodeType="CustomFunction"
          currentParams={{ function_name: 'myCustomFunc' }}
          allNodes={[]}
        />
      );

      expect(screen.queryByLabelText(/function to call/i)).not.toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    const mockParams = [
      { name: 'param1', label: 'First Parameter', type: 'string' },
    ];

    beforeEach(() => {
      const { getFunctionParameters } = require('../../../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValue(mockParams);
    });

    it('should memoize component when props do not change', () => {
      const { rerender } = render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
        />
      );

      const input1 = screen.getByLabelText(/first parameter \(string\)/i);

      rerender(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
        />
      );

      const input2 = screen.getByLabelText(/first parameter \(string\)/i);
      
      // Component should be the same instance
      expect(input1).toBe(input2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty allNodes array', () => {
      const { getFunctionParameters } = require('../../../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValue([]);

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
          nodeType="CustomFunction"
          allNodes={[]}
        />
      );

      expect(screen.getByText(/no parameters found/i)).toBeInTheDocument();
    });

    it('should handle nodes without function_name in params', () => {
      const { getFunctionParameters } = require('../../../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValue(null);

      const invalidNode: Node = {
        id: 'invalid-1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'CustomFunction',
          mode: 'definition',
          params: {},
        },
      };

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName=""
          nodeType="CustomFunction"
          allNodes={[invalidNode]}
        />
      );

      expect(screen.getByText(/no custom functions found/i)).toBeInTheDocument();
    });

    it('should handle resultVariable default value', () => {
      const { getFunctionParameters, generateFunctionArgs } = require('../../../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValue([
        { name: 'param1', label: 'Parameter 1', type: 'string' }
      ]);
      generateFunctionArgs.mockReturnValue('param1Value');

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
          currentParams={{ storeResult: 'true' }}
        />
      );

      // Should show default 'result' value
      const input = screen.getByLabelText(/result variable name/i);
      expect(input).toHaveValue('result');
    });

    it('should use custom resultVariable when provided', () => {
      const { getFunctionParameters, generateFunctionArgs } = require('../../../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValue([
        { name: 'param1', label: 'Parameter 1', type: 'string' }
      ]);
      generateFunctionArgs.mockReturnValue('param1Value');

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="testFunction"
          currentParams={{ storeResult: 'true', resultVariable: 'customResult' }}
        />
      );

      const input = screen.getByLabelText(/result variable name/i);
      expect(input).toHaveValue('customResult');
    });

    it('should handle function_name error in selector', () => {
      const { getFunctionParameters } = require('../../../../../src/utils/Flow/functionParameterUtils');
      getFunctionParameters.mockReturnValue([
        { name: 'param1', label: 'Parameter 1', type: 'string' }
      ]);

      mockGetFieldError.mockImplementation((field: string) => {
        if (field === 'function_name') return 'Function name is required';
        return undefined;
      });

      const customFunctionNode: Node = {
        id: 'func-1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'CustomFunction',
          mode: 'definition',
          params: { function_name: 'myFunc' },
        },
      };

      render(
        <FunctionCallSection
          {...defaultProps}
          functionName="myFunc"
          nodeType="CustomFunction"
          currentParams={{ function_name: 'myFunc' }}
          allNodes={[customFunctionNode]}
        />
      );

      expect(screen.getByText('Function name is required')).toBeInTheDocument();
    });
  });
});

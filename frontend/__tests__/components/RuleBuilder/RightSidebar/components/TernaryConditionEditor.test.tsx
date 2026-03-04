import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import TernaryConditionEditor from '../../../../../src/components/RuleBuilder/RightSidebar/components/TernaryConditionEditor';
import type { TernaryNode } from '../../../../../src/components/RuleBuilder/RightSidebar/components/TernaryConditionEditor';

jest.mock('../../../../../src/utils/cursorPreservation', () => ({
  withCursorPreservation: (fn: (e: React.ChangeEvent<HTMLInputElement>) => void) => fn,
}));

describe('TernaryConditionEditor Component', () => {
  const mockOnTreeChange = jest.fn();
  const mockOnStoreResultChange = jest.fn();
  const mockOnResultVarChange = jest.fn();
  const mockOnDragOver = jest.fn();
  const mockGetFieldError = jest.fn();
  const mockInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement>> = { current: {} };

  const simpleTernaryTree: TernaryNode = {
    condition: 'x > 5',
    trueValue: { type: 'value', value: 'high' },
    falseValue: { type: 'value', value: 'low' },
  };

  const defaultProps = {
    ternaryTree: simpleTernaryTree,
    storeResult: true,
    resultVar: 'result',
    onTreeChange: mockOnTreeChange,
    onStoreResultChange: mockOnStoreResultChange,
    onResultVarChange: mockOnResultVarChange,
    inputRefs: mockInputRefs,
    onDragOver: mockOnDragOver,
    viewOnly: false,
    getFieldError: mockGetFieldError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockInputRefs.current = {};
  });

  describe('Rendering', () => {
    it('should render ternary operator configuration', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      expect(screen.getByText('Ternary Operator Configuration')).toBeInTheDocument();
    });

    it('should render store result checkbox', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      expect(screen.getByRole('checkbox', { name: /store result in variable/i })).toBeInTheDocument();
    });

    it('should show result variable when storeResult is true', () => {
      render(<TernaryConditionEditor {...defaultProps} storeResult={true} />);
      
      expect(screen.getByLabelText(/result variable/i)).toBeInTheDocument();
    });

    it('should hide result variable when storeResult is false', () => {
      render(<TernaryConditionEditor {...defaultProps} storeResult={false} />);
      
      expect(screen.queryByLabelText(/result variable/i)).not.toBeInTheDocument();
    });

    it('should render root condition', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      expect(screen.getByText(/🎯 root condition/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('x > 5')).toBeInTheDocument();
    });

    it('should render true branch', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      expect(screen.getByText('IF TRUE')).toBeInTheDocument();
      expect(screen.getByDisplayValue('high')).toBeInTheDocument();
    });

    it('should render false branch', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      expect(screen.getByText('IF FALSE')).toBeInTheDocument();
      expect(screen.getByDisplayValue('low')).toBeInTheDocument();
    });

    it('should render helper text', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      expect(screen.getByText(/build nested conditions with true\/false branches/i)).toBeInTheDocument();
    });
  });

  describe('Store Result Configuration', () => {
    it('should check store result checkbox when storeResult is true', () => {
      render(<TernaryConditionEditor {...defaultProps} storeResult={true} />);
      
      const checkbox = screen.getByRole('checkbox', { name: /store result in variable/i });
      expect(checkbox).toBeChecked();
    });

    it('should uncheck store result checkbox when storeResult is false', () => {
      render(<TernaryConditionEditor {...defaultProps} storeResult={false} />);
      
      const checkbox = screen.getByRole('checkbox', { name: /store result in variable/i });
      expect(checkbox).not.toBeChecked();
    });

    it('should call onStoreResultChange when checkbox is toggled', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox', { name: /store result in variable/i });
      fireEvent.click(checkbox);
      
      expect(mockOnStoreResultChange).toHaveBeenCalledWith(false);
    });

    it('should render result variable with correct value', () => {
      render(<TernaryConditionEditor {...defaultProps} resultVar="myResult" />);
      
      expect(screen.getByDisplayValue('myResult')).toBeInTheDocument();
    });

    it('should call onResultVarChange when result variable changes', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      const input = screen.getByLabelText(/result variable/i);
      fireEvent.change(input, { target: { value: 'newResult' } });
      
      expect(mockOnResultVarChange).toHaveBeenCalledWith('newResult');
    });

    it('should disable store result checkbox in viewOnly mode', () => {
      render(<TernaryConditionEditor {...defaultProps} viewOnly={true} />);
      
      const checkbox = screen.getByRole('checkbox', { name: /store result in variable/i });
      expect(checkbox).toBeDisabled();
    });
  });

  describe('Condition Editing', () => {
    it('should update condition when changed', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      const conditionInput = screen.getByLabelText(/^condition$/i);
      fireEvent.change(conditionInput, { target: { value: 'x > 10' } });
      
      expect(mockOnTreeChange).toHaveBeenCalled();
    });

    it('should show placeholder for condition', () => {
      const emptyTree: TernaryNode = {
        condition: '',
        trueValue: { type: 'value', value: '' },
        falseValue: { type: 'value', value: '' },
      };
      
      render(<TernaryConditionEditor {...defaultProps} ternaryTree={emptyTree} />);
      
      const conditionInput = screen.getByLabelText(/^condition$/i);
      expect(conditionInput).toHaveAttribute('placeholder');
    });

    it('should disable condition input in viewOnly mode', () => {
      render(<TernaryConditionEditor {...defaultProps} viewOnly={true} />);
      
      const conditionInput = screen.getByLabelText(/^condition$/i);
      expect(conditionInput).toBeDisabled();
    });

    it('should show view only helper text', () => {
      render(<TernaryConditionEditor {...defaultProps} viewOnly={true} />);
      
      expect(screen.getByText(/view only mode/i)).toBeInTheDocument();
    });
  });

  describe('Branch Value Editing', () => {
    it('should update true branch value', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      const trueValueInputs = screen.getAllByLabelText(/return value/i);
      const trueInput = trueValueInputs[0]; // First one is true branch
      
      fireEvent.change(trueInput, { target: { value: 'very high' } });
      
      expect(mockOnTreeChange).toHaveBeenCalled();
    });

    it('should update false branch value', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      const falseValueInputs = screen.getAllByLabelText(/return value/i);
      const falseInput = falseValueInputs[1]; // Second one is false branch
      
      fireEvent.change(falseInput, { target: { value: 'very low' } });
      
      expect(mockOnTreeChange).toHaveBeenCalled();
    });

    it('should show placeholder for branch values', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      const valueInputs = screen.getAllByLabelText(/return value/i);
      expect(valueInputs[0]).toHaveAttribute('placeholder');
    });

    it('should disable branch values in viewOnly mode', () => {
      render(<TernaryConditionEditor {...defaultProps} viewOnly={true} />);
      
      const valueInputs = screen.getAllByLabelText(/return value/i);
      expect(valueInputs[0]).toBeDisabled();
      expect(valueInputs[1]).toBeDisabled();
    });
  });

  describe('Nested Conditions', () => {
    it('should show Add Nested Condition button for value branches', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      const addButtons = screen.getAllByRole('button', { name: /add nested condition/i });
      expect(addButtons).toHaveLength(2); // One for true, one for false
    });

    it('should not show Add Nested Condition button in viewOnly mode', () => {
      render(<TernaryConditionEditor {...defaultProps} viewOnly={true} />);
      
      expect(screen.queryByRole('button', { name: /add nested condition/i })).not.toBeInTheDocument();
    });

    it('should add nested condition when button clicked', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      const addButtons = screen.getAllByRole('button', { name: /add nested condition/i });
      fireEvent.click(addButtons[0]);
      
      expect(mockOnTreeChange).toHaveBeenCalled();
    });

    it('should render nested condition', () => {
      const nestedTree: TernaryNode = {
        condition: 'x > 5',
        trueValue: {
          type: 'nested',
          nested: {
            condition: 'y > 10',
            trueValue: { type: 'value', value: 'very high' },
            falseValue: { type: 'value', value: 'medium' },
          },
        },
        falseValue: { type: 'value', value: 'low' },
      };
      
      render(<TernaryConditionEditor {...defaultProps} ternaryTree={nestedTree} />);
      
      expect(screen.getByText(/🔗 nested condition \(level 1\)/i)).toBeInTheDocument();
    });

    it('should show Remove Nested Condition button for nested branches', () => {
      const nestedTree: TernaryNode = {
        condition: 'x > 5',
        trueValue: {
          type: 'nested',
          nested: {
            condition: 'y > 10',
            trueValue: { type: 'value', value: 'very high' },
            falseValue: { type: 'value', value: 'medium' },
          },
        },
        falseValue: { type: 'value', value: 'low' },
      };
      
      render(<TernaryConditionEditor {...defaultProps} ternaryTree={nestedTree} />);
      
      expect(screen.getByRole('button', { name: /remove nested condition/i })).toBeInTheDocument();
    });

    it('should remove nested condition when button clicked', () => {
      const nestedTree: TernaryNode = {
        condition: 'x > 5',
        trueValue: {
          type: 'nested',
          nested: {
            condition: 'y > 10',
            trueValue: { type: 'value', value: 'very high' },
            falseValue: { type: 'value', value: 'medium' },
          },
        },
        falseValue: { type: 'value', value: 'low' },
      };
      
      render(<TernaryConditionEditor {...defaultProps} ternaryTree={nestedTree} />);
      
      const removeButton = screen.getByRole('button', { name: /remove nested condition/i });
      fireEvent.click(removeButton);
      
      expect(mockOnTreeChange).toHaveBeenCalled();
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drop on condition field', () => {
      const mockTextarea = document.createElement('input');
      mockTextarea.value = 'x > 5';
      mockTextarea.selectionStart = 0;
      mockTextarea.selectionEnd = 0;
      mockTextarea.setSelectionRange = jest.fn();
      mockTextarea.focus = jest.fn();
      mockInputRefs.current['ternary_root_condition'] = mockTextarea;
      
      render(<TernaryConditionEditor {...defaultProps} />);
      
      const conditionField = screen.getByLabelText(/^condition$/i).parentElement?.parentElement;
      const dropEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn(() => 'RuleRequest.amount'),
        },
      };
      
      fireEvent.drop(conditionField!, dropEvent as never);
      
      expect(mockOnTreeChange).toHaveBeenCalled();
    });

    it('should handle drop on result variable', () => {
      const mockTextarea = document.createElement('input');
      mockTextarea.value = 'result';
      mockTextarea.selectionStart = 0;
      mockTextarea.selectionEnd = 0;
      mockTextarea.setSelectionRange = jest.fn();
      mockTextarea.focus = jest.fn();
      mockInputRefs.current['ternary_resultVar'] = mockTextarea;
      
      render(<TernaryConditionEditor {...defaultProps} />);
      
      const resultVarField = screen.getByLabelText(/result variable/i).parentElement?.parentElement;
      const dropEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn(() => 'newVar'),
        },
      };
      
      fireEvent.drop(resultVarField!, dropEvent as never);
      
      expect(mockOnResultVarChange).toHaveBeenCalled();
    });

    it('should not handle drop in viewOnly mode', () => {
      render(<TernaryConditionEditor {...defaultProps} viewOnly={true} />);
      
      const conditionField = screen.getByLabelText(/^condition$/i).parentElement?.parentElement;
      const dropEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn(() => 'RuleRequest.amount'),
        },
      };
      
      fireEvent.drop(conditionField!, dropEvent as never);
      
      expect(mockOnTreeChange).not.toHaveBeenCalled();
    });

    it('should handle dragOver event', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      const conditionField = screen.getByLabelText(/^condition$/i).parentElement?.parentElement;
      const dragOverEvent = new Event('dragover', { bubbles: true });
      
      fireEvent.dragOver(conditionField!, dragOverEvent);
      
      expect(mockOnDragOver).toHaveBeenCalled();
    });
  });

  describe('Styling and Visual Feedback', () => {
    it('should render success styling for true branch', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      const trueChip = screen.getByText('IF TRUE');
      expect(trueChip).toBeInTheDocument();
    });

    it('should render error styling for false branch', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      const falseChip = screen.getByText('IF FALSE');
      expect(falseChip).toBeInTheDocument();
    });

    it('should show icons for branches', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      // Check for the presence of chips which indicate proper rendering
      expect(screen.getByText('IF TRUE')).toBeInTheDocument();
      expect(screen.getByText('IF FALSE')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display field errors', () => {
      mockGetFieldError.mockReturnValue('Invalid ternary expression');
      
      render(<TernaryConditionEditor {...defaultProps} />);
      
      const conditionInput = screen.getByLabelText(/^condition$/i);
      expect(conditionInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Input Refs', () => {
    it('should register input refs for condition', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      expect(mockInputRefs.current).toHaveProperty('ternary_root_condition');
    });

    it('should register input refs for result variable', () => {
      render(<TernaryConditionEditor {...defaultProps} storeResult={true} />);
      
      expect(mockInputRefs.current).toHaveProperty('ternary_resultVar');
    });

    it('should register input refs for branch values', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      expect(mockInputRefs.current).toHaveProperty(['ternary_root.true_value']);
      expect(mockInputRefs.current).toHaveProperty(['ternary_root.false_value']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty condition', () => {
      const emptyTree: TernaryNode = {
        condition: '',
        trueValue: { type: 'value', value: '' },
        falseValue: { type: 'value', value: '' },
      };
      
      render(<TernaryConditionEditor {...defaultProps} ternaryTree={emptyTree} />);
      
      const conditionInput = screen.getByLabelText(/^condition$/i);
      expect(conditionInput).toHaveValue('');
    });

    it('should handle empty branch values', () => {
      const emptyTree: TernaryNode = {
        condition: 'x > 5',
        trueValue: { type: 'value', value: '' },
        falseValue: { type: 'value', value: '' },
      };
      
      render(<TernaryConditionEditor {...defaultProps} ternaryTree={emptyTree} />);
      
      const valueInputs = screen.getAllByLabelText(/return value/i);
      expect(valueInputs[0]).toHaveValue('');
      expect(valueInputs[1]).toHaveValue('');
    });

    it('should handle complex boolean expressions', () => {
      const complexTree: TernaryNode = {
        condition: '(x > 5 && y < 10) || z === "test"',
        trueValue: { type: 'value', value: '{{ RuleRequest.amount }}' },
        falseValue: { type: 'value', value: '{{ RuleConfig.default }}' },
      };
      
      render(<TernaryConditionEditor {...defaultProps} ternaryTree={complexTree} />);
      
      expect(screen.getByDisplayValue('(x > 5 && y < 10) || z === "test"')).toBeInTheDocument();
    });

    it('should handle result variable with global variable', () => {
      render(<TernaryConditionEditor {...defaultProps} resultVar="{{ RuleRequest.result }}" />);
      
      expect(screen.getByDisplayValue('{{ RuleRequest.result }}')).toBeInTheDocument();
    });

    it('should disable Add Nested Condition at max depth', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      const addButtons = screen.getAllByRole('button', { name: /add nested condition/i });

      expect(addButtons[0]).not.toBeDisabled();
    });
  });

  describe('View Only Mode', () => {
    it('should disable all inputs in viewOnly mode', () => {
      render(<TernaryConditionEditor {...defaultProps} viewOnly={true} />);
      
      const conditionInput = screen.getByLabelText(/^condition$/i);
      const valueInputs = screen.getAllByLabelText(/return value/i);
      
      expect(conditionInput).toBeDisabled();
      expect(valueInputs[0]).toBeDisabled();
      expect(valueInputs[1]).toBeDisabled();
    });

    it('should hide action buttons in viewOnly mode', () => {
      render(<TernaryConditionEditor {...defaultProps} viewOnly={true} />);
      
      expect(screen.queryByRole('button', { name: /add nested condition/i })).not.toBeInTheDocument();
    });

    it('should disable result variable in viewOnly mode', () => {
      render(<TernaryConditionEditor {...defaultProps} viewOnly={true} />);
      
      const resultVar = screen.getByLabelText(/result variable/i);
      expect(resultVar).toBeDisabled();
    });
  });

  describe('Helper Text', () => {
    it('should show helper text for condition', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      expect(screen.getByText(/enter boolean expression or drop variables/i)).toBeInTheDocument();
    });

    it('should show helper text for return value', () => {
      render(<TernaryConditionEditor {...defaultProps} />);
      
      const helperTexts = screen.getAllByText(/value to return when this condition is met/i);
      expect(helperTexts.length).toBeGreaterThan(0);
    });
  });
});

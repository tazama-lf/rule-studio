import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import IfConditionEditor from '../../../../../src/components/RuleBuilder/RightSidebar/components/IfConditionEditor';
import type { IfCondition } from '../../../../../src/hooks/RuleBuilder/useIfConditions';

jest.mock('../../../../../src/utils/cursorPreservation', () => ({
  withCursorPreservation: (fn: (e: React.ChangeEvent<HTMLInputElement>) => void) => fn,
}));

describe('IfConditionEditor Component', () => {
  const mockOnConditionChange = jest.fn();
  const mockOnAddElseIf = jest.fn();
  const mockOnAddElse = jest.fn();
  const mockOnRemoveCondition = jest.fn();
  const mockOnDragOver = jest.fn();
  const mockGetFieldError = jest.fn();
  const mockInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement>> = { current: {} };

  const defaultProps = {
    conditions: [],
    onConditionChange: mockOnConditionChange,
    onAddElseIf: mockOnAddElseIf,
    onAddElse: mockOnAddElse,
    onRemoveCondition: mockOnRemoveCondition,
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
    it('should render conditions section', () => {
      render(<IfConditionEditor {...defaultProps} />);
      
      expect(screen.getByText('Conditions')).toBeInTheDocument();
    });

    it('should render if condition', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      expect(screen.getByLabelText(/if condition/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('x > 5')).toBeInTheDocument();
    });

    it('should render else-if condition', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
        { type: 'elseif', condition: 'x < 0' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      expect(screen.getByLabelText(/else if condition/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('x < 0')).toBeInTheDocument();
    });

    it('should render else condition', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
        { type: 'else', condition: '' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      expect(screen.getByLabelText(/else \(no condition\)/i)).toBeInTheDocument();
    });

    it('should render multiple conditions', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
        { type: 'elseif', condition: 'x < 0' },
        { type: 'elseif', condition: 'x === 0' },
        { type: 'else', condition: '' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      expect(screen.getByDisplayValue('x > 5')).toBeInTheDocument();
      expect(screen.getByDisplayValue('x < 0')).toBeInTheDocument();
      expect(screen.getByDisplayValue('x === 0')).toBeInTheDocument();
      const labels = screen.getAllByLabelText(/else/i);
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should show helper text for conditions', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: '' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      expect(screen.getByText(/enter boolean expression or drop variables/i)).toBeInTheDocument();
    });

    it('should show helper text for else condition', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
        { type: 'else', condition: '' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      expect(screen.getByText(/default fallback path/i)).toBeInTheDocument();
    });
  });

  describe('Condition Editing', () => {
    it('should call onConditionChange when condition is edited', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const input = screen.getByDisplayValue('x > 5');
      fireEvent.change(input, { target: { value: 'x > 10' } });
      
      expect(mockOnConditionChange).toHaveBeenCalledWith(0, 'x > 10');
    });

    it('should not allow editing else condition', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
        { type: 'else', condition: '' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const elseInput = screen.getByLabelText(/else \(no condition\)/i);
      expect(elseInput).toBeDisabled();
    });

    it('should handle empty condition values', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: '' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const input = screen.getByLabelText(/if condition/i);
      expect(input).toHaveValue('');
    });
  });

  describe('Add/Remove Conditions', () => {
    it('should render Add Else If button', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      expect(screen.getByRole('button', { name: /add else if/i })).toBeInTheDocument();
    });

    it('should render Add Else button when no else exists', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      expect(screen.getByRole('button', { name: /add else$/i })).toBeInTheDocument();
    });

    it('should not render Add Else button when else already exists', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
        { type: 'else', condition: '' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      expect(screen.queryByRole('button', { name: /add else$/i })).not.toBeInTheDocument();
    });

    it('should call onAddElseIf when Add Else If is clicked', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const addButton = screen.getByRole('button', { name: /add else if/i });
      fireEvent.click(addButton);
      
      expect(mockOnAddElseIf).toHaveBeenCalled();
    });

    it('should call onAddElse when Add Else is clicked', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const addButton = screen.getByRole('button', { name: /add else$/i });
      fireEvent.click(addButton);
      
      expect(mockOnAddElse).toHaveBeenCalled();
    });

    it('should show delete button for conditions after the first', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
        { type: 'elseif', condition: 'x < 0' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const deleteButtons = screen.getAllByLabelText(/delete condition/i);
      expect(deleteButtons).toHaveLength(1);
    });

    it('should not show delete button for first condition', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      expect(screen.queryByLabelText(/delete condition/i)).not.toBeInTheDocument();
    });

    it('should call onRemoveCondition when delete is clicked', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
        { type: 'elseif', condition: 'x < 0' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const deleteButton = screen.getByLabelText(/delete condition/i);
      fireEvent.click(deleteButton);
      
      expect(mockOnRemoveCondition).toHaveBeenCalledWith(1);
    });
  });

  describe('View Only Mode', () => {
    it('should disable condition inputs in viewOnly mode', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} viewOnly={true} />);
      
      const input = screen.getByDisplayValue('x > 5');
      expect(input).toBeDisabled();
    });

    it('should show view only helper text', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} viewOnly={true} />);
      
      expect(screen.getByText(/view only mode/i)).toBeInTheDocument();
    });

    it('should hide add buttons in viewOnly mode', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} viewOnly={true} />);
      
      expect(screen.queryByRole('button', { name: /add else if/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /add else$/i })).not.toBeInTheDocument();
    });

    it('should hide delete buttons in viewOnly mode', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
        { type: 'elseif', condition: 'x < 0' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} viewOnly={true} />);
      
      expect(screen.queryByLabelText(/delete condition/i)).not.toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drop event with variable', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: '' },
      ];
      
      const textarea = document.createElement('textarea');
      textarea.value = '';
      textarea.selectionStart = 0;
      textarea.selectionEnd = 0;
      textarea.setSelectionRange = jest.fn();
      textarea.focus = jest.fn();
      mockInputRefs.current['condition_0'] = textarea;
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const inputParent = screen.getByLabelText(/if condition/i).parentElement?.parentElement;
      const dropEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn(() => 'RuleRequest.amount'),
        },
      };
      
      fireEvent.drop(inputParent!, dropEvent as never);
      
      expect(mockOnConditionChange).toHaveBeenCalledWith(0, '{{ RuleRequest.amount }}');
    });

    it('should handle drop with curly braces in variable', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: '' },
      ];
      
      mockInputRefs.current['condition_0'] = document.createElement('textarea');
      mockInputRefs.current['condition_0'].value = '';
      mockInputRefs.current['condition_0'].selectionStart = 0;
      mockInputRefs.current['condition_0'].selectionEnd = 0;
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const inputParent = screen.getByLabelText(/if condition/i).parentElement?.parentElement;
      const dropEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn(() => '{{ RuleRequest.amount }}'),
        },
      };
      
      fireEvent.drop(inputParent!, dropEvent as never);
      
      expect(mockOnConditionChange).toHaveBeenCalledWith(0, '{{ RuleRequest.amount }}');
    });

    it('should insert variable at cursor position', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5 && y < 10' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const textarea = screen.getByDisplayValue('x > 5 && y < 10') as HTMLTextAreaElement;
      textarea.selectionStart = 5;
      textarea.selectionEnd = 5;
      
      const inputParent = textarea.parentElement?.parentElement;
      const dropEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn(() => 'RuleRequest.status'),
        },
      };
      
      fireEvent.drop(inputParent!, dropEvent as never);
      
      expect(mockOnConditionChange).toHaveBeenCalledWith(0, 'x > 5{{ RuleRequest.status }} && y < 10');
    });

    it('should append variable when no input ref exists', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const textarea = screen.getByDisplayValue('x > 5') as HTMLTextAreaElement;
      // Set cursor to end to simulate appending
      textarea.selectionStart = textarea.value.length;
      textarea.selectionEnd = textarea.value.length;
      
      const inputParent = textarea.parentElement?.parentElement;
      const dropEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn(() => 'RuleRequest.amount'),
        },
      };
      
      fireEvent.drop(inputParent!, dropEvent as never);
      
      expect(mockOnConditionChange).toHaveBeenCalledWith(0, 'x > 5{{ RuleRequest.amount }}');
    });

    it('should not handle drop on else condition', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
        { type: 'else', condition: '' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const inputParent = screen.getByLabelText(/else \(no condition\)/i).parentElement?.parentElement;
      const dropEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn(() => 'RuleRequest.amount'),
        },
      };
      
      fireEvent.drop(inputParent!, dropEvent as never);
      
      expect(mockOnConditionChange).not.toHaveBeenCalled();
    });

    it('should not handle drop in viewOnly mode', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: '' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} viewOnly={true} />);
      
      const inputParent = screen.getByLabelText(/if condition/i).parentElement?.parentElement;
      const dropEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn(() => 'RuleRequest.amount'),
        },
      };
      
      fireEvent.drop(inputParent!, dropEvent as never);
      
      expect(mockOnConditionChange).not.toHaveBeenCalled();
    });

    it('should handle dragOver event', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: '' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const inputParent = screen.getByLabelText(/if condition/i).parentElement?.parentElement;
      const dragOverEvent = new Event('dragover', { bubbles: true });
      
      fireEvent.dragOver(inputParent!, dragOverEvent);
      
      expect(mockOnDragOver).toHaveBeenCalled();
    });

    it('should ignore drop without variable data', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: '' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const inputParent = screen.getByLabelText(/if condition/i).parentElement?.parentElement;
      const dropEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn(() => ''),
        },
      };
      
      fireEvent.drop(inputParent!, dropEvent as never);
      
      expect(mockOnConditionChange).not.toHaveBeenCalled();
    });
  });

  describe('Styling and Visual Feedback', () => {
    it('should highlight condition with RuleRequest variable', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: '{{ RuleRequest.amount }} > 100' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const input = screen.getByDisplayValue('{{ RuleRequest.amount }} > 100');
      expect(input).toBeInTheDocument();
    });

    it('should highlight condition with RuleConfig variable', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: '{{ RuleConfig.threshold }} < 50' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const input = screen.getByDisplayValue('{{ RuleConfig.threshold }} < 50');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display field errors', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: '' },
      ];
      
      mockGetFieldError.mockReturnValue('Condition is required');
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      expect(screen.getByText('Condition is required')).toBeInTheDocument();
    });

    it('should mark input as error when field has error', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: '' },
      ];
      
      mockGetFieldError.mockReturnValue('Invalid condition');
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const input = screen.getByLabelText(/if condition/i);
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Input Refs', () => {
    it('should register input refs for non-else conditions', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
        { type: 'elseif', condition: 'x < 0' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      expect(mockInputRefs.current).toHaveProperty('condition_0');
      expect(mockInputRefs.current).toHaveProperty('condition_1');
    });

    it('should not register input ref for else condition', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: 'x > 5' },
        { type: 'else', condition: '' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      expect(mockInputRefs.current).toHaveProperty('condition_0');
      expect(mockInputRefs.current).not.toHaveProperty('condition_1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty conditions array', () => {
      render(<IfConditionEditor {...defaultProps} conditions={[]} />);
      
      expect(screen.getByText('Conditions')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add else if/i })).toBeInTheDocument();
    });

    it('should handle null condition values', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: null as never },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      const input = screen.getByLabelText(/if condition/i);
      expect(input).toHaveValue('');
    });

    it('should handle complex boolean expressions', () => {
      const conditions: IfCondition[] = [
        { type: 'if', condition: '(x > 5 && y < 10) || (z === "test" && w !== null)' },
      ];
      
      render(<IfConditionEditor {...defaultProps} conditions={conditions} />);
      
      expect(screen.getByDisplayValue('(x > 5 && y < 10) || (z === "test" && w !== null)')).toBeInTheDocument();
    });
  });
});

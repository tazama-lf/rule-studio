import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ValidationErrorModal } from '../../../src/components/RuleBuilder/ValidationErrorModal';

// Mock the validation context
const mockGetAllErrors = () => [];
const mockGetErrorCount = () => 0;

jest.mock('../../../src/validation/context', () => ({
  useValidationContext: jest.fn(() => ({
    getAllErrors: mockGetAllErrors,
    getErrorCount: mockGetErrorCount,
  })),
}));

describe('RuleBuilder ValidationErrorModal Component', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = (props = {}) => {
    return render(<ValidationErrorModal {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('should render modal when open', () => {
      renderModal();
      expect(screen.getByText('Validation Errors')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      renderModal({ open: false });
      expect(screen.queryByText('Validation Errors')).not.toBeInTheDocument();
    });

    it('should display error count badge', () => {
      const { useValidationContext } = require('../../../src/validation/context');
      useValidationContext.mockReturnValue({
        getAllErrors: () => [],
        getErrorCount: () => 0,
      });
      
      renderModal();
      expect(screen.getByText('0 nodes')).toBeInTheDocument();
    });

    it('should show singular form for single error', () => {
      const { useValidationContext } = require('../../../src/validation/context');
      useValidationContext.mockReturnValue({
        getAllErrors: () => [
          {
            nodeId: '1',
            nodeName: 'Test Node',
            nodeType: 'SetVariable',
            errors: { name: 'Name is required' },
          },
        ],
        getErrorCount: () => 1,
      });
      
      renderModal();
      expect(screen.getByText('1 node')).toBeInTheDocument();
    });

    it('should show plural form for multiple errors', () => {
      const { useValidationContext } = require('../../../src/validation/context');
      useValidationContext.mockReturnValue({
        getAllErrors: () => [
          {
            nodeId: '1',
            nodeName: 'Node 1',
            nodeType: 'SetVariable',
            errors: { name: 'Error 1' },
          },
          {
            nodeId: '2',
            nodeName: 'Node 2',
            nodeType: 'If',
            errors: { condition: 'Error 2' },
          },
        ],
        getErrorCount: () => 2,
      });
      
      renderModal();
      expect(screen.getByText('2 nodes')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no errors', () => {
      const { useValidationContext } = require('../../../src/validation/context');
      useValidationContext.mockReturnValue({
        getAllErrors: () => [],
        getErrorCount: () => 0,
      });
      
      renderModal();
      expect(screen.getByText('No validation errors found')).toBeInTheDocument();
    });
  });

  describe('Error List', () => {
    it('should display error details', () => {
      const { useValidationContext } = require('../../../src/validation/context');
      useValidationContext.mockReturnValue({
        getAllErrors: () => [
          {
            nodeId: '1',
            nodeName: 'Test Node',
            nodeType: 'SetVariable',
            errors: { name: 'Name is required', value: 'Value cannot be empty' },
          },
        ],
        getErrorCount: () => 1,
      });
      
      renderModal();
      expect(screen.getByText('Test Node')).toBeInTheDocument();
      expect(screen.getByText('SetVariable')).toBeInTheDocument();
      expect(screen.getByText('name:')).toBeInTheDocument();
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('value:')).toBeInTheDocument();
      expect(screen.getByText('Value cannot be empty')).toBeInTheDocument();
    });

    it('should display multiple nodes with errors', () => {
      const { useValidationContext } = require('../../../src/validation/context');
      useValidationContext.mockReturnValue({
        getAllErrors: () => [
          {
            nodeId: '1',
            nodeName: 'Node 1',
            nodeType: 'SetVariable',
            errors: { name: 'Error in node 1' },
          },
          {
            nodeId: '2',
            nodeName: 'Node 2',
            nodeType: 'If',
            errors: { condition: 'Error in node 2' },
          },
        ],
        getErrorCount: () => 2,
      });
      
      renderModal();
      expect(screen.getByText('Node 1')).toBeInTheDocument();
      expect(screen.getByText('Node 2')).toBeInTheDocument();
      expect(screen.getByText('SetVariable')).toBeInTheDocument();
      expect(screen.getByText('If')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button clicked', () => {
      const onClose = jest.fn();
      renderModal({ onClose });
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal on backdrop click', () => {
      const onClose = jest.fn();
      renderModal({ onClose });
      
      // MUI Dialog calls onClose when backdrop is clicked
      // We need to find the backdrop and click it
      const backdrop = document.querySelector('.MuiBackdrop-root');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalled();
      }
    });
  });

  describe('Error Types', () => {
    it('should handle nodes with single error field', () => {
      const { useValidationContext } = require('../../../src/validation/context');
      useValidationContext.mockReturnValue({
        getAllErrors: () => [
          {
            nodeId: '1',
            nodeName: 'Test Node',
            nodeType: 'SetVariable',
            errors: { name: 'Single error' },
          },
        ],
        getErrorCount: () => 1,
      });
      
      renderModal();
      expect(screen.getByText('name:')).toBeInTheDocument();
      expect(screen.getByText('Single error')).toBeInTheDocument();
    });

    it('should handle nodes with multiple error fields', () => {
      const { useValidationContext } = require('../../../src/validation/context');
      useValidationContext.mockReturnValue({
        getAllErrors: () => [
          {
            nodeId: '1',
            nodeName: 'Test Node',
            nodeType: 'If',
            errors: {
              condition: 'Condition is required',
              thenBranch: 'Then branch is required',
              elseBranch: 'Else branch is required',
            },
          },
        ],
        getErrorCount: () => 1,
      });
      
      renderModal();
      expect(screen.getByText('condition:')).toBeInTheDocument();
      expect(screen.getByText('Condition is required')).toBeInTheDocument();
      expect(screen.getByText('thenBranch:')).toBeInTheDocument();
      expect(screen.getByText('Then branch is required')).toBeInTheDocument();
      expect(screen.getByText('elseBranch:')).toBeInTheDocument();
      expect(screen.getByText('Else branch is required')).toBeInTheDocument();
    });
  });
});

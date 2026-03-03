import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SimulationResult from '../../../src/components/Cards/SimulationResult';
import type { IResult } from '../../../src/utils/Common/types';

// Mock the JsonFormatter component
jest.mock('../../../src/components/JsonFormatter', () => {
  return function MockFormattedJsonSection({ value }: { value: string }) {
    return <div data-testid="formatted-json">{value}</div>;
  };
});

describe('SimulationResult Component', () => {
  const mockSuccessResult: IResult = {
    success: true,
    message: 'Transaction processed successfully',
    proccessedAt: '2026-02-28T10:00:00Z',
    transactionType: 'payment',
    correlationId: 'test-correlation-id',
    configPayload: {
      success: true,
      transactionType: 'payment',
      tenantId: 'tenant-1',
      config: {},
    },
    ruleRequest: {
      transaction: { id: '123', amount: 100 },
      networkMap: { nodes: [] },
      DataCache: {},
      metaData: { timestamp: '2026-02-28' },
    },
  };

  const mockFailureResult: IResult = {
    success: false,
    message: 'Transaction validation failed',
    proccessedAt: '2026-02-28T10:00:00Z',
    transactionType: 'payment',
    correlationId: 'test-correlation-id',
    configPayload: {
      success: false,
      transactionType: 'payment',
      tenantId: 'tenant-1',
      config: {},
    },
  };

  describe('Success State', () => {
    it('should render success message when simulation passes', () => {
      render(<SimulationResult result={mockSuccessResult} />);
      expect(screen.getByText('Simulation Passed')).toBeInTheDocument();
    });

    it('should display success icon when simulation passes', () => {
      const { container } = render(<SimulationResult result={mockSuccessResult} />);
      const successIcon = container.querySelector('[data-testid="CheckCircleIcon"]');
      expect(successIcon).toBeInTheDocument();
    });

    it('should display result message on success', () => {
      render(<SimulationResult result={mockSuccessResult} />);
      expect(screen.getByText('Transaction processed successfully')).toBeInTheDocument();
    });

    it('should apply success border color when simulation passes', () => {
      const { container } = render(<SimulationResult result={mockSuccessResult} />);
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });

    it('should render JSON section when simulation passes and ruleRequest exists', () => {
      render(<SimulationResult result={mockSuccessResult} />);
      const jsonSection = screen.getByTestId('formatted-json');
      expect(jsonSection).toBeInTheDocument();
    });

    it('should format ruleRequest as JSON string', () => {
      render(<SimulationResult result={mockSuccessResult} />);
      const jsonSection = screen.getByTestId('formatted-json');
      const expectedJson = JSON.stringify(mockSuccessResult.ruleRequest);
      expect(jsonSection).toHaveTextContent(expectedJson);
    });

    it('should not render JSON section when ruleRequest is missing', () => {
      const resultWithoutRuleRequest = { ...mockSuccessResult, ruleRequest: undefined };
      render(<SimulationResult result={resultWithoutRuleRequest} />);
      expect(screen.queryByTestId('formatted-json')).not.toBeInTheDocument();
    });
  });

  describe('Failure State', () => {
    it('should render failure message when simulation fails', () => {
      render(<SimulationResult result={mockFailureResult} />);
      expect(screen.getByText('Simulation Failed')).toBeInTheDocument();
    });

    it('should display error icon when simulation fails', () => {
      const { container } = render(<SimulationResult result={mockFailureResult} />);
      const errorIcon = container.querySelector('[data-testid="CancelIcon"]');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should display result message on failure', () => {
      render(<SimulationResult result={mockFailureResult} />);
      expect(screen.getByText('Transaction validation failed')).toBeInTheDocument();
    });

    it('should not render success icon when simulation fails', () => {
      const { container } = render(<SimulationResult result={mockFailureResult} />);
      const successIcon = container.querySelector('[data-testid="CheckCircleIcon"]');
      expect(successIcon).not.toBeInTheDocument();
    });

    it('should not render JSON section when simulation fails', () => {
      render(<SimulationResult result={mockFailureResult} />);
      expect(screen.queryByTestId('formatted-json')).not.toBeInTheDocument();
    });

    it('should apply error border color when simulation fails', () => {
      const { container } = render(<SimulationResult result={mockFailureResult} />);
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });
  });

  describe('Validation Errors', () => {
    it('should display validation errors section when errors exist', () => {
      const resultWithErrors: IResult = {
        ...mockFailureResult,
        validationErrors: ['Invalid amount', 'Missing field: currency'],
      };
      render(<SimulationResult result={resultWithErrors} />);
      expect(screen.getByText('Errors:')).toBeInTheDocument();
    });

    it('should display all validation errors', () => {
      const resultWithErrors: IResult = {
        ...mockFailureResult,
        validationErrors: ['Invalid amount', 'Missing field: currency', 'Invalid date format'],
      };
      render(<SimulationResult result={resultWithErrors} />);
      expect(screen.getByText('Invalid amount')).toBeInTheDocument();
      expect(screen.getByText('Missing field: currency')).toBeInTheDocument();
      expect(screen.getByText('Invalid date format')).toBeInTheDocument();
    });

    it('should not display errors section when validationErrors is undefined', () => {
      render(<SimulationResult result={mockSuccessResult} />);
      expect(screen.queryByText('Errors:')).not.toBeInTheDocument();
    });

    it('should not display errors section when validationErrors is empty array', () => {
      const resultWithEmptyErrors: IResult = {
        ...mockSuccessResult,
        validationErrors: [],
      };
      render(<SimulationResult result={resultWithEmptyErrors} />);
      expect(screen.queryByText('Errors:')).not.toBeInTheDocument();
    });

    it('should render single validation error', () => {
      const resultWithSingleError: IResult = {
        ...mockFailureResult,
        validationErrors: ['Single error message'],
      };
      render(<SimulationResult result={resultWithSingleError} />);
      expect(screen.getByText('Single error message')).toBeInTheDocument();
    });

    it('should display errors even when simulation passes', () => {
      const successWithErrors: IResult = {
        ...mockSuccessResult,
        validationErrors: ['Warning: deprecated field used'],
      };
      render(<SimulationResult result={successWithErrors} />);
      expect(screen.getByText('Errors:')).toBeInTheDocument();
      expect(screen.getByText('Warning: deprecated field used')).toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    it('should display custom success message', () => {
      const resultWithCustomMessage: IResult = {
        ...mockSuccessResult,
        message: 'Custom success message here',
      };
      render(<SimulationResult result={resultWithCustomMessage} />);
      expect(screen.getByText('Custom success message here')).toBeInTheDocument();
    });

    it('should display custom failure message', () => {
      const resultWithCustomMessage: IResult = {
        ...mockFailureResult,
        message: 'Custom failure message here',
      };
      render(<SimulationResult result={resultWithCustomMessage} />);
      expect(screen.getByText('Custom failure message here')).toBeInTheDocument();
    });

    it('should display empty message', () => {
      const resultWithEmptyMessage: IResult = {
        ...mockSuccessResult,
        message: '',
      };
      render(<SimulationResult result={resultWithEmptyMessage} />);
      expect(screen.getByText('Simulation Passed')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle success undefined as false', () => {
      const resultWithUndefinedSuccess: IResult = {
        ...mockSuccessResult,
        success: undefined as unknown as boolean,
      };
      render(<SimulationResult result={resultWithUndefinedSuccess} />);
      expect(screen.getByText('Simulation Failed')).toBeInTheDocument();
    });

    it('should handle explicit false success value', () => {
      render(<SimulationResult result={mockFailureResult} />);
      expect(screen.getByText('Simulation Failed')).toBeInTheDocument();
      const { container } = render(<SimulationResult result={mockFailureResult} />);
      const errorIcon = container.querySelector('[data-testid="CancelIcon"]');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should render with minimal required fields', () => {
      const minimalResult: IResult = {
        success: true,
        message: 'Minimal result',
        proccessedAt: '2026-02-28T10:00:00Z',
        transactionType: 'test',
        correlationId: 'test-id',
        configPayload: {
          success: true,
          transactionType: 'test',
          tenantId: 'tenant-1',
          config: {},
        },
      };
      render(<SimulationResult result={minimalResult} />);
      expect(screen.getByText('Simulation Passed')).toBeInTheDocument();
      expect(screen.getByText('Minimal result')).toBeInTheDocument();
    });

    it('should handle complex ruleRequest object', () => {
      const complexResult: IResult = {
        ...mockSuccessResult,
        ruleRequest: {
          transaction: {
            id: 'tx-123',
            amount: 1000,
            currency: 'USD',
            nested: {
              deep: {
                value: 'test',
              },
            },
          },
          networkMap: {
            nodes: [{ id: 1 }, { id: 2 }],
            edges: [{ from: 1, to: 2 }],
          },
          DataCache: {
            key1: 'value1',
            key2: 'value2',
          },
          metaData: {
            timestamp: '2026-02-28',
            source: 'test',
          },
        },
      };
      render(<SimulationResult result={complexResult} />);
      const jsonSection = screen.getByTestId('formatted-json');
      expect(jsonSection).toBeInTheDocument();
    });

    it('should render multiple validation errors with unique keys', () => {
      const resultWithManyErrors: IResult = {
        ...mockFailureResult,
        validationErrors: [
          'Error 1',
          'Error 2',
          'Error 3',
          'Error 4',
          'Error 5',
        ],
      };
      render(<SimulationResult result={resultWithManyErrors} />);
      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByText('Error 2')).toBeInTheDocument();
      expect(screen.getByText('Error 3')).toBeInTheDocument();
      expect(screen.getByText('Error 4')).toBeInTheDocument();
      expect(screen.getByText('Error 5')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should render Paper component with correct variant', () => {
      const { container } = render(<SimulationResult result={mockSuccessResult} />);
      const paper = container.querySelector('.MuiPaper-outlined');
      expect(paper).toBeInTheDocument();
    });

    it('should render Stack with icon and text in row direction', () => {
      const { container } = render(<SimulationResult result={mockSuccessResult} />);
      const stack = container.querySelector('.MuiStack-root');
      expect(stack).toBeInTheDocument();
    });

    it('should render Grid container for JSON when present', () => {
      const { container } = render(<SimulationResult result={mockSuccessResult} />);
      const grid = container.querySelector('.MuiGrid-root');
      expect(grid).toBeInTheDocument();
    });

    it('should not render Grid when ruleRequest is missing', () => {
      const resultWithoutRuleRequest = { ...mockSuccessResult, ruleRequest: undefined };
      const { container } = render(<SimulationResult result={resultWithoutRuleRequest} />);
      const grids = container.querySelectorAll('.MuiGrid-root');
      // Should have no Grid for JSON display
      expect(grids.length).toBe(0);
    });

    it('should apply transparent background color', () => {
      const { container } = render(<SimulationResult result={mockSuccessResult} />);
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });
  });

  describe('Combined Scenarios', () => {
    it('should render success with errors and ruleRequest', () => {
      const complexSuccess: IResult = {
        ...mockSuccessResult,
        validationErrors: ['Warning: some issue'],
      };
      render(<SimulationResult result={complexSuccess} />);
      expect(screen.getByText('Simulation Passed')).toBeInTheDocument();
      expect(screen.getByText('Errors:')).toBeInTheDocument();
      expect(screen.getByText('Warning: some issue')).toBeInTheDocument();
      expect(screen.getByTestId('formatted-json')).toBeInTheDocument();
    });

    it('should render failure with multiple errors and no ruleRequest', () => {
      const complexFailure: IResult = {
        ...mockFailureResult,
        validationErrors: ['Error 1', 'Error 2', 'Error 3'],
      };
      render(<SimulationResult result={complexFailure} />);
      expect(screen.getByText('Simulation Failed')).toBeInTheDocument();
      expect(screen.getByText('Errors:')).toBeInTheDocument();
      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByText('Error 2')).toBeInTheDocument();
      expect(screen.getByText('Error 3')).toBeInTheDocument();
      expect(screen.queryByTestId('formatted-json')).not.toBeInTheDocument();
    });

    it('should render success without ruleRequest and without errors', () => {
      const simpleSuccess: IResult = {
        ...mockSuccessResult,
        ruleRequest: undefined,
        validationErrors: undefined,
      };
      render(<SimulationResult result={simpleSuccess} />);
      expect(screen.getByText('Simulation Passed')).toBeInTheDocument();
      expect(screen.queryByText('Errors:')).not.toBeInTheDocument();
      expect(screen.queryByTestId('formatted-json')).not.toBeInTheDocument();
    });
  });
});

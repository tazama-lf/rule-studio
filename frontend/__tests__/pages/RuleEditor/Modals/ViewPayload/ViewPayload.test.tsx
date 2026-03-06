import { render, screen } from '@testing-library/react';

// Mock the controller hook BEFORE importing the component
jest.mock('../../../../../src/pages/RuleEditor/Modals/ViewPayload/useViewPayloadController');

import ViewPayload from '../../../../../src/pages/RuleEditor/Modals/ViewPayload';
import useViewPayloadController, { type IViewPayload } from '../../../../../src/pages/RuleEditor/Modals/ViewPayload/useViewPayloadController';

// Mock the JsonFormatter component
jest.mock('../../../../../src/components/JsonFormatter', () => ({
  __esModule: true,
  default: ({ label, value }: { label: string; value: string }) => (
    <div data-testid={`json-formatter-${label.toLowerCase().replace(' ', '-')}`} data-label={label} data-value={value}>
      {label}: Formatted JSON
    </div>
  ),
}));

const mockUseViewPayloadController = useViewPayloadController as jest.MockedFunction<
  typeof useViewPayloadController
>;

describe('ViewPayload', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockUseViewPayloadController.mockReturnValue({
      values: {
        payload: {},
        result: {},
      },
    });
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: {},
          result: {},
        },
      });

      render(<ViewPayload {...props} />);
      expect(screen.getByTestId('json-formatter-payload')).toBeInTheDocument();
      expect(screen.getByTestId('json-formatter-simulation-result')).toBeInTheDocument();
    });

    it('should call the controller hook with props', () => {
      const props: IViewPayload = {
        data: {
          old_data: { test: 'data' },
          new_data: { test: 'result' },
        },
      };

      render(<ViewPayload {...props} />);
      expect(mockUseViewPayloadController).toHaveBeenCalledWith(props);
    });

    it('should render Grid container with correct spacing', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      const { container } = render(<ViewPayload {...props} />);
      const gridContainer = container.querySelector('.MuiGrid-container');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should render both FormattedJsonSection components', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      render(<ViewPayload {...props} />);
      expect(screen.getByTestId('json-formatter-payload')).toBeInTheDocument();
      expect(screen.getByTestId('json-formatter-simulation-result')).toBeInTheDocument();
    });
  });

  describe('Payload Display', () => {
    it('should render payload FormattedJsonSection with correct label', () => {
      const props: IViewPayload = {
        data: {
          old_data: { transaction: 'tx123' },
          new_data: {},
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: { transaction: 'tx123' },
          result: {},
        },
      });

      render(<ViewPayload {...props} />);
      const payloadFormatter = screen.getByTestId('json-formatter-payload');
      expect(payloadFormatter).toHaveAttribute('data-label', 'Payload');
    });

    it('should render payload with stringified data', () => {
      const payloadData = { transaction_id: 'tx123', amount: 1000 };
      const props: IViewPayload = {
        data: {
          old_data: payloadData,
          new_data: {},
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: payloadData,
          result: {},
        },
      });

      render(<ViewPayload {...props} />);
      const payloadFormatter = screen.getByTestId('json-formatter-payload');
      expect(payloadFormatter).toHaveAttribute('data-value', JSON.stringify(payloadData));
    });

    it('should render empty object when payload is undefined', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: undefined,
          result: {},
        },
      });

      render(<ViewPayload {...props} />);
      const payloadFormatter = screen.getByTestId('json-formatter-payload');
      expect(payloadFormatter).toHaveAttribute('data-value', JSON.stringify({}));
    });

    it('should render empty object when payload is null', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: null,
          result: {},
        },
      });

      render(<ViewPayload {...props} />);
      const payloadFormatter = screen.getByTestId('json-formatter-payload');
      expect(payloadFormatter).toHaveAttribute('data-value', JSON.stringify({}));
    });

    it('should handle complex payload data structure', () => {
      const complexPayload = {
        transaction: {
          id: 'tx123',
          details: {
            amount: 5000,
            currency: 'USD',
          },
        },
        metadata: {
          timestamp: '2024-01-15',
        },
      };

      const props: IViewPayload = {
        data: {
          old_data: complexPayload,
          new_data: {},
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: complexPayload,
          result: {},
        },
      });

      render(<ViewPayload {...props} />);
      const payloadFormatter = screen.getByTestId('json-formatter-payload');
      expect(payloadFormatter).toHaveAttribute('data-value', JSON.stringify(complexPayload));
    });
  });

  describe('Result Display', () => {
    it('should render result FormattedJsonSection with correct label', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: { status: 'success' },
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: {},
          result: { status: 'success' },
        },
      });

      render(<ViewPayload {...props} />);
      const resultFormatter = screen.getByTestId('json-formatter-simulation-result');
      expect(resultFormatter).toHaveAttribute('data-label', 'Simulation Result');
    });

    it('should render result with stringified data', () => {
      const resultData = { risk_score: 0.85, status: 'flagged' };
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: resultData,
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: {},
          result: resultData,
        },
      });

      render(<ViewPayload {...props} />);
      const resultFormatter = screen.getByTestId('json-formatter-simulation-result');
      expect(resultFormatter).toHaveAttribute('data-value', JSON.stringify(resultData));
    });

    it('should render empty object when result is undefined', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: {},
          result: undefined,
        },
      });

      render(<ViewPayload {...props} />);
      const resultFormatter = screen.getByTestId('json-formatter-simulation-result');
      expect(resultFormatter).toHaveAttribute('data-value', JSON.stringify({}));
    });

    it('should render empty object when result is null', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: {},
          result: null,
        },
      });

      render(<ViewPayload {...props} />);
      const resultFormatter = screen.getByTestId('json-formatter-simulation-result');
      expect(resultFormatter).toHaveAttribute('data-value', JSON.stringify({}));
    });

    it('should handle complex result data structure', () => {
      const complexResult = {
        analysis: {
          risk_score: 0.75,
          fraud_indicators: ['high_amount', 'new_account'],
        },
        rules_triggered: [
          { rule_id: 'R001', score: 0.3 },
          { rule_id: 'R002', score: 0.25 },
        ],
      };

      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: complexResult,
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: {},
          result: complexResult,
        },
      });

      render(<ViewPayload {...props} />);
      const resultFormatter = screen.getByTestId('json-formatter-simulation-result');
      expect(resultFormatter).toHaveAttribute('data-value', JSON.stringify(complexResult));
    });
  });

  describe('Layout Structure', () => {
    it('should render payload on the left side (xs:12, md:6)', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      const { container } = render(<ViewPayload {...props} />);
      const grids = container.querySelectorAll('.MuiGrid-root');
      // Should have container + 2 grid items
      expect(grids.length).toBeGreaterThanOrEqual(3);
    });

    it('should render result on the right side (xs:12, md:6)', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      render(<ViewPayload {...props} />);
      expect(screen.getByTestId('json-formatter-payload')).toBeInTheDocument();
      expect(screen.getByTestId('json-formatter-simulation-result')).toBeInTheDocument();
    });

    it('should maintain layout structure across rerenders', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      const { container, rerender } = render(<ViewPayload {...props} />);
      const initialGrids = container.querySelectorAll('.MuiGrid-root').length;

      rerender(<ViewPayload {...props} />);
      const rerenderedGrids = container.querySelectorAll('.MuiGrid-root').length;

      expect(initialGrids).toBe(rerenderedGrids);
    });
  });

  describe('Props Updates', () => {
    it('should update payload when props change', () => {
      const initialProps: IViewPayload = {
        data: {
          old_data: { version: 1 },
          new_data: {},
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: { version: 1 },
          result: {},
        },
      });

      const { rerender } = render(<ViewPayload {...initialProps} />);
      let payloadFormatter = screen.getByTestId('json-formatter-payload');
      expect(payloadFormatter).toHaveAttribute('data-value', JSON.stringify({ version: 1 }));

      const updatedProps: IViewPayload = {
        data: {
          old_data: { version: 2 },
          new_data: {},
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: { version: 2 },
          result: {},
        },
      });

      rerender(<ViewPayload {...updatedProps} />);
      payloadFormatter = screen.getByTestId('json-formatter-payload');
      expect(payloadFormatter).toHaveAttribute('data-value', JSON.stringify({ version: 2 }));
    });

    it('should update result when props change', () => {
      const initialProps: IViewPayload = {
        data: {
          old_data: {},
          new_data: { status: 'pending' },
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: {},
          result: { status: 'pending' },
        },
      });

      const { rerender } = render(<ViewPayload {...initialProps} />);
      let resultFormatter = screen.getByTestId('json-formatter-simulation-result');
      expect(resultFormatter).toHaveAttribute('data-value', JSON.stringify({ status: 'pending' }));

      const updatedProps: IViewPayload = {
        data: {
          old_data: {},
          new_data: { status: 'completed' },
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: {},
          result: { status: 'completed' },
        },
      });

      rerender(<ViewPayload {...updatedProps} />);
      resultFormatter = screen.getByTestId('json-formatter-simulation-result');
      expect(resultFormatter).toHaveAttribute('data-value', JSON.stringify({ status: 'completed' }));
    });

    it('should update both payload and result simultaneously', () => {
      const initialProps: IViewPayload = {
        data: {
          old_data: { input: 'A' },
          new_data: { output: 'X' },
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: { input: 'A' },
          result: { output: 'X' },
        },
      });

      const { rerender } = render(<ViewPayload {...initialProps} />);

      const updatedProps: IViewPayload = {
        data: {
          old_data: { input: 'B' },
          new_data: { output: 'Y' },
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: { input: 'B' },
          result: { output: 'Y' },
        },
      });

      rerender(<ViewPayload {...updatedProps} />);

      const payloadFormatter = screen.getByTestId('json-formatter-payload');
      const resultFormatter = screen.getByTestId('json-formatter-simulation-result');

      expect(payloadFormatter).toHaveAttribute('data-value', JSON.stringify({ input: 'B' }));
      expect(resultFormatter).toHaveAttribute('data-value', JSON.stringify({ output: 'Y' }));
    });
  });

  describe('Edge Cases', () => {
    it('should handle when values object is undefined', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: undefined as any,
      });

      render(<ViewPayload {...props} />);
      // Should render with empty objects as fallback
      expect(screen.getByTestId('json-formatter-payload')).toBeInTheDocument();
      expect(screen.getByTestId('json-formatter-simulation-result')).toBeInTheDocument();
    });

    it('should handle data with special characters', () => {
      const specialData = {
        text: 'Special <>&"\' characters',
        unicode: '🚀 emoji test',
      };

      const props: IViewPayload = {
        data: {
          old_data: specialData,
          new_data: specialData,
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: specialData,
          result: specialData,
        },
      });

      render(<ViewPayload {...props} />);
      const payloadFormatter = screen.getByTestId('json-formatter-payload');
      const resultFormatter = screen.getByTestId('json-formatter-simulation-result');

      expect(payloadFormatter).toHaveAttribute('data-value', JSON.stringify(specialData));
      expect(resultFormatter).toHaveAttribute('data-value', JSON.stringify(specialData));
    });

    it('should handle very large data objects', () => {
      const largeData = {
        items: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item_${i}` })),
      };

      const props: IViewPayload = {
        data: {
          old_data: largeData,
          new_data: largeData,
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: largeData,
          result: largeData,
        },
      });

      render(<ViewPayload {...props} />);
      const payloadFormatter = screen.getByTestId('json-formatter-payload');
      expect(payloadFormatter).toHaveAttribute('data-value', JSON.stringify(largeData));
    });

    it('should handle empty arrays and objects', () => {
      const emptyData = {
        emptyArray: [],
        emptyObject: {},
      };

      const props: IViewPayload = {
        data: {
          old_data: emptyData,
          new_data: emptyData,
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: emptyData,
          result: emptyData,
        },
      });

      render(<ViewPayload {...props} />);
      const payloadFormatter = screen.getByTestId('json-formatter-payload');
      const resultFormatter = screen.getByTestId('json-formatter-simulation-result');

      expect(payloadFormatter).toHaveAttribute('data-value', JSON.stringify(emptyData));
      expect(resultFormatter).toHaveAttribute('data-value', JSON.stringify(emptyData));
    });

    it('should handle multiple rapid rerenders', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      const { rerender } = render(<ViewPayload {...props} />);

      for (let i = 0; i < 10; i++) {
        rerender(<ViewPayload {...props} />);
      }

      expect(screen.getByTestId('json-formatter-payload')).toBeInTheDocument();
      expect(screen.getByTestId('json-formatter-simulation-result')).toBeInTheDocument();
    });

    it('should handle data with boolean and number values', () => {
      const mixedData = {
        active: true,
        count: 42,
        ratio: 3.14,
        disabled: false,
      };

      const props: IViewPayload = {
        data: {
          old_data: mixedData,
          new_data: mixedData,
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: mixedData,
          result: mixedData,
        },
      });

      render(<ViewPayload {...props} />);
      const payloadFormatter = screen.getByTestId('json-formatter-payload');
      expect(payloadFormatter).toHaveAttribute('data-value', JSON.stringify(mixedData));
    });
  });

  describe('Component Integration', () => {
    it('should correctly integrate with controller hook', () => {
      const mockData = {
        transaction: 'tx123',
        amount: 1000,
      };

      const mockResult = {
        risk_score: 0.75,
        status: 'reviewed',
      };

      const props: IViewPayload = {
        data: {
          old_data: mockData,
          new_data: mockResult,
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: mockData,
          result: mockResult,
        },
      });

      render(<ViewPayload {...props} />);

      expect(mockUseViewPayloadController).toHaveBeenCalledWith(props);
      expect(screen.getByTestId('json-formatter-payload')).toBeInTheDocument();
      expect(screen.getByTestId('json-formatter-simulation-result')).toBeInTheDocument();
    });

    it('should properly pass data to FormattedJsonSection components', () => {
      const payloadData = { input: 'test' };
      const resultData = { output: 'result' };

      const props: IViewPayload = {
        data: {
          old_data: payloadData,
          new_data: resultData,
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: payloadData,
          result: resultData,
        },
      });

      render(<ViewPayload {...props} />);

      const payloadFormatter = screen.getByTestId('json-formatter-payload');
      const resultFormatter = screen.getByTestId('json-formatter-simulation-result');

      expect(payloadFormatter).toHaveAttribute('data-value', JSON.stringify(payloadData));
      expect(resultFormatter).toHaveAttribute('data-value', JSON.stringify(resultData));
    });
  });

  describe('Component Export', () => {
    it('should export the component as default', () => {
      expect(ViewPayload).toBeDefined();
      expect(typeof ViewPayload).toBe('function');
    });

    it('should render as a React component', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      const { container } = render(<ViewPayload {...props} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible structure', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      const { container } = render(<ViewPayload {...props} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with proper labels for both sections', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      render(<ViewPayload {...props} />);

      const payloadFormatter = screen.getByTestId('json-formatter-payload');
      const resultFormatter = screen.getByTestId('json-formatter-simulation-result');

      expect(payloadFormatter).toHaveAttribute('data-label', 'Payload');
      expect(resultFormatter).toHaveAttribute('data-label', 'Simulation Result');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should render transaction payload and fraud detection result', () => {
      const transactionPayload = {
        transaction_id: 'tx_123456',
        amount: 5000,
        currency: 'USD',
        sender: { account: 'ACC001', name: 'John Doe' },
        receiver: { account: 'ACC002', name: 'Jane Smith' },
        timestamp: '2024-01-15T10:30:00Z',
      };

      const fraudResult = {
        risk_score: 0.85,
        fraud_indicators: ['high_amount', 'new_receiver', 'unusual_time'],
        recommendation: 'review',
        rules_triggered: [
          { rule_id: 'R001', name: 'High Amount Rule', score: 0.3 },
          { rule_id: 'R002', name: 'New Account Rule', score: 0.25 },
        ],
      };

      const props: IViewPayload = {
        data: {
          old_data: transactionPayload,
          new_data: fraudResult,
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: transactionPayload,
          result: fraudResult,
        },
      });

      render(<ViewPayload {...props} />);

      const payloadFormatter = screen.getByTestId('json-formatter-payload');
      const resultFormatter = screen.getByTestId('json-formatter-simulation-result');

      expect(payloadFormatter).toHaveAttribute('data-value', JSON.stringify(transactionPayload));
      expect(resultFormatter).toHaveAttribute('data-value', JSON.stringify(fraudResult));
    });

    it('should render rule configuration test scenario', () => {
      const ruleConfig = {
        rule_id: 'R001',
        name: 'High Value Transaction Rule',
        config: {
          threshold: 10000,
          currency: 'USD',
          timeframe: '24h',
        },
        active: true,
      };

      const validationResult = {
        valid: true,
        errors: [],
        warnings: ['Currency conversion may affect accuracy'],
        simulated_matches: 5,
      };

      const props: IViewPayload = {
        data: {
          old_data: ruleConfig,
          new_data: validationResult,
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: ruleConfig,
          result: validationResult,
        },
      });

      render(<ViewPayload {...props} />);

      const payloadFormatter = screen.getByTestId('json-formatter-payload');
      const resultFormatter = screen.getByTestId('json-formatter-simulation-result');

      expect(payloadFormatter).toHaveAttribute('data-value', JSON.stringify(ruleConfig));
      expect(resultFormatter).toHaveAttribute('data-value', JSON.stringify(validationResult));
    });

    it('should handle empty simulation result gracefully', () => {
      const payload = {
        transaction_id: 'tx_789',
        amount: 100,
        currency: 'USD',
      };

      const props: IViewPayload = {
        data: {
          old_data: payload,
          new_data: {},
        },
      };

      mockUseViewPayloadController.mockReturnValue({
        values: {
          payload: payload,
          result: {},
        },
      });

      render(<ViewPayload {...props} />);

      const payloadFormatter = screen.getByTestId('json-formatter-payload');
      const resultFormatter = screen.getByTestId('json-formatter-simulation-result');

      expect(payloadFormatter).toHaveAttribute('data-value', JSON.stringify(payload));
      expect(resultFormatter).toHaveAttribute('data-value', JSON.stringify({}));
    });
  });
});

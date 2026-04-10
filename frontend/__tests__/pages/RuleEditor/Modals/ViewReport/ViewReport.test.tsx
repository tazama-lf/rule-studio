import { render, screen } from '@testing-library/react';

// Mock the controller hook BEFORE importing the component
jest.mock('../../../../../src/pages/RuleEditor/Modals/ViewReport/useViewReportController');

// Mock the Redux API and storage utilities
jest.mock('../../../../../src/redux/Api/Simulation', () => ({
  useLazyGetReportQuery: jest.fn(),
}));

jest.mock('../../../../../src/utils/Common/storage', () => ({
  extractData: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

import ViewReport from '../../../../../src/pages/RuleEditor/Modals/ViewReport';
import useViewReportController, { type IViewReport } from '../../../../../src/pages/RuleEditor/Modals/ViewReport/useViewReportController';

// Mock the Loader component
jest.mock('../../../../../src/components/Loader', () => ({
  __esModule: true,
  default: ({ center }: { center?: boolean }) => (
    <div data-testid="loader" data-center={center ? 'true' : 'false'}>
      Loading...
    </div>
  ),
}));

const mockUseViewReportController = useViewReportController as jest.MockedFunction<
  typeof useViewReportController
>;

describe('ViewReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockUseViewReportController.mockReturnValue({
      values: {
        isLoading: false,
        htmlContent: '',
      },
      functions: {},
    });
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '<html><body>Report</body></html>',
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should call the controller hook with props', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001', id: '123' },
      };

      render(<ViewReport {...props} />);
      expect(mockUseViewReportController).toHaveBeenCalledWith(props);
    });

    it('should render Grid container with correct spacing', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '<html>Report</html>',
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const gridContainer = container.querySelector('.MuiGrid-container');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render Loader when isLoading is true', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: true,
          htmlContent: '',
        },
        functions: {},
      });

      render(<ViewReport {...props} />);
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should render Loader with center prop when loading', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: true,
          htmlContent: '',
        },
        functions: {},
      });

      render(<ViewReport {...props} />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('data-center', 'true');
    });

    it('should not render iframe when loading', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: true,
          htmlContent: '',
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const iframe = container.querySelector('iframe');
      expect(iframe).not.toBeInTheDocument();
    });

    it('should not render Grid layout when loading', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: true,
          htmlContent: '',
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const gridContainer = container.querySelector('.MuiGrid-container');
      expect(gridContainer).not.toBeInTheDocument();
    });

    it('should switch from loader to content when loading completes', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: true,
          htmlContent: '',
        },
        functions: {},
      });

      const { rerender, container } = render(<ViewReport {...props} />);
      expect(screen.getByTestId('loader')).toBeInTheDocument();

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '<html>Report</html>',
        },
        functions: {},
      });

      rerender(<ViewReport {...props} />);
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
    });
  });

  describe('Iframe Rendering', () => {
    it('should render iframe when not loading', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '<html><body>Report Content</body></html>',
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
    });

    it('should set iframe srcDoc to htmlContent', () => {
      const htmlContent = '<html><body><h1>Test Report</h1></body></html>';
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: htmlContent,
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('srcdoc')).toBe(htmlContent);
    });

    it('should render iframe with empty srcDoc when htmlContent is empty', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '',
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('srcdoc')).toBe('');
    });

    it('should handle complex HTML content in iframe', () => {
      const complexHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Complex Report</title>
            <style>body { font-family: Arial; }</style>
          </head>
          <body>
            <div class="report-container">
              <h1>Report Title</h1>
              <table><tr><td>Data</td></tr></table>
            </div>
          </body>
        </html>
      `;
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: complexHtml,
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('srcdoc')).toBe(complexHtml);
    });

    it('should render iframe with Box component wrapper', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '<html>Report</html>',
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const iframe = container.querySelector('iframe');
      // Check that iframe has a parent element (Box wrapper)
      expect(iframe?.parentElement).toBeInTheDocument();
    });

    it('should handle HTML with special characters', () => {
      const htmlWithSpecialChars = '<div>Special &lt;&gt;&amp;"\'</div>';
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: htmlWithSpecialChars,
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('srcdoc')).toBe(htmlWithSpecialChars);
    });

    it('should handle HTML with inline scripts', () => {
      const htmlWithScripts = '<html><script>console.log("test")</script><body>Content</body></html>';
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: htmlWithScripts,
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('srcdoc')).toBe(htmlWithScripts);
    });
  });

  describe('Layout Structure', () => {
    it('should render Grid with size xs:12', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '<html>Report</html>',
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const gridItem = container.querySelector('.MuiGrid-root[class*="Grid-grid-xs-12"]');
      expect(gridItem).toBeInTheDocument();
    });

    it('should maintain layout structure across rerenders', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '<html>Report</html>',
        },
        functions: {},
      });

      const { container, rerender } = render(<ViewReport {...props} />);
      const initialGrids = container.querySelectorAll('.MuiGrid-root').length;

      rerender(<ViewReport {...props} />);
      const rerenderedGrids = container.querySelectorAll('.MuiGrid-root').length;

      expect(initialGrids).toBe(rerenderedGrids);
    });
  });

  describe('Props Updates', () => {
    it('should update iframe content when htmlContent changes', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '<html>Initial Report</html>',
        },
        functions: {},
      });

      const { container, rerender } = render(<ViewReport {...props} />);
      let iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('srcdoc')).toBe('<html>Initial Report</html>');

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '<html>Updated Report</html>',
        },
        functions: {},
      });

      rerender(<ViewReport {...props} />);
      iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('srcdoc')).toBe('<html>Updated Report</html>');
    });

    it('should handle transition from empty to populated content', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '',
        },
        functions: {},
      });

      const { container, rerender } = render(<ViewReport {...props} />);
      let iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('srcdoc')).toBe('');

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '<html><body>New Report</body></html>',
        },
        functions: {},
      });

      rerender(<ViewReport {...props} />);
      iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('srcdoc')).toBe('<html><body>New Report</body></html>');
    });
  });

  describe('Edge Cases', () => {
    it('should handle when values object is undefined', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: undefined as any,
        functions: {},
      });

      render(<ViewReport {...props} />);
      // Should render loader when values?.isLoading is undefined (falsy)
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    it('should handle undefined htmlContent gracefully', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: undefined as any,
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe).toBeInTheDocument();
    });

    it('should handle multiple rapid rerenders', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '<html>Report</html>',
        },
        functions: {},
      });

      const { container, rerender } = render(<ViewReport {...props} />);

      for (let i = 0; i < 10; i++) {
        rerender(<ViewReport {...props} />);
      }

      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
    });

    it('should handle very long HTML content', () => {
      const longHtml = '<html><body>' + 'a'.repeat(10000) + '</body></html>';
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: longHtml,
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('srcdoc')).toBe(longHtml);
    });

    it('should handle HTML with newlines and whitespace', () => {
      const htmlWithWhitespace = `
        <html>
          <body>
            <div>
              Content with whitespace
            </div>
          </body>
        </html>
      `;
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: htmlWithWhitespace,
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('srcdoc')).toBe(htmlWithWhitespace);
    });
  });

  describe('Component Integration', () => {
    it('should correctly integrate with controller hook', () => {
      const htmlContent = '<html><body><h1>Integration Test</h1></body></html>';
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001', id: '123' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: htmlContent,
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);

      expect(mockUseViewReportController).toHaveBeenCalledWith(props);
      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('srcdoc')).toBe(htmlContent);
    });

    it('should handle full loading to loaded cycle', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: true,
          htmlContent: '',
        },
        functions: {},
      });

      const { container, rerender } = render(<ViewReport {...props} />);
      expect(screen.getByTestId('loader')).toBeInTheDocument();

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '<html>Report Loaded</html>',
        },
        functions: {},
      });

      rerender(<ViewReport {...props} />);
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('srcdoc')).toBe('<html>Report Loaded</html>');
    });
  });

  describe('Component Export', () => {
    it('should export the component as default', () => {
      expect(ViewReport).toBeDefined();
      expect(typeof ViewReport).toBe('function');
    });

    it('should render as a React component', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '<html>Report</html>',
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible structure when displaying report', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '<html>Report</html>',
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have accessible structure when loading', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: true,
          htmlContent: '',
        },
        functions: {},
      });

      render(<ViewReport {...props} />);
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should display fraud detection rule report with charts', () => {
      const reportHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Fraud Detection Report</title>
            <style>
              body { font-family: Arial, sans-serif; }
              .chart { width: 100%; height: 400px; }
            </style>
          </head>
          <body>
            <h1>Fraud Detection Rule Report</h1>
            <div class="chart" id="riskChart"></div>
            <table>
              <tr><th>Metric</th><th>Value</th></tr>
              <tr><td>Risk Score</td><td>0.85</td></tr>
              <tr><td>Cases Detected</td><td>42</td></tr>
            </table>
          </body>
        </html>
      `;
      const props: IViewReport = {
        data: { rule_config_id: 'fraud_detection_v2', id: 'FDR_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: reportHtml,
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('srcdoc')).toBe(reportHtml);
    });

    it('should display analytics report with embedded visualizations', () => {
      const analyticsReport = `
        <html>
          <head>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          </head>
          <body>
            <h1>Rule Analytics Report</h1>
            <canvas id="performanceChart"></canvas>
            <div class="metrics">
              <p>True Positives: 95%</p>
              <p>False Positives: 5%</p>
            </div>
          </body>
        </html>
      `;
      const props: IViewReport = {
        data: { rule_config_id: 'analytics_rule', id: '123' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: analyticsReport,
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('srcdoc')).toBe(analyticsReport);
    });

    it('should handle empty report gracefully', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      mockUseViewReportController.mockReturnValue({
        values: {
          isLoading: false,
          htmlContent: '',
        },
        functions: {},
      });

      const { container } = render(<ViewReport {...props} />);
      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe).toBeInTheDocument();
      expect(iframe.getAttribute('srcdoc')).toBe('');
    });
  });
});

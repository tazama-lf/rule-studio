import { renderHook, waitFor, act } from '@testing-library/react';
import useViewReportController, { type IViewReport } from '../../../../../src/pages/RuleEditor/Modals/ViewReport/useViewReportController';
import { useLazyGetReportQuery } from '../../../../../src/redux/Api/Simulation';
import { extractData } from '../../../../../src/utils/Common/storage';
import toast from 'react-hot-toast';

// Mock dependencies
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
    success: jest.fn(),
  },
}));

const mockUseLazyGetReportQuery = useLazyGetReportQuery as jest.MockedFunction<
  typeof useLazyGetReportQuery
>;
const mockExtractData = extractData as jest.MockedFunction<typeof extractData>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('useViewReportController', () => {
  let mockGetReport: jest.Mock;
  let mockUnwrap: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUnwrap = jest.fn().mockResolvedValue('<html>Default Report</html>');
    mockGetReport = jest.fn().mockReturnValue({
      unwrap: mockUnwrap,
    });

    // Default mock implementations
    mockUseLazyGetReportQuery.mockReturnValue([
      mockGetReport,
      { isLoading: false } as any,
      {} as any,
    ]);

    mockExtractData.mockReturnValue(null);
  });

  describe('Hook Initialization', () => {
    it('should return values object with isLoading and htmlContent', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      const { result } = renderHook(() => useViewReportController(props));

      expect(result.current).toHaveProperty('values');
      expect(result.current).toHaveProperty('functions');
      expect(result.current.values).toHaveProperty('isLoading');
      expect(result.current.values).toHaveProperty('htmlContent');
    });

    it('should initialize with empty htmlContent', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      const { result } = renderHook(() => useViewReportController(props));

      expect(result.current.values.htmlContent).toBe('');
    });

    it('should initialize with isLoading false', () => {
      const props: IViewReport = {};

      const { result } = renderHook(() => useViewReportController(props));

      expect(result.current.values.isLoading).toBe(false);
    });

    it('should return empty functions object', () => {
      const props: IViewReport = {};

      const { result } = renderHook(() => useViewReportController(props));

      expect(result.current.functions).toEqual({});
      expect(Object.keys(result.current.functions)).toHaveLength(0);
    });
  });

  describe('Data Extraction', () => {
    it('should extract data from localStorage when available', () => {
      const storageData = { rule_config_id: 'rule_storage', id: '123' };
      mockExtractData.mockReturnValue(storageData);

      const props: IViewReport = {
        data: { rule_config_id: 'rule_props' },
      };

      renderHook(() => useViewReportController(props));

      expect(mockExtractData).toHaveBeenCalledWith('trs_rule', expect.anything(), true);
    });

    it('should use props data when localStorage data is null', () => {
      mockExtractData.mockReturnValue(null);
      mockUnwrap.mockResolvedValue('<html>Report</html>');

      const propsData = { rule_config_id: 'rule_props', id: '456' };
      const props: IViewReport = {
        data: propsData,
      };

      renderHook(() => useViewReportController(props));

      expect(mockExtractData).toHaveBeenCalled();
    });

    it('should prioritize localStorage data over props data', async () => {
      const storageData = { rule_config_id: 'rule_storage@v1', id: '123' };
      mockExtractData.mockReturnValue(storageData);
      mockUnwrap.mockResolvedValue('<html>Report</html>');

      const props: IViewReport = {
        data: { rule_config_id: 'rule_props', id: '456' },
      };

      renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(mockGetReport).toHaveBeenCalledWith({
          organization: 'psl-copilot',
          ruleId: 'rule_storage',
          branchName: 'staging',
        });
      });
    });

    it('should handle undefined props data', () => {
      mockExtractData.mockReturnValue(null);

      const props: IViewReport = {};

      const { result } = renderHook(() => useViewReportController(props));

      expect(result.current.values.htmlContent).toBe('');
    });
  });

  describe('Report Fetching', () => {
    it('should call getReport on mount', async () => {
      const data = { rule_config_id: 'rule_001', id: '123' };
      mockExtractData.mockReturnValue(data);
      mockUnwrap.mockResolvedValue('<html>Report Content</html>');

      const props: IViewReport = {};

      renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(mockGetReport).toHaveBeenCalledWith({
          organization: 'psl-copilot',
          ruleId: 'rule_001',
          branchName: 'staging',
        });
      });
    });

    it('should extract ruleId by splitting rule_config_id at @', async () => {
      const data = { rule_config_id: 'complex_rule_123@version_2@branch', id: '456' };
      mockExtractData.mockReturnValue(data);
      mockUnwrap.mockResolvedValue('<html>Report</html>');

      const props: IViewReport = {};

      renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(mockGetReport).toHaveBeenCalledWith({
          organization: 'psl-copilot',
          ruleId: 'complex_rule_123',
          branchName: 'staging',
        });
      });
    });

    it('should set htmlContent on successful report fetch', async () => {
      const data = { rule_config_id: 'rule_001', id: '123' };
      mockExtractData.mockReturnValue(data);
      const htmlContent = '<html><body><h1>Report Title</h1></body></html>';
      mockUnwrap.mockResolvedValue(htmlContent);

      const props: IViewReport = {};

      const { result } = renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(result.current.values.htmlContent).toBe(htmlContent);
      });
    });

    it('should handle string response from report API', async () => {
      const data = { rule_config_id: 'rule_001', id: '123' };
      mockExtractData.mockReturnValue(data);
      const htmlString = '<div>Simple HTML</div>';
      mockUnwrap.mockResolvedValue(htmlString);

      const props: IViewReport = {};

      const { result } = renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(result.current.values.htmlContent).toBe(htmlString);
      });
    });

    it('should show error toast when response is not a string', async () => {
      const data = { rule_config_id: 'rule_001', id: '123' };
      mockExtractData.mockReturnValue(data);
      mockUnwrap.mockResolvedValue({ invalid: 'format' });

      const props: IViewReport = {};

      renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Invalid report format received');
      });
    });

    it('should show error toast when getReport fails', async () => {
      const data = { rule_config_id: 'rule_001', id: '123' };
      mockExtractData.mockReturnValue(data);
      mockUnwrap.mockRejectedValue(new Error('Network error'));

      const props: IViewReport = {};

      renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to fetch report');
      });
    });

    it('should not set htmlContent when response is invalid', async () => {
      const data = { rule_config_id: 'rule_001', id: '123' };
      mockExtractData.mockReturnValue(data);
      mockUnwrap.mockResolvedValue(null);

      const props: IViewReport = {};

      const { result } = renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Invalid report format received');
      });

      expect(result.current.values.htmlContent).toBe('');
    });
  });

  describe('Loading State', () => {
    it('should reflect loading state from lazy query', () => {
      mockUseLazyGetReportQuery.mockReturnValue([
        mockGetReport,
        { isLoading: true } as any,
        {} as any,
      ]);

      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      const { result } = renderHook(() => useViewReportController(props));

      expect(result.current.values.isLoading).toBe(true);
    });

    it('should transition from loading to loaded state', () => {
      mockUseLazyGetReportQuery.mockReturnValue([
        mockGetReport,
        { isLoading: true } as any,
        {} as any,
      ]);

      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      const { result, rerender } = renderHook(() => useViewReportController(props));

      expect(result.current.values.isLoading).toBe(true);

      mockUseLazyGetReportQuery.mockReturnValue([
        mockGetReport,
        { isLoading: false } as any,
        {} as any,
      ]);

      rerender();

      expect(result.current.values.isLoading).toBe(false);
    });
  });

  describe('useEffect Behavior', () => {
    it('should call handleReport on mount', async () => {
      const data = { rule_config_id: 'rule_001', id: '123' };
      mockExtractData.mockReturnValue(data);
      mockUnwrap.mockResolvedValue('<html>Report</html>');

      const props: IViewReport = {};

      renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(mockGetReport).toHaveBeenCalled();
      });
    });

    it('should call handleReport again when dependencies change', async () => {
      const initialData = { rule_config_id: 'rule_001', id: '123' };
      mockExtractData.mockReturnValue(null); // Use props data instead
      mockUnwrap.mockResolvedValue('<html>Report 1</html>');

      const initialProps: IViewReport = { data: initialData };

      const { rerender } = renderHook(
        ({ props }) => useViewReportController(props),
        { initialProps: { props: initialProps } }
      );

      await waitFor(() => {
        expect(mockGetReport).toHaveBeenCalledTimes(1);
      });

      const updatedData = { rule_config_id: 'rule_002', id: '456' };
      const updatedProps: IViewReport = { data: updatedData };

      rerender({ props: updatedProps });

      await waitFor(() => {
        expect(mockGetReport).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Return Structure Validation', () => {
    it('should return object with values and functions properties', () => {
      const props: IViewReport = {};

      const { result } = renderHook(() => useViewReportController(props));

      expect(result.current).toHaveProperty('values');
      expect(result.current).toHaveProperty('functions');
    });

    it('should return values with exactly isLoading and htmlContent keys', () => {
      const props: IViewReport = {};

      const { result } = renderHook(() => useViewReportController(props));

      const keys = Object.keys(result.current.values);
      expect(keys).toContain('isLoading');
      expect(keys).toContain('htmlContent');
      expect(keys).toHaveLength(2);
    });

    it('should maintain consistent structure across rerenders', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      const { result, rerender } = renderHook(() => useViewReportController(props));

      const initialKeys = Object.keys(result.current);
      const initialValueKeys = Object.keys(result.current.values);

      rerender();

      const rerenderKeys = Object.keys(result.current);
      const rerenderValueKeys = Object.keys(result.current.values);

      expect(initialKeys).toEqual(rerenderKeys);
      expect(initialValueKeys).toEqual(rerenderValueKeys);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rule_config_id without @ symbol', async () => {
      const data = { rule_config_id: 'simple_rule', id: '123' };
      mockExtractData.mockReturnValue(data);
      mockUnwrap.mockResolvedValue('<html>Report</html>');

      const props: IViewReport = {};

      renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(mockGetReport).toHaveBeenCalledWith({
          organization: 'psl-copilot',
          ruleId: 'simple_rule',
          branchName: 'staging',
        });
      });
    });

    it('should handle numeric rule_config_id', async () => {
      const data = { rule_config_id: 12345, id: '123' };
      mockExtractData.mockReturnValue(data);
      mockUnwrap.mockResolvedValue('<html>Report</html>');

      const props: IViewReport = {};

      renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(mockGetReport).toHaveBeenCalledWith({
          organization: 'psl-copilot',
          ruleId: '12345',
          branchName: 'staging',
        });
      });
    });

    it('should handle missing rule_config_id', async () => {
      const data = { id: '123' };
      mockExtractData.mockReturnValue(data);
      mockUnwrap.mockResolvedValue('<html>Report</html>');

      const props: IViewReport = {};

      renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(mockGetReport).toHaveBeenCalled();
      });
    });

    it('should handle empty HTML content', async () => {
      const data = { rule_config_id: 'rule_001', id: '123' };
      mockExtractData.mockReturnValue(data);
      mockUnwrap.mockResolvedValue('');

      const props: IViewReport = {};

      const { result } = renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(result.current.values.htmlContent).toBe('');
      });
    });

    it('should handle complex HTML content', async () => {
      const data = { rule_config_id: 'rule_001', id: '123' };
      mockExtractData.mockReturnValue(data);
      const complexHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Report</title></head>
          <body>
            <div class="container">
              <h1>Complex Report</h1>
              <table><tr><td>Data</td></tr></table>
            </div>
          </body>
        </html>
      `;
      mockUnwrap.mockResolvedValue(complexHtml);

      const props: IViewReport = {};

      const { result } = renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(result.current.values.htmlContent).toBe(complexHtml);
      });
    });

    it('should handle HTML with special characters', async () => {
      const data = { rule_config_id: 'rule_001', id: '123' };
      mockExtractData.mockReturnValue(data);
      const htmlWithSpecialChars = '<div>Special &lt;&gt;&amp;"\'</div>';
      mockUnwrap.mockResolvedValue(htmlWithSpecialChars);

      const props: IViewReport = {};

      const { result } = renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(result.current.values.htmlContent).toBe(htmlWithSpecialChars);
      });
    });

    it('should handle multiple consecutive errors', async () => {
      const data = { rule_config_id: 'rule_001', id: '123' };
      mockExtractData.mockReturnValue(data);
      mockUnwrap.mockRejectedValue(new Error('Error 1'));

      const props: IViewReport = {};

      renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to fetch report');
      });

      expect(mockToast.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should fetch and display fraud detection rule report', async () => {
      const ruleData = {
        rule_config_id: 'fraud_detection_rule_v2@2024-01-15',
        id: 'FDR_001',
        name: 'Fraud Detection Rule',
      };
      mockExtractData.mockReturnValue(ruleData);
      const reportHtml = `
        <html>
          <body>
            <h1>Fraud Detection Rule Report</h1>
            <p>Risk Score: 0.85</p>
          </body>
        </html>
      `;
      mockUnwrap.mockResolvedValue(reportHtml);

      const props: IViewReport = {};

      const { result } = renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(mockGetReport).toHaveBeenCalledWith({
          organization: 'psl-copilot',
          ruleId: 'fraud_detection_rule_v2',
          branchName: 'staging',
        });
        expect(result.current.values.htmlContent).toBe(reportHtml);
      });
    });

    it('should handle report with charts and visualizations', async () => {
      const data = { rule_config_id: 'analytics_rule', id: '123' };
      mockExtractData.mockReturnValue(data);
      const reportWithCharts = `
        <html>
          <head><script src="chart.js"></script></head>
          <body>
            <canvas id="myChart"></canvas>
            <div class="visualization"></div>
          </body>
        </html>
      `;
      mockUnwrap.mockResolvedValue(reportWithCharts);

      const props: IViewReport = {};

      const { result } = renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(result.current.values.htmlContent).toBe(reportWithCharts);
      });
    });

    it('should handle network timeout error gracefully', async () => {
      const data = { rule_config_id: 'rule_001', id: '123' };
      mockExtractData.mockReturnValue(data);
      mockUnwrap.mockRejectedValue(new Error('Request timeout'));

      const props: IViewReport = {};

      renderHook(() => useViewReportController(props));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to fetch report');
      });
    });
  });

  describe('Type Interface', () => {
    it('should accept IViewReport interface', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      expect(() => renderHook(() => useViewReportController(props))).not.toThrow();
    });

    it('should accept undefined data in IViewReport', () => {
      const props: IViewReport = {
        data: undefined,
      };

      expect(() => renderHook(() => useViewReportController(props))).not.toThrow();
    });

    it('should accept empty object as props', () => {
      const props: IViewReport = {};

      expect(() => renderHook(() => useViewReportController(props))).not.toThrow();
    });
  });

  describe('Hook Export', () => {
    it('should export the hook as default', () => {
      expect(useViewReportController).toBeDefined();
      expect(typeof useViewReportController).toBe('function');
    });

    it('should export IViewReport interface', () => {
      const props: IViewReport = {
        data: {},
      };

      expect(props).toBeDefined();
    });
  });

  describe('Integration with Storage', () => {
    it('should call extractData with correct parameters', () => {
      const props: IViewReport = {
        data: { rule_config_id: 'rule_001' },
      };

      renderHook(() => useViewReportController(props));

      expect(mockExtractData).toHaveBeenCalledWith('trs_rule', expect.anything(), true);
    });

    it('should use memoized data based on props.data changes', async () => {
      const initialProps: IViewReport = {
        data: { rule_config_id: 'rule_001', id: '123' },
      };
      mockExtractData.mockReturnValue(null);
      mockUnwrap.mockResolvedValue('<html>Report 1</html>');

      const { rerender } = renderHook(
        ({ props }) => useViewReportController(props),
        { initialProps: { props: initialProps } }
      );

      await waitFor(() => {
        expect(mockGetReport).toHaveBeenCalledTimes(1);
      });

      const updatedProps: IViewReport = {
        data: { rule_config_id: 'rule_002', id: '456' },
      };

      rerender({ props: updatedProps });

      await waitFor(() => {
        expect(mockGetReport).toHaveBeenCalledTimes(2);
      });
    });
  });
});

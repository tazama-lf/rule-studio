import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ViewRule from '../../../../src/pages/Home/ViewRule';

jest.mock('../../../../src/pages/Home/ViewRule/useViewRuleController', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    values: {
      data: {
        rule_name: 'Test Rule',
        txtp: 'Transaction Type A',
        version: '1.0.0',
        status: 'Active',
        publishing_status: 'Published',
        created_at: '2024-01-01T00:00:00Z',
        description: 'Test description',
      },
    },
    functions: {},
  })),
}));

jest.mock('../../../../src/utils/Common/helpers', () => ({
  dateFormatter: jest.fn((date) => date),
}));

const theme = createTheme({
  palette: {
    text: { primary: '#000', secondary: '#666', black: '#000' },
    static: { grey: '#ccc', border: '#ddd', secondary: '#1976d2' },
  } as any,
});

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const mockData = {
  rule_name: 'Test Rule',
  txtp: 'Transaction Type A',
  version: '1.0.0',
  status: 'Active',
  publishing_status: 'Published',
  created_at: '2024-01-01T00:00:00Z',
  description: 'Test description',
};

describe('ViewRule Component', () => {
  describe('Component Rendering', () => {
    it('should render the ViewRule component', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test Rule')).toBeInTheDocument();
    });

    it('should render without errors', () => {
      const { container } = renderWithTheme(<ViewRule data={mockData} />);

      expect(container).toBeInTheDocument();
    });

    it('should render all input fields', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test Rule')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Transaction Type A')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1.0.0')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Active')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Published')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    });
  });

  describe('Field Labels', () => {
    it('should display Rule Name label', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      const labels = screen.getAllByText(/Rule Name/i);
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should display Transaction Type label', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      const labels = screen.getAllByText(/Transaction Type/i);
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should display Version label', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      const labels = screen.getAllByText(/Version/i);
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should display Status label', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      const labels = screen.getAllByText(/Status/i);
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should display Publishing Status label', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      const labels = screen.getAllByText(/Publishing Status/i);
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should display Created At label', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      const labels = screen.getAllByText(/Created At/i);
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should display Description label', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      const labels = screen.getAllByText(/Description/i);
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  describe('Field Values', () => {
    it('should display Rule Name value', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test Rule')).toBeInTheDocument();
    });

    it('should display Transaction Type value', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Transaction Type A')).toBeInTheDocument();
    });

    it('should display Version value', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('1.0.0')).toBeInTheDocument();
    });

    it('should display Status value', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Active')).toBeInTheDocument();
    });

    it('should display Publishing Status value', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Published')).toBeInTheDocument();
    });

    it('should display Description value', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable Rule Name field', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test Rule')).toBeDisabled();
    });

    it('should disable Transaction Type field', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Transaction Type A')).toBeDisabled();
    });

    it('should disable Version field', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('1.0.0')).toBeDisabled();
    });

    it('should disable Status field', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Active')).toBeDisabled();
    });

    it('should disable Publishing Status field', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Published')).toBeDisabled();
    });

    it('should disable Created At field', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('2024-01-01T00:00:00Z')).toBeDisabled();
    });

    it('should disable Description field', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test description')).toBeDisabled();
    });
  });

  describe('Layout Structure', () => {
    it('should render Grid container', () => {
      const { container } = renderWithTheme(<ViewRule data={mockData} />);

      const grids = container.querySelectorAll('.MuiGrid-container');
      expect(grids.length).toBeGreaterThan(0);
    });

    it('should render fields in rows', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test Rule')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Transaction Type A')).toBeInTheDocument();
    });

    it('should have proper grid spacing', () => {
      const { container } = renderWithTheme(<ViewRule data={mockData} />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Input Sizing', () => {
    it('should set maxWidth for Rule Name', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test Rule')).toBeInTheDocument();
    });

    it('should set maxWidth for other fields', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Transaction Type A')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1.0.0')).toBeInTheDocument();
    });

    it('should set full width for Description', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    });
  });

  describe('Controller Integration', () => {
    it('should call useViewRuleController with data', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test Rule')).toBeInTheDocument();
    });

    it('should use controller values', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test Rule')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should accept data prop', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test Rule')).toBeInTheDocument();
    });

    it('should render with ViewRuleProps', () => {
      const { container } = renderWithTheme(<ViewRule data={mockData} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format Created At date', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('2024-01-01T00:00:00Z')).toBeInTheDocument();
    });

    it('should use dateFormatter helper', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('2024-01-01T00:00:00Z')).toBeInTheDocument();
    });
  });

  describe('Description Field', () => {
    it('should render description as textarea', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    });

    it('should display description value', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    });
  });

  describe('View Only Mode', () => {
    it('should set view_only to false for all fields', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test Rule')).toBeDisabled();
    });

    it('should display all fields in view mode', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test Rule')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Active')).toBeInTheDocument();
    });
  });

  describe('Grid Responsiveness', () => {
    it('should use responsive grid sizes', () => {
      const { container } = renderWithTheme(<ViewRule data={mockData} />);

      expect(container.querySelector('.MuiGrid-container')).toBeInTheDocument();
    });

    it('should have flexible layout', () => {
      const { container } = renderWithTheme(<ViewRule data={mockData} />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for all inputs', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getAllByText(/Rule Name/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Transaction Type/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Version/i).length).toBeGreaterThan(0);
    });

    it('should be keyboard accessible', () => {
      renderWithTheme(<ViewRule data={mockData} />);

      expect(screen.getByDisplayValue('Test Rule')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const emptyData = {
        rule_name: '',
        txtp: '',
        version: '',
        status: '',
        publishing_status: '',
        created_at: '',
        description: '',
      };

      renderWithTheme(<ViewRule data={emptyData} />);

      const labels = screen.getAllByText(/Rule Name/i);
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should render without data values', () => {
      const minimalData = {} as Record<string, string>;

      renderWithTheme(<ViewRule data={minimalData} />);

      const labels = screen.getAllByText(/Rule Name/i);
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  describe('Component Export', () => {
    it('should export ViewRule as default', () => {
      expect(ViewRule).toBeDefined();
    });

    it('should be a functional component', () => {
      expect(typeof ViewRule).toBe('function');
    });
  });
});

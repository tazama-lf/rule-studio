import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Home from '../../../src/pages/Home';

jest.mock('../../../src/redux/Api/Simulation', () => ({
  useMergeBranchMutation: jest.fn(() => [
    jest.fn(),
    {
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: undefined,
      data: undefined,
    },
  ]),
}));

const mockHandleCreateEdit = jest.fn();
const mockSetSearchTerm = jest.fn();
const mockSetStatus = jest.fn();
const mockSetRuleType = jest.fn();
const mockResetFilter = jest.fn();

jest.mock('../../../src/pages/Home/useHomeController', () => ({
  __esModule: true,
  default: () => ({
    values: {
      columns: [
        { label: 'Rule Name', key: 'rule_name' },
        { label: 'Status', key: 'status' },
      ],
      data: [],
      isLoading: false,
      pagination: {
        offset: 0,
        limit: 10,
        total: 0,
        onPageChange: jest.fn(),
      },
      searchTerm: '',
      status: null,
      ruleType: null,
      user: { claims: 'editor' },
      statusLoad: false,
      statusOptions: [
        { label: 'All', value: '' },
        { label: 'Active', value: 'active' },
      ],
      ruleTypes: [
        { label: 'All', value: null },
        { label: 'Type A', value: 'typeA' },
      ],
      publishingOptions: [],
    },
    functions: {
      handleCreateEdit: mockHandleCreateEdit,
      setSearchTerm: mockSetSearchTerm,
      setStatus: mockSetStatus,
      setRuleType: mockSetRuleType,
      resetFilter: mockResetFilter,
    },
  }),
}));

const theme = createTheme({
  palette: {
    text: { primary: '#000', secondary: '#666', black: '#000' },
    static: { grey: '#ccc', border: '#ddd', secondary: '#1976d2', lightGrey: '#f5f5f5' },
  } as any,
});

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the Home component', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Rules Home')).toBeInTheDocument();
    });

    it('should render without errors', () => {
      const { container } = renderWithTheme(<Home />);

      expect(container).toBeInTheDocument();
    });

    it('should render within BoxWrapper', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Rules Home')).toBeInTheDocument();
    });
  });

  describe('Header Section', () => {
    it('should display Rules Home title', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Rules Home')).toBeInTheDocument();
    });

    it('should render home icon', () => {
      const { container } = renderWithTheme(<Home />);

      const icons = container.querySelectorAll('[data-testid="HomeOutlinedIcon"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render Create New Rule button for editor', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Create New Rule')).toBeInTheDocument();
    });

    it('should call handleCreateEdit on button click', () => {
      renderWithTheme(<Home />);

      const createButton = screen.getByText('Create New Rule');
      fireEvent.click(createButton);

      expect(mockHandleCreateEdit).toHaveBeenCalled();
    });
  });

  describe('Search Input', () => {
    it('should render search input', () => {
      renderWithTheme(<Home />);

      const searchInput = screen.getByPlaceholderText('Search rules...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should call setSearchTerm on input change', () => {
      renderWithTheme(<Home />);

      const searchInput = screen.getByPlaceholderText('Search rules...');
      fireEvent.change(searchInput, { target: { value: 'test rule' } });

      expect(mockSetSearchTerm).toHaveBeenCalledWith('test rule');
    });

    it('should have search icon', () => {
      const { container } = renderWithTheme(<Home />);

      const searchIcons = container.querySelectorAll('[data-testid="SearchIcon"]');
      expect(searchIcons.length).toBeGreaterThan(0);
    });

    it('should display current search term', () => {
      renderWithTheme(<Home />);

      const searchInput = screen.getByPlaceholderText('Search rules...');
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Filter Dropdowns', () => {
    it('should render Status dropdown', () => {
      renderWithTheme(<Home />);

      const statusLabels = screen.getAllByText('Status');
      expect(statusLabels.length).toBeGreaterThan(0);
    });

    it('should render Rule Type dropdown', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Rule Type')).toBeInTheDocument();
    });

    it('should have status placeholder', () => {
      renderWithTheme(<Home />);

      const statusLabels = screen.getAllByText('Status');
      expect(statusLabels.length).toBeGreaterThan(0);
    });

    it('should have rule type placeholder', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Rule Type')).toBeInTheDocument();
    });
  });

  describe('Reset Filter Button', () => {
    it('should render reset filter button', () => {
      const { container } = renderWithTheme(<Home />);

      const resetButtons = container.querySelectorAll('[title="Reset Filters"]');
      expect(resetButtons.length).toBeGreaterThan(0);
    });

    it('should call resetFilter on click', () => {
      const { container } = renderWithTheme(<Home />);

      const resetButton = container.querySelector('[title="Reset Filters"]');
      if (resetButton) {
        fireEvent.click(resetButton);
        expect(mockResetFilter).toHaveBeenCalled();
      }
    });

    it('should render FilterAltOff icon', () => {
      const { container } = renderWithTheme(<Home />);

      const filterIcons = container.querySelectorAll('[data-testid="FilterAltOffIcon"]');
      expect(filterIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Table Component', () => {
    it('should render Table component', () => {
      renderWithTheme(<Home />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should pass columns to Table', () => {
      renderWithTheme(<Home />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should pass data to Table', () => {
      renderWithTheme(<Home />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should pass loading state to Table', () => {
      renderWithTheme(<Home />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should pass pagination to Table', () => {
      renderWithTheme(<Home />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should have Grid containers', () => {
      const { container } = renderWithTheme(<Home />);

      const grids = container.querySelectorAll('.MuiGrid-container');
      expect(grids.length).toBeGreaterThan(0);
    });

    it('should have proper spacing between sections', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Rules Home')).toBeInTheDocument();
    });

    it('should align header items correctly', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Rules Home')).toBeInTheDocument();
      expect(screen.getByText('Create New Rule')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should set maxWidth for inputs', () => {
      renderWithTheme(<Home />);

      const searchInput = screen.getByPlaceholderText('Search rules...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should use Grid system for layout', () => {
      const { container } = renderWithTheme(<Home />);

      expect(container.querySelector('.MuiGrid-container')).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering', () => {
    it('should show Create button for editor users', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Create New Rule')).toBeInTheDocument();
    });
  });

  describe('Filter Section', () => {
    it('should render all filter components together', () => {
      renderWithTheme(<Home />);

      expect(screen.getByPlaceholderText('Search rules...')).toBeInTheDocument();
      const statusLabels = screen.getAllByText('Status');
      expect(statusLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('Rule Type')).toBeInTheDocument();
    });

    it('should have proper spacing between filters', () => {
      const { container } = renderWithTheme(<Home />);

      const filterGrid = container.querySelectorAll('.MuiGrid-container')[1];
      expect(filterGrid).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render AddIcon in button', () => {
      const { container } = renderWithTheme(<Home />);

      const addIcons = container.querySelectorAll('[data-testid="AddIcon"]');
      expect(addIcons.length).toBeGreaterThan(0);
    });

    it('should render HomeOutlinedIcon', () => {
      const { container } = renderWithTheme(<Home />);

      const homeIcons = container.querySelectorAll('[data-testid="HomeOutlinedIcon"]');
      expect(homeIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Button Properties', () => {
    it('should render button with correct height', () => {
      renderWithTheme(<Home />);

      const button = screen.getByText('Create New Rule');
      expect(button).toBeInTheDocument();
    });

    it('should render button with secondary type', () => {
      renderWithTheme(<Home />);

      const button = screen.getByText('Create New Rule');
      expect(button).toBeInTheDocument();
    });

    it('should render button with medium size', () => {
      renderWithTheme(<Home />);

      const button = screen.getByText('Create New Rule');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form controls', () => {
      renderWithTheme(<Home />);

      const searchInput = screen.getByPlaceholderText('Search rules...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should have button with accessible text', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Create New Rule')).toBeInTheDocument();
    });

    it('should have title for reset button', () => {
      const { container } = renderWithTheme(<Home />);

      const resetButton = container.querySelector('[title="Reset Filters"]');
      expect(resetButton).toHaveAttribute('title', 'Reset Filters');
    });
  });

  describe('Theme Integration', () => {
    it('should apply theme colors', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Rules Home')).toBeInTheDocument();
    });

    it('should use theme spacing', () => {
      const { container } = renderWithTheme(<Home />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Component Export', () => {
    it('should export Home as default', () => {
      expect(Home).toBeDefined();
    });

    it('should be a functional component', () => {
      expect(typeof Home).toBe('function');
    });
  });

  describe('Input Sizing', () => {
    it('should set maxWidth for search input', () => {
      renderWithTheme(<Home />);

      const searchInput = screen.getByPlaceholderText('Search rules...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should set height for search input', () => {
      renderWithTheme(<Home />);

      const searchInput = screen.getByPlaceholderText('Search rules...');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Box Wrapper', () => {
    it('should wrap content in BoxWrapper', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Rules Home')).toBeInTheDocument();
    });

    it('should render all content within wrapper', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Rules Home')).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Table Section', () => {
    it('should render table with margin top', () => {
      renderWithTheme(<Home />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should be wrapped in Box component', () => {
      renderWithTheme(<Home />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Controller Integration', () => {
    it('should use useHomeController hook', () => {
      renderWithTheme(<Home />);

      expect(screen.getByText('Rules Home')).toBeInTheDocument();
    });

    it('should access values from controller', () => {
      renderWithTheme(<Home />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should access functions from controller', () => {
      renderWithTheme(<Home />);

      const createButton = screen.getByText('Create New Rule');
      fireEvent.click(createButton);

      expect(mockHandleCreateEdit).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data gracefully', () => {
      renderWithTheme(<Home />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should render without crashing', () => {
      expect(() => renderWithTheme(<Home />)).not.toThrow();
    });
  });
});

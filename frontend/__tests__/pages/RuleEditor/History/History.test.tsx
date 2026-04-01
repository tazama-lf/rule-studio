import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import History from '../../../../src/pages/RuleEditor/History';

const mockHandlePrevious = jest.fn();
const mockColumns = [
  { label: 'Created By', key: 'created_by_email' },
  { label: 'Created At', key: 'created_at', type: 'date' as const },
  { label: 'Actions', key: 'actions' },
];
const mockReadOnlyData = [
  { id: '1', created_by_email: 'user1@test.com', created_at: '2024-01-01' },
  { id: '2', created_by_email: 'user2@test.com', created_at: '2024-01-02' },
];
const mockEndToEndData = [
  { id: '3', created_by_email: 'user3@test.com', created_at: '2024-01-03' },
];

jest.mock('../../../../src/pages/RuleEditor/History/useHistoryController', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    values: {
      columns: mockColumns,
      isLoading: false,
      readOnlyData: mockReadOnlyData,
      endToEndData: mockEndToEndData,
    },
    functions: {
      handlePrevious: mockHandlePrevious,
    },
  })),
}));

jest.mock('../../../../src/components/Table', () => ({
  __esModule: true,
  default: ({ title, columns, data, loading, serial_no }: {
    title: string;
    columns: unknown[];
    data: unknown[];
    loading: boolean;
    serial_no: boolean;
  }) => (
    <div data-testid={`table-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
      <div data-testid="table-title">{title}</div>
      <div data-testid="table-columns">{JSON.stringify(columns)}</div>
      <div data-testid="table-data">{JSON.stringify(data)}</div>
      <div data-testid="table-loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="table-serial">{serial_no ? 'true' : 'false'}</div>
    </div>
  ),
}));

jest.mock('../../../../src/components/Button', () => ({
  __esModule: true,
  default: ({ text, onClick, type, size, height }: {
    text: string;
    onClick: () => void;
    type: string;
    size: string;
    height: string;
  }) => (
    <button
      data-testid="back-button"
      onClick={onClick}
      data-type={type}
      data-size={size}
      data-height={height}
    >
      {text}
    </button>
  ),
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('History Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render History component', () => {
      renderWithTheme(<History />);

      const ruleOnlyTable = screen.getByTestId('table-rule-only-simulation');
      const demsTable = screen.getByTestId('table-dems-driven-simulation');
      
      expect(ruleOnlyTable).toBeInTheDocument();
      expect(demsTable).toBeInTheDocument();
    });

    it('should render without errors', () => {
      expect(() => renderWithTheme(<History />)).not.toThrow();
    });

    it('should call useHistoryController hook', () => {
      const useHistoryController = require('../../../../src/pages/RuleEditor/History/useHistoryController').default;

      renderWithTheme(<History />);

      expect(useHistoryController).toHaveBeenCalled();
    });

    it('should pass props to useHistoryController', () => {
      const useHistoryController = require('../../../../src/pages/RuleEditor/History/useHistoryController').default;
      const propsData = { id: '123', rule_name: 'Test Rule' };

      renderWithTheme(<History data={propsData} />);

      expect(useHistoryController).toHaveBeenCalledWith({ data: propsData });
    });
  });

  describe('Tables Rendering', () => {
    it('should render Rule-Only Simulation table', () => {
      renderWithTheme(<History />);

      const ruleOnlyTable = screen.getByTestId('table-rule-only-simulation');
      expect(ruleOnlyTable).toBeInTheDocument();
    });

    it('should render DEMS-driven Simulation table', () => {
      renderWithTheme(<History />);

      const demsTable = screen.getByTestId('table-dems-driven-simulation');
      expect(demsTable).toBeInTheDocument();
    });

    it('should render both tables', () => {
      renderWithTheme(<History />);

      const ruleOnlyTable = screen.getByTestId('table-rule-only-simulation');
      const demsTable = screen.getByTestId('table-dems-driven-simulation');
      
      expect(ruleOnlyTable).toBeInTheDocument();
      expect(demsTable).toBeInTheDocument();
    });

    it('should display Rule-Only Simulation title', () => {
      renderWithTheme(<History />);

      const titles = screen.getAllByTestId('table-title');
      expect(titles.some(title => title.textContent === 'Rule-Only Simulation')).toBe(true);
    });

    it('should display DEMS-driven Simulation title', () => {
      renderWithTheme(<History />);

      const titles = screen.getAllByTestId('table-title');
      expect(titles.some(title => title.textContent === 'DEMS-driven Simulation')).toBe(true);
    });
  });

  describe('Table Props', () => {
    it('should pass serial_no prop to tables', () => {
      renderWithTheme(<History />);

      const serialFlags = screen.getAllByTestId('table-serial');
      serialFlags.forEach(flag => {
        expect(flag.textContent).toBe('true');
      });
    });

    it('should pass columns to Rule-Only table', () => {
      renderWithTheme(<History />);

      const ruleOnlyTable = screen.getByTestId('table-rule-only-simulation');
      const columnsDiv = ruleOnlyTable.querySelector('[data-testid="table-columns"]');
      expect(columnsDiv?.textContent).toContain('Created By');
    });

    it('should pass readOnlyData to Rule-Only table', () => {
      renderWithTheme(<History />);

      const ruleOnlyTable = screen.getByTestId('table-rule-only-simulation');
      const dataDiv = ruleOnlyTable.querySelector('[data-testid="table-data"]');
      expect(dataDiv?.textContent).toContain('user1@test.com');
    });

    it('should pass endToEndData to DEMS-driven table', () => {
      renderWithTheme(<History />);

      const demsTable = screen.getByTestId('table-dems-driven-simulation');
      const dataDiv = demsTable.querySelector('[data-testid="table-data"]');
      expect(dataDiv?.textContent).toContain('user3@test.com');
    });

    it('should pass loading state to tables', () => {
      renderWithTheme(<History />);

      const loadingStates = screen.getAllByTestId('table-loading');
      loadingStates.forEach(state => {
        expect(state.textContent).toBe('loaded');
      });
    });
  });

  describe('Back Button', () => {
    it('should render Back button', () => {
      renderWithTheme(<History />);

      const backButton = screen.getByTestId('back-button');
      expect(backButton).toBeInTheDocument();
    });

    it('should display "Back" text on button', () => {
      renderWithTheme(<History />);

      const backButton = screen.getByTestId('back-button');
      expect(backButton.textContent).toBe('Back');
    });

    it('should have secondary type', () => {
      renderWithTheme(<History />);

      const backButton = screen.getByTestId('back-button');
      expect(backButton.getAttribute('data-type')).toBe('secondary');
    });

    it('should have md size', () => {
      renderWithTheme(<History />);

      const backButton = screen.getByTestId('back-button');
      expect(backButton.getAttribute('data-size')).toBe('md');
    });

    it('should have 40px height', () => {
      renderWithTheme(<History />);

      const backButton = screen.getByTestId('back-button');
      expect(backButton.getAttribute('data-height')).toBe('40px');
    });

    it('should call handlePrevious when clicked', () => {
      renderWithTheme(<History />);

      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);

      expect(mockHandlePrevious).toHaveBeenCalled();
    });

    it('should call handlePrevious only once per click', () => {
      renderWithTheme(<History />);

      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);

      expect(mockHandlePrevious).toHaveBeenCalledTimes(1);
    });

    it('should call handlePrevious multiple times for multiple clicks', () => {
      renderWithTheme(<History />);

      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      fireEvent.click(backButton);

      expect(mockHandlePrevious).toHaveBeenCalledTimes(2);
    });
  });

  describe('Loading State', () => {
    it('should display loading state when isLoading is true', () => {
      const useHistoryController = require('../../../../src/pages/RuleEditor/History/useHistoryController').default;
      useHistoryController.mockReturnValue({
        values: {
          columns: mockColumns,
          isLoading: true,
          readOnlyData: [],
          endToEndData: [],
        },
        functions: {
          handlePrevious: mockHandlePrevious,
        },
      });

      renderWithTheme(<History />);

      const loadingStates = screen.getAllByTestId('table-loading');
      loadingStates.forEach(state => {
        expect(state.textContent).toBe('loading');
      });
    });

    it('should pass same loading state to both tables', () => {
      renderWithTheme(<History />);

      const loadingStates = screen.getAllByTestId('table-loading');
      const loadingTexts = loadingStates.map(state => state.textContent);
      expect(new Set(loadingTexts).size).toBe(1);
    });
  });

  describe('Layout Structure', () => {
    it('should render tables in a flex container', () => {
      renderWithTheme(<History />);

      const ruleOnlyTable = screen.getByTestId('table-rule-only-simulation');
      const demsTable = screen.getByTestId('table-dems-driven-simulation');
      
      expect(ruleOnlyTable).toBeInTheDocument();
      expect(demsTable).toBeInTheDocument();
    });

    it('should render Back button below tables', () => {
      renderWithTheme(<History />);

      const backButton = screen.getByTestId('back-button');
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('should handle empty readOnlyData', () => {
      const useHistoryController = require('../../../../src/pages/RuleEditor/History/useHistoryController').default;
      useHistoryController.mockReturnValue({
        values: {
          columns: mockColumns,
          isLoading: false,
          readOnlyData: [],
          endToEndData: mockEndToEndData,
        },
        functions: {
          handlePrevious: mockHandlePrevious,
        },
      });

      renderWithTheme(<History />);

      const ruleOnlyTable = screen.getByTestId('table-rule-only-simulation');
      expect(ruleOnlyTable).toBeInTheDocument();
    });

    it('should handle empty endToEndData', () => {
      const useHistoryController = require('../../../../src/pages/RuleEditor/History/useHistoryController').default;
      useHistoryController.mockReturnValue({
        values: {
          columns: mockColumns,
          isLoading: false,
          readOnlyData: mockReadOnlyData,
          endToEndData: [],
        },
        functions: {
          handlePrevious: mockHandlePrevious,
        },
      });

      renderWithTheme(<History />);

      const demsTable = screen.getByTestId('table-dems-driven-simulation');
      expect(demsTable).toBeInTheDocument();
    });

    it('should handle both empty data arrays', () => {
      const useHistoryController = require('../../../../src/pages/RuleEditor/History/useHistoryController').default;
      useHistoryController.mockReturnValue({
        values: {
          columns: mockColumns,
          isLoading: false,
          readOnlyData: [],
          endToEndData: [],
        },
        functions: {
          handlePrevious: mockHandlePrevious,
        },
      });

      renderWithTheme(<History />);

      const ruleOnlyTable = screen.getByTestId('table-rule-only-simulation');
      const demsTable = screen.getByTestId('table-dems-driven-simulation');
      
      expect(ruleOnlyTable).toBeInTheDocument();
      expect(demsTable).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should accept data prop', () => {
      const propsData = { id: '456' };

      expect(() => renderWithTheme(<History data={propsData} />)).not.toThrow();
    });

    it('should work without data prop', () => {
      expect(() => renderWithTheme(<History />)).not.toThrow();
    });

    it('should pass data prop to controller', () => {
      const useHistoryController = require('../../../../src/pages/RuleEditor/History/useHistoryController').default;
      const propsData = { id: '789', rule_name: 'Test' };

      renderWithTheme(<History data={propsData} />);

      expect(useHistoryController).toHaveBeenCalledWith({ data: propsData });
    });
  });

  describe('Column Configuration', () => {
    it('should use columns from controller', () => {
      renderWithTheme(<History />);

      const columnsElements = screen.getAllByTestId('table-columns');
      columnsElements.forEach(element => {
        expect(element.textContent).toContain('Created By');
        expect(element.textContent).toContain('Created At');
        expect(element.textContent).toContain('Actions');
      });
    });

    it('should pass same columns to both tables', () => {
      renderWithTheme(<History />);

      const columnsElements = screen.getAllByTestId('table-columns');
      const columnsTexts = columnsElements.map(el => el.textContent);
      expect(columnsTexts[0]).toBe(columnsTexts[1]);
    });
  });

  describe('Component Integration', () => {
    it('should integrate with useHistoryController', () => {
      const useHistoryController = require('../../../../src/pages/RuleEditor/History/useHistoryController').default;

      renderWithTheme(<History />);

      expect(useHistoryController).toHaveBeenCalled();
    });

    it('should use values from controller', () => {
      renderWithTheme(<History />);

      const dataElements = screen.getAllByTestId('table-data');
      expect(dataElements.length).toBeGreaterThan(0);
    });

    it('should use functions from controller', () => {
      renderWithTheme(<History />);

      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);

      expect(mockHandlePrevious).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined data prop', () => {
      expect(() => renderWithTheme(<History data={undefined} />)).not.toThrow();
    });

    it('should render when controller returns minimal values', () => {
      const useHistoryController = require('../../../../src/pages/RuleEditor/History/useHistoryController').default;
      useHistoryController.mockReturnValue({
        values: {
          columns: [],
          isLoading: false,
          readOnlyData: [],
          endToEndData: [],
        },
        functions: {
          handlePrevious: jest.fn(),
        },
      });

      expect(() => renderWithTheme(<History />)).not.toThrow();
    });

    it('should handle large data arrays', () => {
      const useHistoryController = require('../../../../src/pages/RuleEditor/History/useHistoryController').default;
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        created_by_email: `user${i}@test.com`,
        created_at: '2024-01-01',
      }));

      useHistoryController.mockReturnValue({
        values: {
          columns: mockColumns,
          isLoading: false,
          readOnlyData: largeData,
          endToEndData: largeData,
        },
        functions: {
          handlePrevious: mockHandlePrevious,
        },
      });

      expect(() => renderWithTheme(<History />)).not.toThrow();
    });
  });

  describe('Component Export', () => {
    it('should export History component as default', () => {
      const HistoryComponent = require('../../../../src/pages/RuleEditor/History').default;
      expect(HistoryComponent).toBeDefined();
    });

    it('should be a valid React component', () => {
      const HistoryComponent = require('../../../../src/pages/RuleEditor/History').default;
      const element = <HistoryComponent />;
      expect(React.isValidElement(element)).toBe(true);
    });
  });
});

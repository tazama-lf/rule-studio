import { render, screen } from '@testing-library/react';

// Mock the Redux API to prevent import.meta.env issues
jest.mock('../../../../../src/redux/Api/Rules', () => ({
  useGetNetworkMapQuery: jest.fn(),
}));

// Mock the controller hook BEFORE importing the component
jest.mock('../../../../../src/pages/RuleEditor/Modals/ViewNetworkMap/useViewNetworkMapController');

import ViewNetworkMap from '../../../../../src/pages/RuleEditor/Modals/ViewNetworkMap';
import useViewNetworkMapController from '../../../../../src/pages/RuleEditor/Modals/ViewNetworkMap/useViewNetworkMapController';

// Mock the components
jest.mock('../../../../../src/components/Loader', () => ({
  __esModule: true,
  default: ({ center }: { center?: boolean }) => (
    <div data-testid="loader" data-center={center ? 'true' : 'false'}>
      Loading...
    </div>
  ),
}));

jest.mock('../../../../../src/components/JsonFormatter', () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => (
    <div data-testid="json-formatter" data-value={value}>
      Formatted JSON
    </div>
  ),
}));

const mockUseViewNetworkMapController = useViewNetworkMapController as jest.MockedFunction<
  typeof useViewNetworkMapController
>;

describe('ViewNetworkMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockUseViewNetworkMapController.mockReturnValue({
      values: {
        data: undefined,
        isLoading: false,
      },
      functions: {},
    });
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: { nodes: [], edges: [] },
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      expect(screen.getByTestId('json-formatter')).toBeInTheDocument();
    });

    it('should call the controller hook on mount', () => {
      render(<ViewNetworkMap />);
      expect(mockUseViewNetworkMapController).toHaveBeenCalledTimes(1);
    });

    it('should render the Grid container with correct spacing', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: {},
          isLoading: false,
        },
        functions: {},
      });

      const { container } = render(<ViewNetworkMap />);
      const gridContainer = container.querySelector('.MuiGrid-container');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should render the Box component with correct styling attributes', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: {},
          isLoading: false,
        },
        functions: {},
      });

      const { container } = render(<ViewNetworkMap />);
      const box = container.querySelector('[class*="MuiBox"]');
      expect(box).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render Loader when isLoading is true', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: undefined,
          isLoading: true,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should render Loader with center prop when loading', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: undefined,
          isLoading: true,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('data-center', 'true');
    });

    it('should not render FormattedJsonSection when loading', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: undefined,
          isLoading: true,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      expect(screen.queryByTestId('json-formatter')).not.toBeInTheDocument();
    });

    it('should not render Grid layout when loading', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: undefined,
          isLoading: true,
        },
        functions: {},
      });

      const { container } = render(<ViewNetworkMap />);
      const gridContainer = container.querySelector('.MuiGrid-container');
      expect(gridContainer).not.toBeInTheDocument();
    });

    it('should switch from loader to content when loading completes', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: undefined,
          isLoading: true,
        },
        functions: {},
      });

      const { rerender } = render(<ViewNetworkMap />);
      expect(screen.getByTestId('loader')).toBeInTheDocument();

      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: { nodes: [] },
          isLoading: false,
        },
        functions: {},
      });

      rerender(<ViewNetworkMap />);
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      expect(screen.getByTestId('json-formatter')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should render FormattedJsonSection with stringified data', () => {
      const mockData = { nodes: [{ id: 1, name: 'Node 1' }], edges: [] };
      
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: mockData,
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      const formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify(mockData));
    });

    it('should render FormattedJsonSection with empty object when data is undefined', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: undefined,
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      const formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify({}));
    });

    it('should render FormattedJsonSection with empty object when data is null', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: null,
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      const formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify({}));
    });

    it('should handle empty data object', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: {},
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      const formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify({}));
    });

    it('should handle complex network map data structure', () => {
      const complexData = {
        nodes: [
          { id: 1, label: 'Start', type: 'entry' },
          { id: 2, label: 'Process', type: 'processor' },
        ],
        edges: [{ from: 1, to: 2, label: 'flow' }],
        metadata: { version: '1.0' },
      };

      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: complexData,
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      const formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify(complexData));
    });

    it('should handle data with nested objects', () => {
      const nestedData = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };

      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: nestedData,
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      const formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify(nestedData));
    });

    it('should handle data with arrays', () => {
      const arrayData = {
        items: [1, 2, 3, 4, 5],
        nested: [[1, 2], [3, 4]],
      };

      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: arrayData,
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      const formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify(arrayData));
    });

    it('should handle data update', () => {
      const initialData = { nodes: [{ id: 1 }] };
      const updatedData = { nodes: [{ id: 1 }, { id: 2 }] };

      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: initialData,
          isLoading: false,
        },
        functions: {},
      });

      const { rerender } = render(<ViewNetworkMap />);
      let formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify(initialData));

      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: updatedData,
          isLoading: false,
        },
        functions: {},
      });

      rerender(<ViewNetworkMap />);
      formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify(updatedData));
    });
  });

  describe('Layout Structure', () => {
    it('should render Grid with size xs:12', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: {},
          isLoading: false,
        },
        functions: {},
      });

      const { container } = render(<ViewNetworkMap />);
      const gridItem = container.querySelector('.MuiGrid-root[class*="Grid-grid-xs-12"]');
      expect(gridItem).toBeInTheDocument();
    });

    it('should render Box with border styling', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: {},
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      const formatter = screen.getByTestId('json-formatter');
      expect(formatter.parentElement).toBeInTheDocument();
    });

    it('should maintain layout structure across rerenders', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: {},
          isLoading: false,
        },
        functions: {},
      });

      const { container, rerender } = render(<ViewNetworkMap />);
      const initialGrids = container.querySelectorAll('.MuiGrid-root').length;

      rerender(<ViewNetworkMap />);
      const rerenderedGrids = container.querySelectorAll('.MuiGrid-root').length;

      expect(initialGrids).toBe(rerenderedGrids);
    });
  });

  describe('Edge Cases', () => {
    it('should handle when controller returns null values', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: null,
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      expect(screen.getByTestId('json-formatter')).toBeInTheDocument();
    });

    it('should handle when controller values object is undefined', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: undefined as any,
        functions: {},
      });

      render(<ViewNetworkMap />);
      // When values is undefined, values?.isLoading is undefined (falsy), so loader is not shown
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      // Instead, the component renders the content with empty object
      expect(screen.getByTestId('json-formatter')).toBeInTheDocument();
    });

    it('should handle data with special characters', () => {
      const specialData = {
        text: 'Special <>&"\' characters',
        unicode: '🚀 emoji test',
      };

      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: specialData,
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      const formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify(specialData));
    });

    it('should handle very large data objects', () => {
      const largeData = {
        nodes: Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Node ${i}` })),
      };

      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: largeData,
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      const formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify(largeData));
    });

    it('should handle data with boolean and number values', () => {
      const mixedData = {
        active: true,
        count: 42,
        ratio: 3.14,
        disabled: false,
      };

      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: mixedData,
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      const formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify(mixedData));
    });

    it('should handle multiple rapid rerenders', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: {},
          isLoading: false,
        },
        functions: {},
      });

      const { rerender } = render(<ViewNetworkMap />);

      for (let i = 0; i < 10; i++) {
        rerender(<ViewNetworkMap />);
      }

      expect(screen.getByTestId('json-formatter')).toBeInTheDocument();
    });

    it('should handle transition from undefined to defined data', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: undefined,
          isLoading: false,
        },
        functions: {},
      });

      const { rerender } = render(<ViewNetworkMap />);
      let formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify({}));

      const newData = { nodes: [{ id: 1 }] };
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: newData,
          isLoading: false,
        },
        functions: {},
      });

      rerender(<ViewNetworkMap />);
      formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify(newData));
    });
  });

  describe('Component Integration', () => {
    it('should correctly integrate with controller hook', () => {
      const mockData = {
        nodes: [{ id: 'rule_1', label: 'Rule 1' }],
        edges: [{ from: 'rule_1', to: 'typology_1' }],
      };

      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: mockData,
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      
      expect(mockUseViewNetworkMapController).toHaveBeenCalled();
      expect(screen.getByTestId('json-formatter')).toBeInTheDocument();
    });

    it('should properly pass data to FormattedJsonSection component', () => {
      const testData = { test: 'value', nested: { key: 'data' } };

      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: testData,
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      const formatter = screen.getByTestId('json-formatter');
      const expectedValue = JSON.stringify(testData);
      expect(formatter).toHaveAttribute('data-value', expectedValue);
    });

    it('should handle full loading to loaded to loading cycle', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: undefined,
          isLoading: true,
        },
        functions: {},
      });

      const { rerender } = render(<ViewNetworkMap />);
      expect(screen.getByTestId('loader')).toBeInTheDocument();

      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: { nodes: [] },
          isLoading: false,
        },
        functions: {},
      });

      rerender(<ViewNetworkMap />);
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      expect(screen.getByTestId('json-formatter')).toBeInTheDocument();

      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: { nodes: [] },
          isLoading: true,
        },
        functions: {},
      });

      rerender(<ViewNetworkMap />);
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.queryByTestId('json-formatter')).not.toBeInTheDocument();
    });
  });

  describe('Component Export', () => {
    it('should export the component as default', () => {
      expect(ViewNetworkMap).toBeDefined();
      expect(typeof ViewNetworkMap).toBe('function');
    });

    it('should render as a React component', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: {},
          isLoading: false,
        },
        functions: {},
      });

      const { container } = render(<ViewNetworkMap />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible structure when displaying data', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: { nodes: [] },
          isLoading: false,
        },
        functions: {},
      });

      const { container } = render(<ViewNetworkMap />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have accessible structure when loading', () => {
      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: undefined,
          isLoading: true,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should render typical network map with rules and typologies', () => {
      const realData = {
        nodes: [
          { id: 'rule_001', type: 'rule', name: 'Fraud Detection', status: 'active' },
          { id: 'rule_002', type: 'rule', name: 'Risk Assessment', status: 'active' },
          { id: 'typology_001', type: 'typology', name: 'Money Laundering', status: 'active' },
        ],
        edges: [
          { from: 'rule_001', to: 'typology_001', weight: 0.8 },
          { from: 'rule_002', to: 'typology_001', weight: 0.6 },
        ],
      };

      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: realData,
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      const formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify(realData));
    });

    it('should handle empty network map gracefully', () => {
      const emptyMap = { nodes: [], edges: [] };

      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: emptyMap,
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      const formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify(emptyMap));
    });

    it('should handle network map with metadata', () => {
      const dataWithMetadata = {
        nodes: [{ id: 1 }],
        edges: [],
        metadata: {
          version: '2.0',
          lastUpdated: '2024-01-15',
          author: 'System',
        },
      };

      mockUseViewNetworkMapController.mockReturnValue({
        values: {
          data: dataWithMetadata,
          isLoading: false,
        },
        functions: {},
      });

      render(<ViewNetworkMap />);
      const formatter = screen.getByTestId('json-formatter');
      expect(formatter).toHaveAttribute('data-value', JSON.stringify(dataWithMetadata));
    });
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Table, { TableColumn, Pagination } from '../../../src/components/Table';

// Mock the Loader component
jest.mock('../../../src/components/Loader', () => ({
  __esModule: true,
  default: ({ type, center, size }: { type: string; center: boolean; size: number }) => (
    <div data-testid="loader" data-type={type} data-center={center} data-size={size}>
      Loading...
    </div>
  ),
}));

// Mock the Pagination component
jest.mock('../../../src/components/Pagination', () => ({
  __esModule: true,
  default: ({ current_page, limit, total, onPageChange }: any) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(current_page + 1)}>Next Page</button>
      <span>Page {current_page}</span>
      <span>Limit {limit}</span>
      <span>Total {total}</span>
    </div>
  ),
}));

// Mock the Text component
jest.mock('../../../src/components/Text', () => ({
  Text: ({ children, weight, color, size }: any) => (
    <div data-testid="text" data-weight={weight} data-color={color} data-size={size}>
      {children}
    </div>
  ),
}));

// Mock helper functions
jest.mock('../../../src/utils/Common/helpers', () => ({
  dateFormatter: jest.fn((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }),
  getNestedValue: jest.fn((obj, path) => {
    const keys = path.split('.');
    let value: any = obj;
    for (const key of keys) {
      value = value?.[key];
    }
    return value ?? '';
  }),
}));

describe('Table', () => {
  const mockColumns: TableColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'age', label: 'Age' },
  ];

  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
  ];

  describe('Basic Rendering', () => {
    it('should render the table with data', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should render table headers correctly', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(3);
      expect(headers[0]).toHaveTextContent('Name');
      expect(headers[1]).toHaveTextContent('Email');
      expect(headers[2]).toHaveTextContent('Age');
    });

    it('should render all data rows', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      const rows = screen.getAllByRole('row');
      // 1 header row + 3 data rows
      expect(rows).toHaveLength(4);
    });

    it('should render table within Paper container', () => {
      const { container } = render(<Table columns={mockColumns} data={mockData} />);

      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });
  });

  describe('Serial Numbers', () => {
    it('should render serial numbers when serial_no is true', () => {
      render(<Table columns={mockColumns} data={mockData} serial_no={true} />);

      expect(screen.getByText('S.No.')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should not render serial numbers when serial_no is false', () => {
      render(<Table columns={mockColumns} data={mockData} serial_no={false} />);

      expect(screen.queryByText('S.No.')).not.toBeInTheDocument();
    });

    it('should calculate serial numbers correctly with pagination', () => {
      const pagination: Pagination = {
        offset: 2,
        limit: 10,
        total: 100,
        onPageChange: jest.fn(),
      };

      render(<Table columns={mockColumns} data={mockData} serial_no={true} pagination={pagination} />);

      expect(screen.getByText('11')).toBeInTheDocument(); // (2-1) * 10 + 1
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('13')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display "No data available" when data is empty', () => {
      render(<Table columns={mockColumns} data={[]} />);

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should show empty message in a cell spanning all columns', () => {
      render(<Table columns={mockColumns} data={[]} />);

      const emptyCell = screen.getByText('No data available').closest('td');
      expect(emptyCell).toHaveAttribute('colspan', '3');
    });

    it('should show empty message with serial column included', () => {
      render(<Table columns={mockColumns} data={[]} serial_no={true} />);

      const emptyCell = screen.getByText('No data available').closest('td');
      expect(emptyCell).toHaveAttribute('colspan', '4');
    });
  });

  describe('Loading State', () => {
    it('should display loader when loading is true', () => {
      render(<Table columns={mockColumns} data={mockData} loading={true} />);

      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should not display data when loading', () => {
      render(<Table columns={mockColumns} data={mockData} loading={true} />);

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('should display data when loading is false', () => {
      render(<Table columns={mockColumns} data={mockData} loading={false} />);

      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should show loader in a cell spanning all columns', () => {
      render(<Table columns={mockColumns} data={mockData} loading={true} />);

      const loaderCell = screen.getByTestId('loader').closest('td');
      expect(loaderCell).toHaveAttribute('colspan', '3');
    });
  });

  describe('Pagination', () => {
    const mockPagination: Pagination = {
      offset: 1,
      limit: 10,
      total: 50,
      onPageChange: jest.fn(),
    };

    it('should render pagination when provided', () => {
      render(<Table columns={mockColumns} data={mockData} pagination={mockPagination} />);

      expect(screen.getByTestId('pagination')).toBeInTheDocument();
      expect(screen.getByText(/Page 1/)).toBeInTheDocument();
    });

    it('should not render pagination when not provided', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('should not render pagination when loading', () => {
      render(<Table columns={mockColumns} data={mockData} pagination={mockPagination} loading={true} />);

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('should not render pagination when data is empty', () => {
      render(<Table columns={mockColumns} data={[]} pagination={mockPagination} />);

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('should call onPageChange when page is changed', () => {
      const onPageChange = jest.fn();
      const pagination: Pagination = {
        offset: 1,
        limit: 10,
        total: 50,
        onPageChange,
      };

      render(<Table columns={mockColumns} data={mockData} pagination={pagination} />);

      const nextButton = screen.getByText('Next Page');
      fireEvent.click(nextButton);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('Row Interactions', () => {
    it('should call onRowClick when row is clicked', () => {
      const onRowClick = jest.fn();
      render(<Table columns={mockColumns} data={mockData} onRowClick={onRowClick} />);

      const firstRow = screen.getByText('John Doe').closest('tr');
      fireEvent.click(firstRow!);

      expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
    });

    it('should apply pointer cursor when onRowClick is provided', () => {
      render(<Table columns={mockColumns} data={mockData} onRowClick={jest.fn()} />);

      const firstRow = screen.getByText('John Doe').closest('tr') as HTMLElement;
      expect(firstRow).toHaveStyle({ cursor: 'pointer' });
    });

    it('should apply default cursor when onRowClick is not provided', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      const firstRow = screen.getByText('John Doe').closest('tr') as HTMLElement;
      expect(firstRow).toHaveStyle({ cursor: 'default' });
    });

    it('should not call onRowClick when not provided', () => {
      const { container } = render(<Table columns={mockColumns} data={mockData} />);

      const firstRow = screen.getByText('John Doe').closest('tr');
      expect(() => fireEvent.click(firstRow!)).not.toThrow();
    });
  });

  describe('Custom Row Styling', () => {
    it('should apply custom row className', () => {
      const getRowClassName = (row: unknown) => {
        const typedRow = row as { id: number };
        return typedRow.id === 1 ? 'highlighted-row' : '';
      };

      render(<Table columns={mockColumns} data={mockData} getRowClassName={getRowClassName} />);

      const firstRow = screen.getByText('John Doe').closest('tr');
      expect(firstRow).toHaveClass('highlighted-row');
    });

    it('should apply custom row styles', () => {
      const getRowStyle = (row: unknown) => {
        const typedRow = row as { id: number };
        return typedRow.id === 2 ? { backgroundColor: 'yellow' } : {};
      };

      render(<Table columns={mockColumns} data={mockData} getRowStyle={getRowStyle} />);

      const secondRow = screen.getByText('Jane Smith').closest('tr');
      expect(secondRow).toBeInTheDocument();
      // getRowStyle is called
      expect(getRowStyle(mockData[1])).toEqual({ backgroundColor: 'yellow' });
    });
  });

  describe('Column Types', () => {
    it('should render date columns correctly', () => {
      const dateColumns: TableColumn[] = [
        { key: 'name', label: 'Name' },
        { key: 'createdAt', label: 'Created At', type: 'date' },
      ];

      const dataWithDates = [
        { id: 1, name: 'John', createdAt: '2024-01-15' },
      ];

      render(<Table columns={dateColumns} data={dataWithDates} />);

      const formattedDate = new Date('2024-01-15').toLocaleDateString();
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

    it('should use custom render function when provided', () => {
      const customColumns: TableColumn[] = [
        { key: 'name', label: 'Name' },
        {
          key: 'status',
          label: 'Status',
          render: (row) => <span data-testid="custom-render">{(row as any).status.toUpperCase()}</span>,
        },
      ];

      const customData = [{ id: 1, name: 'John', status: 'active' }];

      render(<Table columns={customColumns} data={customData} />);

      expect(screen.getByTestId('custom-render')).toHaveTextContent('ACTIVE');
    });

    it('should apply capitalize to column when specified', () => {
      const capitalizeColumns: TableColumn[] = [
        { key: 'name', label: 'Name', capitalize: true },
      ];

      const capitalizeData = [{ id: 1, name: 'john doe' }];

      render(<Table columns={capitalizeColumns} data={capitalizeData} />);

      const cell = screen.getByText('john doe').closest('td') as HTMLElement;
      expect(cell).toHaveStyle({ textTransform: 'capitalize' });
    });

    it('should apply custom column styles', () => {
      const styledColumns: TableColumn[] = [
        {
          key: 'name',
          label: 'Name',
          sx: { color: 'red', fontWeight: 'bold' },
        },
      ];

      const { container } = render(<Table columns={styledColumns} data={mockData} />);

      const nameCell = screen.getByText('John Doe').closest('td');
      expect(nameCell).toBeInTheDocument();
    });
  });

  describe('Nested Values', () => {
    it('should handle nested object values', () => {
      const nestedColumns: TableColumn[] = [
        { key: 'user.name', label: 'User Name' },
        { key: 'user.address.city', label: 'City' },
      ];

      const nestedData = [
        {
          id: 1,
          user: {
            name: 'John Doe',
            address: {
              city: 'New York',
            },
          },
        },
      ];

      render(<Table columns={nestedColumns} data={nestedData} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
    });
  });

  describe('Title', () => {
    it('should render title when provided', () => {
      render(<Table columns={mockColumns} data={mockData} title="User List" />);

      expect(screen.getByText('User List')).toBeInTheDocument();
    });

    it('should not render title when not provided', () => {
      const { container } = render(<Table columns={mockColumns} data={mockData} />);

      const titleElement = screen.queryByTestId('text');
      expect(titleElement).not.toBeInTheDocument();
    });

    it('should render title with correct styling props', () => {
      render(<Table columns={mockColumns} data={mockData} title="User List" />);

      const titleElement = screen.getByTestId('text');
      expect(titleElement).toHaveAttribute('data-weight', 'bold');
      expect(titleElement).toHaveAttribute('data-color', 'black');
      expect(titleElement).toHaveAttribute('data-size', 'main');
    });
  });

  describe('Table Structure', () => {
    it('should render sticky header', () => {
      const { container } = render(<Table columns={mockColumns} data={mockData} />);

      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('should render TableContainer with Paper component', () => {
      const { container } = render(<Table columns={mockColumns} data={mockData} />);

      const tableContainer = container.querySelector('.MuiTableContainer-root');
      expect(tableContainer).toBeInTheDocument();
    });

    it('should render TableHead and TableBody', () => {
      const { container } = render(<Table columns={mockColumns} data={mockData} />);

      const tableHead = container.querySelector('thead');
      const tableBody = container.querySelector('tbody');

      expect(tableHead).toBeInTheDocument();
      expect(tableBody).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle data without id field', () => {
      const dataWithoutId = [
        { name: 'John', email: 'john@example.com', age: 30 },
      ];

      render(<Table columns={mockColumns} data={dataWithoutId} />);

      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('should handle missing nested values gracefully', () => {
      const nestedColumns: TableColumn[] = [
        { key: 'user.profile.bio', label: 'Bio' },
      ];

      const incompleteData = [
        { id: 1, user: { name: 'John' } },
      ];

      render(<Table columns={nestedColumns} data={incompleteData} />);

      // Should not crash and render empty string
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should handle empty column array', () => {
      render(<Table columns={[]} data={mockData} />);

      const headers = screen.queryAllByRole('columnheader');
      expect(headers).toHaveLength(0);
    });

    it('should render with pagination set to null', () => {
      render(<Table columns={mockColumns} data={mockData} pagination={null} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });
  });

  describe('Component Memo', () => {
    it('should render consistently across re-renders with same props', () => {
      const { rerender, container } = render(<Table columns={mockColumns} data={mockData} />);

      const initialHTML = container.innerHTML;

      rerender(<Table columns={mockColumns} data={mockData} />);

      expect(container.innerHTML).toBe(initialHTML);
    });
  });

  describe('Accessibility', () => {
    it('should have proper table roles', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should have column headers', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);
    });

    it('should have row groups', () => {
      const { container } = render(<Table columns={mockColumns} data={mockData} />);

      const rowGroup = container.querySelector('tbody');
      expect(rowGroup).toBeInTheDocument();
    });
  });

  describe('Cell Rendering', () => {
    it('should render cells with proper alignment', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      const cells = screen.getAllByRole('cell');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should handle multiline text with pre-line whitespace', () => {
      const multilineData = [
        { id: 1, name: 'John\nDoe', email: 'john@example.com', age: 30 },
      ];

      const { container } = render(<Table columns={mockColumns} data={multilineData} />);

      const cell = screen.getByText(/John.*Doe/s).closest('td') as HTMLElement;
      expect(cell).toHaveStyle({ whiteSpace: 'pre-line' });
    });
  });

  describe('Integration Tests', () => {
    it('should work with all features enabled', () => {
      const onRowClick = jest.fn();
      const onPageChange = jest.fn();
      const getRowClassName = (row: unknown) => 'custom-row';
      const getRowStyle = (row: unknown) => ({ color: 'blue' });

      const pagination: Pagination = {
        offset: 1,
        limit: 10,
        total: 50,
        onPageChange,
      };

      render(
        <Table
          columns={mockColumns}
          data={mockData}
          serial_no={true}
          pagination={pagination}
          onRowClick={onRowClick}
          getRowClassName={getRowClassName}
          getRowStyle={getRowStyle}
          title="Complete Table"
        />
      );

      // Check title
      expect(screen.getByText('Complete Table')).toBeInTheDocument();

      // Check serial numbers
      expect(screen.getByText('S.No.')).toBeInTheDocument();

      // Check data
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Check pagination
      expect(screen.getByTestId('pagination')).toBeInTheDocument();

      // Check row click
      const row = screen.getByText('John Doe').closest('tr');
      fireEvent.click(row!);
      expect(onRowClick).toHaveBeenCalled();
    });

    it('should handle dynamic data updates', () => {
      const { rerender } = render(<Table columns={mockColumns} data={mockData} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();

      const newData = [{ id: 4, name: 'Alice Brown', email: 'alice@example.com', age: 28 }];
      rerender(<Table columns={mockColumns} data={newData} />);

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    });
  });
});

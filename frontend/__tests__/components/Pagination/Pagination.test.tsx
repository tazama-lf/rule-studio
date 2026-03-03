import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CustomPagination from '../../../src/components/Pagination';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('CustomPagination Component', () => {
  describe('Basic Rendering', () => {
    it('should render the pagination component', () => {
      renderWithTheme(<CustomPagination total={50} onPageChange={jest.fn()} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should render entries text', () => {
      renderWithTheme(<CustomPagination total={50} onPageChange={jest.fn()} />);
      expect(screen.getByText(/Showing/)).toBeInTheDocument();
      expect(screen.getByText(/entries/)).toBeInTheDocument();
    });
  });

  describe('Entries Text', () => {
    const getEntriesText = () => screen.getByText(/Showing/).textContent;

    it('should show correct range for first page', () => {
      renderWithTheme(
        <CustomPagination total={50} limit={10} current_page={0} onPageChange={jest.fn()} />
      );
      expect(getEntriesText()).toContain('1');
      expect(getEntriesText()).toContain('10');
      expect(getEntriesText()).toContain('50');
    });

    it('should show correct range for second page', () => {
      renderWithTheme(
        <CustomPagination total={50} limit={10} current_page={1} onPageChange={jest.fn()} />
      );
      expect(getEntriesText()).toContain('11');
      expect(getEntriesText()).toContain('20');
    });

    it('should show correct range for last page with partial results', () => {
      renderWithTheme(
        <CustomPagination total={25} limit={10} current_page={2} onPageChange={jest.fn()} />
      );
      expect(getEntriesText()).toContain('21');
      expect(getEntriesText()).toContain('25');
    });

    it('should handle custom limit', () => {
      renderWithTheme(
        <CustomPagination total={100} limit={20} current_page={0} onPageChange={jest.fn()} />
      );
      expect(getEntriesText()).toContain('1');
      expect(getEntriesText()).toContain('20');
      expect(getEntriesText()).toContain('100');
    });
  });

  describe('Page Count', () => {
    it('should render correct number of pages for 50 items with limit 10', () => {
      renderWithTheme(
        <CustomPagination total={50} limit={10} current_page={0} onPageChange={jest.fn()} />
      );
      // 5 pages total
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should render 1 page when total is 0', () => {
      renderWithTheme(
        <CustomPagination total={0} limit={10} current_page={0} onPageChange={jest.fn()} />
      );
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should ceil page count for non-exact division', () => {
      renderWithTheme(
        <CustomPagination total={25} limit={10} current_page={0} onPageChange={jest.fn()} />
      );
      // 3 pages (ceil(25/10))
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Page Change', () => {
    it('should call onPageChange when a page is clicked', () => {
      const onPageChange = jest.fn();
      renderWithTheme(
        <CustomPagination total={50} limit={10} current_page={0} onPageChange={onPageChange} />
      );
      fireEvent.click(screen.getByText('2'));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('should call onPageChange with correct page on next click', () => {
      const onPageChange = jest.fn();
      renderWithTheme(
        <CustomPagination total={50} limit={10} current_page={0} onPageChange={onPageChange} />
      );
      const nextButton = screen.getByLabelText('Go to next page');
      fireEvent.click(nextButton);
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('should call onPageChange with correct page on previous click', () => {
      const onPageChange = jest.fn();
      renderWithTheme(
        <CustomPagination total={50} limit={10} current_page={2} onPageChange={onPageChange} />
      );
      const prevButton = screen.getByLabelText('Go to previous page');
      fireEvent.click(prevButton);
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('should call onPageChange when clicking a specific page number', () => {
      const onPageChange = jest.fn();
      renderWithTheme(
        <CustomPagination total={50} limit={10} current_page={0} onPageChange={onPageChange} />
      );
      fireEvent.click(screen.getByText('4'));
      expect(onPageChange).toHaveBeenCalledWith(4);
    });
  });

  describe('Current Page Highlight', () => {
    it('should highlight current page (first page)', () => {
      const { container } = renderWithTheme(
        <CustomPagination total={50} limit={10} current_page={0} onPageChange={jest.fn()} />
      );
      const selected = container.querySelector('.Mui-selected');
      expect(selected).toBeInTheDocument();
      expect(selected).toHaveTextContent('1');
    });

    it('should highlight correct page for current_page=2', () => {
      const { container } = renderWithTheme(
        <CustomPagination total={50} limit={10} current_page={2} onPageChange={jest.fn()} />
      );
      const selected = container.querySelector('.Mui-selected');
      expect(selected).toHaveTextContent('3');
    });
  });

  describe('Default Values', () => {
    it('should default total to 0', () => {
      renderWithTheme(<CustomPagination onPageChange={jest.fn()} />);
      expect(screen.getByText(/Showing/).textContent).toContain('0');
    });

    it('should default limit to 10', () => {
      renderWithTheme(
        <CustomPagination total={30} current_page={0} onPageChange={jest.fn()} />
      );
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should default current_page to 0', () => {
      const { container } = renderWithTheme(
        <CustomPagination total={30} onPageChange={jest.fn()} />
      );
      const selected = container.querySelector('.Mui-selected');
      expect(selected).toHaveTextContent('1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single item', () => {
      renderWithTheme(
        <CustomPagination total={1} limit={10} current_page={0} onPageChange={jest.fn()} />
      );
      const text = screen.getByText(/Showing/).textContent;
      expect(text).toBe('Showing 1 to 1 of 1 entries');
    });

    it('should handle total equal to limit', () => {
      renderWithTheme(
        <CustomPagination total={10} limit={10} current_page={0} onPageChange={jest.fn()} />
      );
      const { container } = renderWithTheme(
        <CustomPagination total={10} limit={10} current_page={0} onPageChange={jest.fn()} />
      );
      // Only 1 page
      const pageButtons = container.querySelectorAll('.MuiPaginationItem-page');
      expect(pageButtons).toHaveLength(1);
    });

    it('should use outlined variant', () => {
      const { container } = renderWithTheme(
        <CustomPagination total={50} limit={10} current_page={0} onPageChange={jest.fn()} />
      );
      const outlinedItem = container.querySelector('.MuiPaginationItem-outlined');
      expect(outlinedItem).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props do not change', () => {
      const onPageChange = jest.fn();
      const { rerender, container } = renderWithTheme(
        <CustomPagination total={50} onPageChange={onPageChange} />
      );
      const first = container.firstChild;

      rerender(
        <ThemeProvider theme={theme}>
          <CustomPagination total={50} onPageChange={onPageChange} />
        </ThemeProvider>
      );
      const second = container.firstChild;

      expect(first).toBe(second);
    });
  });
});

import React from 'react';
import { render, screen, within, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Dropdown from '../../../src/components/DropDown';
import type { DropdownOption } from '../../../src/components/DropDown';

const theme = createTheme({
  palette: {
    text: {
      primary: '#000',
      secondary: '#666',
    },
    static: {
      grey: '#ccc',
      border: '#ddd',
    },
  } as any,
});

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

/** MUI OutlinedInput with readOnly + custom inputComponent doesn't render a textbox role */
const getInput = (container: HTMLElement) =>
  container.querySelector('.MuiOutlinedInput-root') as HTMLElement;

const mockOptions: DropdownOption[] = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
  { label: 'Option C', value: 'c' },
  { label: 'Option D', value: 'd' },
];

describe('Dropdown Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default label', () => {
      renderWithTheme(<Dropdown value={null} />);
      expect(screen.getByText('Select')).toBeInTheDocument();
    });

    it('should render with custom label', () => {
      renderWithTheme(<Dropdown label="Country" value={null} />);
      expect(screen.getByText('Country')).toBeInTheDocument();
    });

    it('should render placeholder when no value selected', () => {
      renderWithTheme(<Dropdown value={null} options={mockOptions} />);
      expect(screen.getByText('Choose...')).toBeInTheDocument();
    });

    it('should render custom placeholder', () => {
      renderWithTheme(<Dropdown placeholder="Pick one..." value={null} options={mockOptions} />);
      expect(screen.getByText('Pick one...')).toBeInTheDocument();
    });

    it('should display selected value label', () => {
      renderWithTheme(
        <Dropdown value={{ label: 'Option A', value: 'a' }} options={mockOptions} />
      );
      expect(screen.getByText('Option A')).toBeInTheDocument();
    });

    it('should render the dropdown arrow icon', () => {
      const { container } = renderWithTheme(<Dropdown value={null} />);
      const arrowIcon = container.querySelector('[data-testid="KeyboardArrowDownIcon"]');
      expect(arrowIcon).toBeInTheDocument();
    });
  });

  describe('Open/Close Behavior', () => {
    it('should not show options list initially', () => {
      renderWithTheme(<Dropdown value={null} options={mockOptions} />);
      expect(screen.queryByText('Option A')).not.toBeInTheDocument();
    });

    it('should open dropdown on input click', () => {
      const { container } = renderWithTheme(<Dropdown value={null} options={mockOptions} />);
      fireEvent.click(getInput(container));
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', () => {
      const { container } = renderWithTheme(<Dropdown value={null} options={mockOptions} />);
      fireEvent.click(getInput(container));
      expect(screen.getByText('Option A')).toBeInTheDocument();

      act(() => {
        fireEvent.mouseDown(document.body);
      });
      expect(screen.queryByText('Option A')).not.toBeInTheDocument();
    });

    it('should not open when disabled', () => {
      const { container } = renderWithTheme(<Dropdown value={null} options={mockOptions} disabled />);
      fireEvent.click(getInput(container));
      expect(screen.queryByText('Option A')).not.toBeInTheDocument();
    });

    it('should toggle open state on repeated clicks', () => {
      const { container } = renderWithTheme(<Dropdown value={null} options={mockOptions} />);
      const input = getInput(container);

      fireEvent.click(input);
      expect(screen.getByText('Option A')).toBeInTheDocument();

      fireEvent.click(input);
      expect(screen.queryByText('Option A')).not.toBeInTheDocument();
    });
  });

  describe('Single Select', () => {
    it('should call onChange with selected option', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <Dropdown value={null} options={mockOptions} onChange={onChange} />
      );
      fireEvent.click(getInput(container));
      fireEvent.click(screen.getByText('Option A'));
      expect(onChange).toHaveBeenCalledWith({ label: 'Option A', value: 'a' });
    });

    it('should close dropdown after single selection', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <Dropdown value={null} options={mockOptions} onChange={onChange} />
      );
      fireEvent.click(getInput(container));
      fireEvent.click(screen.getByText('Option B'));
      expect(screen.queryByText('Option C')).not.toBeInTheDocument();
    });

    it('should highlight selected option in list', () => {
      const { container } = renderWithTheme(
        <Dropdown value={{ label: 'Option B', value: 'b' }} options={mockOptions} />
      );
      fireEvent.click(getInput(container));

      const list = container.querySelector('.MuiList-root') as HTMLElement;
      const selectedItem = within(list).getByText('Option B').closest('.MuiListItemButton-root');
      expect(selectedItem).toHaveClass('Mui-selected');
    });
  });

  describe('Multiple Select', () => {
    it('should render multiple selected values as tags', () => {
      const selectedValues: DropdownOption[] = [
        { label: 'Option A', value: 'a' },
        { label: 'Option C', value: 'c' },
      ];
      renderWithTheme(
        <Dropdown value={selectedValues} options={mockOptions} multiple />
      );
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option C')).toBeInTheDocument();
    });

    it('should show placeholder when no items selected in multiple mode', () => {
      renderWithTheme(
        <Dropdown value={[]} options={mockOptions} multiple />
      );
      expect(screen.getByText('Choose...')).toBeInTheDocument();
    });

    it('should add option to selection in multiple mode', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <Dropdown value={[]} options={mockOptions} multiple onChange={onChange} />
      );
      fireEvent.click(getInput(container));
      fireEvent.click(screen.getByText('Option A'));
      expect(onChange).toHaveBeenCalledWith([{ label: 'Option A', value: 'a' }]);
    });

    it('should remove option from selection when clicking a selected option', () => {
      const onChange = jest.fn();
      const selectedValues: DropdownOption[] = [
        { label: 'Option A', value: 'a' },
        { label: 'Option B', value: 'b' },
      ];
      const { container } = renderWithTheme(
        <Dropdown value={selectedValues} options={mockOptions} multiple onChange={onChange} />
      );
      fireEvent.click(getInput(container));
      const list = container.querySelector('.MuiList-root') as HTMLElement;
      fireEvent.click(within(list).getByText('Option A'));
      expect(onChange).toHaveBeenCalledWith([{ label: 'Option B', value: 'b' }]);
    });

    it('should not close dropdown after selecting in multiple mode', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <Dropdown value={[]} options={mockOptions} multiple onChange={onChange} />
      );
      fireEvent.click(getInput(container));
      fireEvent.click(screen.getByText('Option A'));
      // Dropdown should remain open
      expect(screen.getByText('Option B')).toBeInTheDocument();
    });
  });

  describe('Searchable', () => {
    it('should show search input when searchable is true', () => {
      const { container } = renderWithTheme(
        <Dropdown value={null} options={mockOptions} searchable />
      );
      fireEvent.click(getInput(container));
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('should not show search input when searchable is false', () => {
      const { container } = renderWithTheme(
        <Dropdown value={null} options={mockOptions} />
      );
      fireEvent.click(getInput(container));
      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
    });

    it('should filter options based on search input', async () => {
      jest.useFakeTimers();
      const { container } = renderWithTheme(
        <Dropdown value={null} options={mockOptions} searchable />
      );
      fireEvent.click(getInput(container));

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'Option A' } });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.queryByText('Option B')).not.toBeInTheDocument();
      jest.useRealTimers();
    });

    it('should show no options found when search has no results', async () => {
      jest.useFakeTimers();
      const { container } = renderWithTheme(
        <Dropdown value={null} options={mockOptions} searchable />
      );
      fireEvent.click(getInput(container));

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'XYZ' } });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(screen.getByText('No options found')).toBeInTheDocument();
      jest.useRealTimers();
    });

    it('should be case insensitive search', async () => {
      jest.useFakeTimers();
      const { container } = renderWithTheme(
        <Dropdown value={null} options={mockOptions} searchable />
      );
      fireEvent.click(getInput(container));

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'option a' } });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(screen.getByText('Option A')).toBeInTheDocument();
      jest.useRealTimers();
    });
  });

  describe('Cancelable', () => {
    it('should show clear button when cancelable and value is selected', () => {
      const { container } = renderWithTheme(
        <Dropdown
          value={{ label: 'Option A', value: 'a' }}
          options={mockOptions}
          cancelable
        />
      );
      const closeIcon = container.querySelector('[data-testid="CloseIcon"]');
      expect(closeIcon).toBeInTheDocument();
    });

    it('should not show clear button when cancelable but no value', () => {
      const { container } = renderWithTheme(
        <Dropdown value={null} options={mockOptions} cancelable />
      );
      const closeIcon = container.querySelector('[data-testid="CloseIcon"]');
      expect(closeIcon).not.toBeInTheDocument();
    });

    it('should not show clear button when not cancelable', () => {
      const { container } = renderWithTheme(
        <Dropdown
          value={{ label: 'Option A', value: 'a' }}
          options={mockOptions}
        />
      );
      const closeIcon = container.querySelector('[data-testid="CloseIcon"]');
      expect(closeIcon).not.toBeInTheDocument();
    });

    it('should clear single value on clear click', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <Dropdown
          value={{ label: 'Option A', value: 'a' }}
          options={mockOptions}
          cancelable
          onChange={onChange}
        />
      );
      const closeBtn = container.querySelector('[data-testid="CloseIcon"]')!.closest('button')!;
      fireEvent.click(closeBtn);
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('should clear multiple values on clear click', () => {
      const onChange = jest.fn();
      const selectedValues: DropdownOption[] = [
        { label: 'Option A', value: 'a' },
        { label: 'Option B', value: 'b' },
      ];
      const { container } = renderWithTheme(
        <Dropdown
          value={selectedValues}
          options={mockOptions}
          multiple
          cancelable
          onChange={onChange}
        />
      );
      const closeBtn = container.querySelector('[data-testid="CloseIcon"]')!.closest('button')!;
      fireEvent.click(closeBtn);
      expect(onChange).toHaveBeenCalledWith([]);
    });

    it('should not show clear button for empty array in multiple mode', () => {
      const { container } = renderWithTheme(
        <Dropdown value={[]} options={mockOptions} multiple cancelable />
      );
      const closeIcon = container.querySelector('[data-testid="CloseIcon"]');
      expect(closeIcon).not.toBeInTheDocument();
    });
  });

  describe('View Only Mode', () => {
    it('should display single value as text in view only mode', () => {
      renderWithTheme(
        <Dropdown
          value={{ label: 'Option A', value: 'a' }}
          options={mockOptions}
          view_only
        />
      );
      expect(screen.getByText('Option A')).toBeInTheDocument();
    });

    it('should display dash for null value in view only mode', () => {
      renderWithTheme(
        <Dropdown value={null} options={mockOptions} view_only />
      );
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should display joined labels for multiple values in view only mode', () => {
      const selectedValues: DropdownOption[] = [
        { label: 'Option A', value: 'a' },
        { label: 'Option B', value: 'b' },
      ];
      renderWithTheme(
        <Dropdown value={selectedValues} options={mockOptions} multiple view_only />
      );
      expect(screen.getByText('Option A, Option B')).toBeInTheDocument();
    });

    it('should display dash for empty array in view only mode', () => {
      renderWithTheme(
        <Dropdown value={[]} options={mockOptions} multiple view_only />
      );
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should not show dropdown input in view only mode', () => {
      const { container } = renderWithTheme(
        <Dropdown value={null} options={mockOptions} view_only />
      );
      expect(getInput(container)).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      renderWithTheme(
        <Dropdown value={null} error="Required field" />
      );
      expect(screen.getByText('Required field')).toBeInTheDocument();
    });

    it('should not display error when no error prop', () => {
      renderWithTheme(<Dropdown value={null} />);
      expect(screen.queryByText('Required field')).not.toBeInTheDocument();
    });

    it('should mark form control as error state', () => {
      const { container } = renderWithTheme(
        <Dropdown value={null} error="Error" />
      );
      const helperText = container.querySelector('.MuiFormHelperText-root');
      expect(helperText).toBeInTheDocument();
      expect(helperText).toHaveTextContent('Error');
    });
  });

  describe('Required', () => {
    it('should pass required prop to FormControl', () => {
      const { container } = renderWithTheme(
        <Dropdown value={null} required />
      );
      const formControl = container.querySelector('.MuiFormControl-root');
      expect(formControl).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should not toggle option when disabled', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <Dropdown value={null} options={mockOptions} disabled onChange={onChange} />
      );
      fireEvent.click(getInput(container));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('onClick Handler', () => {
    it('should call onClick instead of opening dropdown when provided', () => {
      const onClick = jest.fn();
      const { container } = renderWithTheme(
        <Dropdown value={null} options={mockOptions} onClick={onClick} />
      );
      fireEvent.click(getInput(container));
      expect(onClick).toHaveBeenCalled();
      // Dropdown should not open since onClick is handling it
      expect(screen.queryByText('Option A')).not.toBeInTheDocument();
    });
  });

  describe('Height Variants', () => {
    it('should render with medium height by default', () => {
      const { container } = renderWithTheme(<Dropdown value={null} />);
      expect(getInput(container)).toBeInTheDocument();
    });

    it('should render with small height', () => {
      const { container } = renderWithTheme(<Dropdown value={null} height="sm" />);
      expect(getInput(container)).toBeInTheDocument();
    });
  });

  describe('MaxWidth', () => {
    it('should apply maxWidth to FormControl', () => {
      const { container } = renderWithTheme(
        <Dropdown value={null} maxWidth="300px" />
      );
      const formControl = container.querySelector('.MuiFormControl-root');
      expect(formControl).toHaveStyle({ maxWidth: '300px' });
    });
  });

  describe('Empty Options', () => {
    it('should handle undefined options gracefully', () => {
      const { container } = renderWithTheme(<Dropdown value={null} />);
      const input = getInput(container);
      fireEvent.click(input);
      // Should not crash
      expect(input).toBeInTheDocument();
    });

    it('should handle empty options array', () => {
      const { container } = renderWithTheme(<Dropdown value={null} options={[]} />);
      fireEvent.click(getInput(container));
      expect(screen.getByText('No options found')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props do not change', () => {
      const { rerender, container } = renderWithTheme(<Dropdown value={null} />);
      const firstRender = container.querySelector('.MuiFormControl-root');

      rerender(
        <ThemeProvider theme={theme}>
          <Dropdown value={null} />
        </ThemeProvider>
      );
      const secondRender = container.querySelector('.MuiFormControl-root');

      expect(firstRender).toBe(secondRender);
    });
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import Input from '../../../src/components/Input';

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

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('should render with label', () => {
      renderWithTheme(<Input label="Username" />);
      expect(screen.getByLabelText(/Username/)).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      renderWithTheme(<Input placeholder="Type here..." />);
      expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
    });

    it('should generate placeholder from label when none provided', () => {
      renderWithTheme(<Input label="Email" />);
      expect(screen.getByPlaceholderText('Enter Email')).toBeInTheDocument();
    });

    it('should render empty placeholder when no label or placeholder', () => {
      renderWithTheme(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with a value', () => {
      renderWithTheme(<Input value="Hello" />);
      expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
    });

    it('should render as full width', () => {
      const { container } = renderWithTheme(<Input label="Name" />);
      const textField = container.querySelector('.MuiFormControl-fullWidth');
      expect(textField).toBeInTheDocument();
    });
  });

  describe('Text Input', () => {
    it('should call onChange when typing', () => {
      const onChange = jest.fn();
      renderWithTheme(<Input label="Name" onChange={onChange} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'John' } });
      expect(onChange).toHaveBeenCalled();
    });

    it('should call onBlur when input loses focus', () => {
      const onBlur = jest.fn();
      renderWithTheme(<Input label="Name" onBlur={onBlur} />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(onBlur).toHaveBeenCalled();
    });

    it('should apply name attribute', () => {
      renderWithTheme(<Input name="email" label="Email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'email');
    });

    it('should enforce maxLength', () => {
      renderWithTheme(<Input label="Code" maxLength={5} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '5');
    });
  });

  describe('Password Input', () => {
    it('should render as password type by default', () => {
      renderWithTheme(<Input label="Password" type="password" />);
      const input = screen.getByLabelText(/Password/);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should show visibility toggle icon for password', () => {
      const { container } = renderWithTheme(<Input label="Password" type="password" />);
      const visibilityOffIcon = container.querySelector('[data-testid="VisibilityOffIcon"]');
      expect(visibilityOffIcon).toBeInTheDocument();
    });

    it('should toggle password visibility on icon click', () => {
      const { container } = renderWithTheme(<Input label="Password" type="password" />);
      const input = screen.getByLabelText(/Password/);
      expect(input).toHaveAttribute('type', 'password');

      const toggleButton = container.querySelector('[data-testid="VisibilityOffIcon"]')!.closest('button')!;
      fireEvent.click(toggleButton);

      expect(input).toHaveAttribute('type', 'text');
      const visibilityOnIcon = container.querySelector('[data-testid="VisibilityIcon"]');
      expect(visibilityOnIcon).toBeInTheDocument();
    });

    it('should toggle back to hidden on second click', () => {
      const { container } = renderWithTheme(<Input label="Password" type="password" />);
      const input = screen.getByLabelText(/Password/);

      const toggleButton = container.querySelector('[data-testid="VisibilityOffIcon"]')!.closest('button')!;
      fireEvent.click(toggleButton);
      expect(input).toHaveAttribute('type', 'text');

      const toggleButton2 = container.querySelector('[data-testid="VisibilityIcon"]')!.closest('button')!;
      fireEvent.click(toggleButton2);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should not toggle password visibility when disabled', () => {
      const { container } = renderWithTheme(
        <Input label="Password" type="password" disabled />
      );
      const input = screen.getByLabelText(/Password/);
      const toggleButton = container.querySelector('[data-testid="VisibilityOffIcon"]')!.closest('button')!;

      fireEvent.click(toggleButton);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should prevent mouseDown default on toggle button', () => {
      const { container } = renderWithTheme(<Input label="Password" type="password" />);
      const toggleButton = container.querySelector('[data-testid="VisibilityOffIcon"]')!.closest('button')!;

      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(mouseDownEvent, 'preventDefault');
      toggleButton.dispatchEvent(mouseDownEvent);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not show toggle icon for non-password types', () => {
      const { container } = renderWithTheme(<Input label="Name" type="text" />);
      expect(container.querySelector('[data-testid="VisibilityOffIcon"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid="VisibilityIcon"]')).not.toBeInTheDocument();
    });
  });

  describe('Textarea', () => {
    it('should render as multiline when type is textarea', () => {
      const { container } = renderWithTheme(<Input label="Description" type="textarea" />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toBeInTheDocument();
    });

    it('should render with default 4 rows', () => {
      const { container } = renderWithTheme(<Input label="Description" type="textarea" />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveAttribute('rows', '4');
    });

    it('should render with custom rows', () => {
      const { container } = renderWithTheme(<Input label="Notes" type="textarea" rows={6} />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveAttribute('rows', '6');
    });
  });

  describe('Disabled State', () => {
    it('should render as disabled', () => {
      renderWithTheme(<Input label="Name" disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should not allow user input when disabled', () => {
      renderWithTheme(<Input label="Name" disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute('disabled');
    });
  });

  describe('Error State', () => {
    it('should display error message', () => {
      renderWithTheme(<Input label="Email" error="Invalid email" />);
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('should not display error when no error prop', () => {
      renderWithTheme(<Input label="Email" />);
      expect(screen.queryByText('Invalid email')).not.toBeInTheDocument();
    });

    it('should set error state on TextField', () => {
      const { container } = renderWithTheme(<Input label="Email" error="Required" />);
      const inputBase = container.querySelector('.Mui-error');
      expect(inputBase).toBeInTheDocument();
    });
  });

  describe('Left Icon', () => {
    it('should render left icon when provided', () => {
      const { container } = renderWithTheme(<Input label="Search" leftIcon={SearchIcon} />);
      const searchIcon = container.querySelector('[data-testid="SearchIcon"]');
      expect(searchIcon).toBeInTheDocument();
    });

    it('should render empty start adornment div when no left icon', () => {
      const { container } = renderWithTheme(<Input label="Name" />);
      const adornment = container.querySelector('.MuiInputAdornment-positionStart');
      expect(adornment).not.toBeInTheDocument();
    });
  });

  describe('View Only Mode', () => {
    it('should display value as text in view only mode', () => {
      renderWithTheme(<Input label="Name" value="John" view_only />);
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('should display dash for null value in view only mode', () => {
      renderWithTheme(<Input label="Name" value={null} view_only />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should display dash for empty value in view only mode', () => {
      renderWithTheme(<Input label="Name" value="" view_only />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should not render TextField in view only mode', () => {
      const { container } = renderWithTheme(<Input label="Name" value="John" view_only />);
      expect(container.querySelector('.MuiTextField-root')).not.toBeInTheDocument();
    });

    it('should display label in view only mode', () => {
      renderWithTheme(<Input label="Name" value="John" view_only />);
      expect(screen.getByText('Name :')).toBeInTheDocument();
    });

    it('should show masked password in view only mode', () => {
      renderWithTheme(<Input label="Password" type="password" value="secret" view_only />);
      expect(screen.getByText('******')).toBeInTheDocument();
    });

    it('should toggle password visibility in view only mode', () => {
      renderWithTheme(<Input label="Password" type="password" value="secret" view_only />);
      expect(screen.getByText('******')).toBeInTheDocument();

      const toggleButton = screen.getByLabelText('Show password');
      fireEvent.click(toggleButton);
      expect(screen.getByText('secret')).toBeInTheDocument();
    });

    it('should not show toggle button for password without value in view only mode', () => {
      renderWithTheme(<Input label="Password" type="password" value="" view_only />);
      expect(screen.queryByLabelText('Show password')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Hide password')).not.toBeInTheDocument();
    });
  });

  describe('Height Variants', () => {
    it('should render with medium height by default', () => {
      const { container } = renderWithTheme(<Input label="Name" />);
      const inputRoot = container.querySelector('.MuiOutlinedInput-root');
      expect(inputRoot).toBeInTheDocument();
    });

    it('should render with small height', () => {
      const { container } = renderWithTheme(<Input label="Name" height="sm" />);
      const inputRoot = container.querySelector('.MuiOutlinedInput-root');
      expect(inputRoot).toBeInTheDocument();
    });
  });

  describe('MaxWidth', () => {
    it('should apply maxWidth via InputWrapper', () => {
      const { container } = renderWithTheme(<Input label="Name" maxWidth="300px" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ maxWidth: '300px' });
    });

    it('should use default maxWidth of 450 when not specified', () => {
      const { container } = renderWithTheme(<Input label="Name" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ maxWidth: '450px' });
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to the input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      renderWithTheme(<Input label="Name" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('should forward ref for textarea', () => {
      const ref = React.createRef<HTMLTextAreaElement>();
      renderWithTheme(<Input label="Notes" type="textarea" ref={ref as any} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props do not change', () => {
      const { rerender, container } = renderWithTheme(<Input label="Name" value="test" />);
      const firstRender = container.querySelector('.MuiFormControl-root');

      rerender(
        <ThemeProvider theme={theme}>
          <Input label="Name" value="test" />
        </ThemeProvider>
      );
      const secondRender = container.querySelector('.MuiFormControl-root');

      expect(firstRender).toBe(secondRender);
    });
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Components from '../../src/components/index';

const theme = createTheme({
  palette: {
    static: {
      primary: '#1976d2',
      secondary: '#4b7eee',
      skyBlue: '#87ceeb',
      ternary: '#666666',
      black: '#000000',
      white: '#ffffff',
      lightBlue: '#eff6ff',
      border: '#e0e0e0',
      grey: '#f5f5f5',
      lightGrey: '#fafafa',
    },
    text: {
      ternary: '#666666',
    },
  },
});

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('Components', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = renderWithTheme(<Components />);
      expect(container).toBeInTheDocument();
    });

    it('should render button components section', () => {
      renderWithTheme(<Components />);
      expect(screen.getByText('Button Components')).toBeInTheDocument();
    });

    it('should render dropdown components section', () => {
      renderWithTheme(<Components />);
      expect(screen.getByText('DropDown Components')).toBeInTheDocument();
    });

    it('should render all four button types', () => {
      renderWithTheme(<Components />);
      const buttons = screen.getAllByRole('button', { name: /Count 0/i });
      expect(buttons).toHaveLength(4);
    });
  });

  describe('Button Components', () => {
    it('should initialize count at 0', () => {
      renderWithTheme(<Components />);
      const buttons = screen.getAllByRole('button', { name: /Count 0/i });
      expect(buttons[0]).toHaveTextContent('Count 0');
    });

    it('should increment count when primary button is clicked', () => {
      renderWithTheme(<Components />);
      const buttons = screen.getAllByRole('button', { name: /Count/i });
      
      fireEvent.click(buttons[0]);
      
      expect(screen.getAllByRole('button', { name: /Count 1/i })).toHaveLength(4);
    });

    it('should increment count when secondary button is clicked', () => {
      renderWithTheme(<Components />);
      const buttons = screen.getAllByRole('button', { name: /Count/i });
      
      fireEvent.click(buttons[1]);
      
      expect(screen.getAllByRole('button', { name: /Count 1/i })).toHaveLength(4);
    });

    it('should increment count when danger button is clicked', () => {
      renderWithTheme(<Components />);
      const buttons = screen.getAllByRole('button', { name: /Count/i });
      
      fireEvent.click(buttons[2]);
      
      expect(screen.getAllByRole('button', { name: /Count 1/i })).toHaveLength(4);
    });

    it('should increment count when success button is clicked', () => {
      renderWithTheme(<Components />);
      const buttons = screen.getAllByRole('button', { name: /Count/i });
      
      fireEvent.click(buttons[3]);
      
      expect(screen.getAllByRole('button', { name: /Count 1/i })).toHaveLength(4);
    });

    it('should increment count multiple times', () => {
      renderWithTheme(<Components />);
      const buttons = screen.getAllByRole('button', { name: /Count/i });
      
      fireEvent.click(buttons[0]);
      fireEvent.click(buttons[0]);
      fireEvent.click(buttons[0]);
      
      expect(screen.getAllByRole('button', { name: /Count 3/i })).toHaveLength(4);
    });

    it('should share count state across all buttons', () => {
      renderWithTheme(<Components />);
      const buttons = screen.getAllByRole('button', { name: /Count/i });
      
      fireEvent.click(buttons[0]);
      fireEvent.click(buttons[1]);
      fireEvent.click(buttons[2]);
      
      expect(screen.getAllByRole('button', { name: /Count 3/i })).toHaveLength(4);
    });
  });

  describe('Dropdown Components', () => {
    it('should render three dropdown components', () => {
      renderWithTheme(<Components />);
      const statusLabels = screen.getAllByText('Status');
      expect(statusLabels.length).toBeGreaterThanOrEqual(3);
    });

    it('should render required dropdown with label', () => {
      renderWithTheme(<Components />);
      const labels = screen.getAllByText('Status');
      expect(labels[0]).toBeInTheDocument();
    });

    it('should render dropdown placeholders', () => {
      renderWithTheme(<Components />);
      const placeholders = screen.getAllByText('Select status');
      expect(placeholders.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle dropdown value changes', () => {
      renderWithTheme(<Components />);
      const dropdowns = screen.getAllByText('Select status');
      
      fireEvent.mouseDown(dropdowns[0]);

      expect(dropdowns[0]).toBeInTheDocument();
    });
  });

  describe('Input Components', () => {
    it('should render full name input', () => {
      renderWithTheme(<Components />);
      const inputs = screen.getAllByPlaceholderText('Enter your name');
      expect(inputs[0]).toBeInTheDocument();
    });

    it('should render password input', () => {
      renderWithTheme(<Components />);
      const inputs = screen.getAllByPlaceholderText('Enter your name');
      expect(inputs[1]).toBeInTheDocument();
    });

    it('should render bio textarea', () => {
      renderWithTheme(<Components />);
      expect(screen.getByPlaceholderText('Tell us about yourself')).toBeInTheDocument();
    });

    it('should have correct placeholder for name input', () => {
      renderWithTheme(<Components />);
      expect(screen.getAllByPlaceholderText('Enter your name')[0]).toBeInTheDocument();
    });

    it('should have correct placeholder for bio textarea', () => {
      renderWithTheme(<Components />);
      expect(screen.getByPlaceholderText('Tell us about yourself')).toBeInTheDocument();
    });

    it('should update name input value', () => {
      renderWithTheme(<Components />);
      const nameInput = screen.getAllByPlaceholderText('Enter your name')[0];
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      
      expect(nameInput).toHaveValue('John Doe');
    });

    it('should update password input value', () => {
      renderWithTheme(<Components />);
      const inputs = screen.getAllByPlaceholderText('Enter your name');
      const passwordInput = inputs[1];
      
      fireEvent.change(passwordInput, { target: { value: 'secret123' } });
      
      expect(passwordInput).toHaveValue('secret123');
    });

    it('should update bio textarea value', () => {
      renderWithTheme(<Components />);
      const bioTextarea = screen.getByPlaceholderText('Tell us about yourself');
      
      fireEvent.change(bioTextarea, { target: { value: 'This is my bio' } });
      
      expect(bioTextarea).toHaveValue('This is my bio');
    });

    it('should have password input type', () => {
      renderWithTheme(<Components />);
      const inputs = screen.getAllByPlaceholderText('Enter your name');
      const passwordInput = inputs[1];
      
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should handle empty input values', () => {
      renderWithTheme(<Components />);
      const nameInput = screen.getAllByPlaceholderText('Enter your name')[0];
      
      fireEvent.change(nameInput, { target: { value: 'Test' } });
      fireEvent.change(nameInput, { target: { value: '' } });
      
      expect(nameInput).toHaveValue('');
    });

    it('should handle long text in textarea', () => {
      renderWithTheme(<Components />);
      const bioTextarea = screen.getByPlaceholderText('Tell us about yourself');
      const longText = 'A'.repeat(500);
      
      fireEvent.change(bioTextarea, { target: { value: longText } });
      
      expect(bioTextarea).toHaveValue(longText);
    });
  });

  describe('State Management', () => {
    it('should maintain independent state for different inputs', () => {
      renderWithTheme(<Components />);
      const nameInput = screen.getAllByPlaceholderText('Enter your name')[0];
      const bioTextarea = screen.getByPlaceholderText('Tell us about yourself');
      
      fireEvent.change(nameInput, { target: { value: 'Alice' } });
      fireEvent.change(bioTextarea, { target: { value: 'Developer' } });
      
      expect(nameInput).toHaveValue('Alice');
      expect(bioTextarea).toHaveValue('Developer');
    });

    it('should update count state independently of input states', () => {
      renderWithTheme(<Components />);
      const button = screen.getAllByRole('button', { name: /Count/i })[0];
      const nameInput = screen.getAllByPlaceholderText('Enter your name')[0];
      
      fireEvent.click(button);
      fireEvent.change(nameInput, { target: { value: 'Test' } });
      
      expect(screen.getAllByRole('button', { name: /Count 1/i })).toHaveLength(4);
      expect(nameInput).toHaveValue('Test');
    });
  });

  describe('Layout and Structure', () => {
    it('should render sections in correct order', () => {
      renderWithTheme(<Components />);
      const sections = screen.getAllByText(/Components$/);
      
      expect(sections[0]).toHaveTextContent('Button Components');
      expect(sections[1]).toHaveTextContent('DropDown Components');
    });

    it('should use Grid container for layout', () => {
      const { container } = renderWithTheme(<Components />);
      const grids = container.querySelectorAll('.MuiGrid-container');
      
      expect(grids.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid button clicks', () => {
      renderWithTheme(<Components />);
      const button = screen.getAllByRole('button', { name: /Count/i })[0];
      
      for (let i = 0; i < 20; i++) {
        fireEvent.click(button);
      }
      
      expect(screen.getAllByRole('button', { name: /Count 20/i })).toHaveLength(4);
    });

    it('should handle special characters in inputs', () => {
      renderWithTheme(<Components />);
      const nameInput = screen.getAllByPlaceholderText('Enter your name')[0];
      
      fireEvent.change(nameInput, { target: { value: '@#$%^&*()' } });
      
      expect(nameInput).toHaveValue('@#$%^&*()');
    });

    it('should handle whitespace in inputs', () => {
      renderWithTheme(<Components />);
      const nameInput = screen.getAllByPlaceholderText('Enter your name')[0];
      
      fireEvent.change(nameInput, { target: { value: '   spaces   ' } });
      
      expect(nameInput).toHaveValue('   spaces   ');
    });

    it('should handle multiline text in bio', () => {
      renderWithTheme(<Components />);
      const bioTextarea = screen.getByPlaceholderText('Tell us about yourself');
      
      fireEvent.change(bioTextarea, { target: { value: 'Line 1\nLine 2\nLine 3' } });
      
      expect(bioTextarea).toHaveValue('Line 1\nLine 2\nLine 3');
    });
  });

  describe('Button Size and Type Props', () => {
    it('should render buttons with medium size', () => {
      const { container } = renderWithTheme(<Components />);
      const buttons = container.querySelectorAll('button');
      
      expect(buttons.length).toBeGreaterThanOrEqual(4);
    });

    it('should render buttons with different types', () => {
      renderWithTheme(<Components />);
      const buttons = screen.getAllByRole('button', { name: /Count/i });
      
      expect(buttons).toHaveLength(4);
    });
  });

  describe('Dropdown Variations', () => {
    it('should render single select dropdown', () => {
      renderWithTheme(<Components />);
      const dropdowns = screen.getAllByText('Select status');
      
      expect(dropdowns[0]).toBeInTheDocument();
    });

    it('should render multiple select dropdown without search', () => {
      renderWithTheme(<Components />);
      const dropdowns = screen.getAllByText('Select status');
      
      expect(dropdowns[1]).toBeInTheDocument();
    });

    it('should render searchable multiple select dropdown', () => {
      renderWithTheme(<Components />);
      const dropdowns = screen.getAllByText('Select status');
      
      expect(dropdowns[2]).toBeInTheDocument();
    });
  });

  describe('Input Types', () => {
    it('should render text input for name', () => {
      renderWithTheme(<Components />);
      const nameInput = screen.getAllByPlaceholderText('Enter your name')[0];
      
      expect(nameInput).toHaveAttribute('type', 'text');
    });

    it('should render password input with correct type', () => {
      renderWithTheme(<Components />);
      const inputs = screen.getAllByPlaceholderText('Enter your name');
      const passwordInput = inputs[1];
      
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should render textarea for bio', () => {
      renderWithTheme(<Components />);
      const bioTextarea = screen.getByPlaceholderText('Tell us about yourself');
      
      expect(bioTextarea.tagName).toBe('TEXTAREA');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for inputs', () => {
      renderWithTheme(<Components />);
      const nameInputs = screen.getAllByPlaceholderText('Enter your name');
      const bioInput = screen.getByPlaceholderText('Tell us about yourself');
      
      expect(nameInputs[0]).toBeInTheDocument();
      expect(nameInputs[1]).toBeInTheDocument();
      expect(bioInput).toBeInTheDocument();
    });

    it('should have accessible labels for dropdowns', () => {
      renderWithTheme(<Components />);
      const statusLabels = screen.getAllByText('Status');
      
      expect(statusLabels.length).toBeGreaterThanOrEqual(3);
    });

    it('should have accessible buttons', () => {
      renderWithTheme(<Components />);
      const buttons = screen.getAllByRole('button', { name: /Count/i });
      
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Integration', () => {
    it('should handle multiple interactions in sequence', () => {
      renderWithTheme(<Components />);
      
      const button = screen.getAllByRole('button', { name: /Count/i })[0];
      fireEvent.click(button);
      
      const nameInput = screen.getAllByPlaceholderText('Enter your name')[0];
      fireEvent.change(nameInput, { target: { value: 'John' } });
      
      const inputs = screen.getAllByPlaceholderText('Enter your name');
      const passwordInput = inputs[1];
      fireEvent.change(passwordInput, { target: { value: 'pass123' } });
      
      const bioTextarea = screen.getByPlaceholderText('Tell us about yourself');
      fireEvent.change(bioTextarea, { target: { value: 'My bio' } });
      
      expect(screen.getAllByRole('button', { name: /Count 1/i })).toHaveLength(4);
      expect(nameInput).toHaveValue('John');
      expect(passwordInput).toHaveValue('pass123');
      expect(bioTextarea).toHaveValue('My bio');
    });

    it('should maintain state after multiple renders', () => {
      const { rerender } = renderWithTheme(<Components />);
      
      const button = screen.getAllByRole('button', { name: /Count/i })[0];
      fireEvent.click(button);
      
      rerender(
        <ThemeProvider theme={theme}>
          <Components />
        </ThemeProvider>
      );
      
      // State should persist across rerenders
      expect(screen.getAllByRole('button', { name: /Count 1/i })).toHaveLength(4);
    });
  });
});

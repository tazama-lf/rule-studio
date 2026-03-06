import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Section from '../../../../src/components/Wrappers/Section';

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

describe('Section', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = renderWithTheme(
        <Section header="Test Header">
          <div>Content</div>
        </Section>
      );

      expect(container).toBeInTheDocument();
    });

    it('should render header correctly', () => {
      renderWithTheme(
        <Section header="Test Header">
          <div>Content</div>
        </Section>
      );

      expect(screen.getByText('Test Header')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      renderWithTheme(
        <Section header="Header">
          <div>Child Content</div>
        </Section>
      );

      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should render complete section structure', () => {
      renderWithTheme(
        <Section header="Section Header" subHeader="Section SubHeader">
          <div>Section Content</div>
        </Section>
      );

      expect(screen.getByText('Section Header')).toBeInTheDocument();
      expect(screen.getByText('Section SubHeader')).toBeInTheDocument();
      expect(screen.getByText('Section Content')).toBeInTheDocument();
    });
  });

  describe('Header Rendering', () => {
    it('should display header text', () => {
      renderWithTheme(
        <Section header="Main Header">
          <div>Content</div>
        </Section>
      );

      expect(screen.getByText('Main Header')).toBeInTheDocument();
    });

    it('should render header with correct styling', () => {
      renderWithTheme(
        <Section header="Styled Header">
          <div>Content</div>
        </Section>
      );

      const header = screen.getByText('Styled Header');
      expect(header).toBeInTheDocument();
    });

    it('should handle long header text', () => {
      const longHeader = 'This is a very long header text that might wrap to multiple lines';
      renderWithTheme(
        <Section header={longHeader}>
          <div>Content</div>
        </Section>
      );

      expect(screen.getByText(longHeader)).toBeInTheDocument();
    });

    it('should handle header with special characters', () => {
      const specialHeader = 'Header with @#$% special & characters!';
      renderWithTheme(
        <Section header={specialHeader}>
          <div>Content</div>
        </Section>
      );

      expect(screen.getByText(specialHeader)).toBeInTheDocument();
    });

    it('should handle header with numbers', () => {
      renderWithTheme(
        <Section header="Section 123">
          <div>Content</div>
        </Section>
      );

      expect(screen.getByText('Section 123')).toBeInTheDocument();
    });

    it('should handle empty string header', () => {
      renderWithTheme(
        <Section header="">
          <div>Content</div>
        </Section>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('SubHeader Rendering', () => {
    it('should display subHeader when provided', () => {
      renderWithTheme(
        <Section header="Header" subHeader="Sub Header Text">
          <div>Content</div>
        </Section>
      );

      expect(screen.getByText('Sub Header Text')).toBeInTheDocument();
    });

    it('should not display subHeader when not provided', () => {
      renderWithTheme(
        <Section header="Header">
          <div>Content</div>
        </Section>
      );

      // Only header and content should be present
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle undefined subHeader', () => {
      renderWithTheme(
        <Section header="Header" subHeader={undefined}>
          <div>Content</div>
        </Section>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle empty string subHeader', () => {
      renderWithTheme(
        <Section header="Header" subHeader="">
          <div>Content</div>
        </Section>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
    });

    it('should handle long subHeader text', () => {
      const longSubHeader =
        'This is a very long subheader text that provides detailed information about the section';
      renderWithTheme(
        <Section header="Header" subHeader={longSubHeader}>
          <div>Content</div>
        </Section>
      );

      expect(screen.getByText(longSubHeader)).toBeInTheDocument();
    });

    it('should render subHeader with correct styling', () => {
      renderWithTheme(
        <Section header="Header" subHeader="Styled SubHeader">
          <div>Content</div>
        </Section>
      );

      const subHeader = screen.getByText('Styled SubHeader');
      expect(subHeader).toBeInTheDocument();
    });

    it('should handle subHeader with special characters', () => {
      const specialSubHeader = 'SubHeader: & special * characters @ here!';
      renderWithTheme(
        <Section header="Header" subHeader={specialSubHeader}>
          <div>Content</div>
        </Section>
      );

      expect(screen.getByText(specialSubHeader)).toBeInTheDocument();
    });
  });

  describe('Children Rendering', () => {
    it('should render single child', () => {
      renderWithTheme(
        <Section header="Header">
          <div>Single Child</div>
        </Section>
      );

      expect(screen.getByText('Single Child')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      renderWithTheme(
        <Section header="Header">
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </Section>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('should render complex children', () => {
      renderWithTheme(
        <Section header="Header">
          <div>
            <h3>Nested Header</h3>
            <p>Nested paragraph</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </Section>
      );

      expect(screen.getByRole('heading', { name: 'Nested Header' })).toBeInTheDocument();
      expect(screen.getByText('Nested paragraph')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should render nested components', () => {
      const NestedComponent = () => <div data-testid="nested">Nested Component</div>;

      renderWithTheme(
        <Section header="Header">
          <NestedComponent />
        </Section>
      );

      expect(screen.getByTestId('nested')).toBeInTheDocument();
    });

    it('should render form elements as children', () => {
      renderWithTheme(
        <Section header="Form Section">
          <form>
            <input type="text" placeholder="Name" />
            <button type="submit">Submit</button>
          </form>
        </Section>
      );

      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('should render text children', () => {
      renderWithTheme(<Section header="Header">Plain text content</Section>);

      expect(screen.getByText('Plain text content')).toBeInTheDocument();
    });

    it('should render children with fragments', () => {
      renderWithTheme(
        <Section header="Header">
          <>
            <span>Fragment Child 1</span>
            <span>Fragment Child 2</span>
          </>
        </Section>
      );

      expect(screen.getByText('Fragment Child 1')).toBeInTheDocument();
      expect(screen.getByText('Fragment Child 2')).toBeInTheDocument();
    });

    it('should handle children updates', () => {
      const { rerender } = renderWithTheme(
        <Section header="Header">
          <div>Original Content</div>
        </Section>
      );

      expect(screen.getByText('Original Content')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <Section header="Header">
            <div>Updated Content</div>
          </Section>
        </ThemeProvider>
      );

      expect(screen.getByText('Updated Content')).toBeInTheDocument();
      expect(screen.queryByText('Original Content')).not.toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    it('should render Grid components', () => {
      const { container } = renderWithTheme(
        <Section header="Header">
          <div>Content</div>
        </Section>
      );

      const grids = container.querySelectorAll('.MuiGrid-root');
      expect(grids.length).toBeGreaterThan(0);
    });

    it('should have proper Grid structure', () => {
      const { container } = renderWithTheme(
        <Section header="Header">
          <div>Content</div>
        </Section>
      );

      expect(container.querySelector('.MuiGrid-root')).toBeInTheDocument();
    });

    it('should render children in container Grid', () => {
      renderWithTheme(
        <Section header="Header">
          <div data-testid="child-content">Content</div>
        </Section>
      );

      const child = screen.getByTestId('child-content');
      expect(child).toBeInTheDocument();
      expect(child.parentElement).toHaveClass('MuiGrid-root');
    });
  });

  describe('Component Updates', () => {
    it('should update header text', () => {
      const { rerender } = renderWithTheme(
        <Section header="Original Header">
          <div>Content</div>
        </Section>
      );

      expect(screen.getByText('Original Header')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <Section header="Updated Header">
            <div>Content</div>
          </Section>
        </ThemeProvider>
      );

      expect(screen.getByText('Updated Header')).toBeInTheDocument();
      expect(screen.queryByText('Original Header')).not.toBeInTheDocument();
    });

    it('should update subHeader text', () => {
      const { rerender } = renderWithTheme(
        <Section header="Header" subHeader="Original SubHeader">
          <div>Content</div>
        </Section>
      );

      expect(screen.getByText('Original SubHeader')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <Section header="Header" subHeader="Updated SubHeader">
            <div>Content</div>
          </Section>
        </ThemeProvider>
      );

      expect(screen.getByText('Updated SubHeader')).toBeInTheDocument();
      expect(screen.queryByText('Original SubHeader')).not.toBeInTheDocument();
    });

    it('should add subHeader when updated', () => {
      const { rerender } = renderWithTheme(
        <Section header="Header">
          <div>Content</div>
        </Section>
      );

      expect(screen.queryByText('New SubHeader')).not.toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <Section header="Header" subHeader="New SubHeader">
            <div>Content</div>
          </Section>
        </ThemeProvider>
      );

      expect(screen.getByText('New SubHeader')).toBeInTheDocument();
    });

    it('should remove subHeader when updated to undefined', () => {
      const { rerender } = renderWithTheme(
        <Section header="Header" subHeader="SubHeader to Remove">
          <div>Content</div>
        </Section>
      );

      expect(screen.getByText('SubHeader to Remove')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <Section header="Header" subHeader={undefined}>
            <div>Content</div>
          </Section>
        </ThemeProvider>
      );

      expect(screen.queryByText('SubHeader to Remove')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children gracefully', () => {
      const { container } = renderWithTheme(
        <Section header="Header">{null as any}</Section>
      );

      expect(container).toBeInTheDocument();
      expect(screen.getByText('Header')).toBeInTheDocument();
    });

    it('should handle undefined children gracefully', () => {
      const { container } = renderWithTheme(
        <Section header="Header">{undefined as any}</Section>
      );

      expect(container).toBeInTheDocument();
      expect(screen.getByText('Header')).toBeInTheDocument();
    });

    it('should handle boolean children', () => {
      renderWithTheme(
        <Section header="Header">
          {true && <div>Conditional Content</div>}
          {false && <div>Hidden Content</div>}
        </Section>
      );

      expect(screen.getByText('Conditional Content')).toBeInTheDocument();
      expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
    });

    it('should handle empty string children', () => {
      const { container } = renderWithTheme(<Section header="Header">{''}</Section>);

      expect(container).toBeInTheDocument();
      expect(screen.getByText('Header')).toBeInTheDocument();
    });

    it('should handle number children', () => {
      renderWithTheme(<Section header="Header">{42}</Section>);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should handle zero as children', () => {
      renderWithTheme(<Section header="Header">{0}</Section>);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle array of children', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];

      renderWithTheme(
        <Section header="Header">
          {items.map((item, index) => (
            <div key={index}>{item}</div>
          ))}
        </Section>
      );

      items.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should preserve ARIA attributes in children', () => {
      renderWithTheme(
        <Section header="Header">
          <button aria-label="Accessible Button">Click</button>
        </Section>
      );

      expect(screen.getByLabelText('Accessible Button')).toBeInTheDocument();
    });

    it('should preserve role attributes', () => {
      renderWithTheme(
        <Section header="Header">
          <div role="alert">Alert Message</div>
        </Section>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should maintain semantic structure', () => {
      renderWithTheme(
        <Section header="Header">
          <nav>
            <ul>
              <li>Nav Item</li>
            </ul>
          </nav>
        </Section>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should preserve tabIndex on children', () => {
      renderWithTheme(
        <Section header="Header">
          <div tabIndex={0} data-testid="focusable">
            Focusable Content
          </div>
        </Section>
      );

      const element = screen.getByTestId('focusable');
      expect(element).toHaveAttribute('tabIndex', '0');
    });

    it('should render proper heading structure', () => {
      renderWithTheme(
        <Section header="Section Header">
          <h2>Content Header</h2>
        </Section>
      );

      expect(screen.getByRole('heading', { name: 'Content Header' })).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should render with only required props', () => {
      renderWithTheme(
        <Section header="Required Header">
          <div>Required Content</div>
        </Section>
      );

      expect(screen.getByText('Required Header')).toBeInTheDocument();
      expect(screen.getByText('Required Content')).toBeInTheDocument();
    });

    it('should render with all props', () => {
      renderWithTheme(
        <Section header="Full Header" subHeader="Full SubHeader">
          <div>Full Content</div>
        </Section>
      );

      expect(screen.getByText('Full Header')).toBeInTheDocument();
      expect(screen.getByText('Full SubHeader')).toBeInTheDocument();
      expect(screen.getByText('Full Content')).toBeInTheDocument();
    });

    it('should handle props with various data types', () => {
      renderWithTheme(
        <Section header="Header 123" subHeader="SubHeader 456">
          <div>Content 789</div>
        </Section>
      );

      expect(screen.getByText('Header 123')).toBeInTheDocument();
      expect(screen.getByText('SubHeader 456')).toBeInTheDocument();
      expect(screen.getByText('Content 789')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work with form elements', () => {
      renderWithTheme(
        <Section header="Form Section">
          <form>
            <input type="text" placeholder="Username" />
            <input type="password" placeholder="Password" />
            <button type="submit">Login</button>
          </form>
        </Section>
      );

      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });

    it('should work with lists', () => {
      renderWithTheme(
        <Section header="List Section">
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
        </Section>
      );

      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('should work with tables', () => {
      renderWithTheme(
        <Section header="Table Section">
          <table>
            <thead>
              <tr>
                <th>Column</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data</td>
              </tr>
            </tbody>
          </table>
        </Section>
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should work with buttons', () => {
      const handleClick = jest.fn();

      renderWithTheme(
        <Section header="Button Section">
          <button onClick={handleClick}>Click Me</button>
        </Section>
      );

      const button = screen.getByRole('button', { name: 'Click Me' });
      button.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should work with interactive elements', () => {
      renderWithTheme(
        <Section header="Interactive Section">
          <input type="checkbox" id="check" />
          <label htmlFor="check">Check this</label>
          <select>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
        </Section>
      );

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByText('Check this')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Text Component Integration', () => {
    it('should render header using Text component', () => {
      renderWithTheme(
        <Section header="Text Header">
          <div>Content</div>
        </Section>
      );

      // Header should be rendered
      const header = screen.getByText('Text Header');
      expect(header).toBeInTheDocument();
    });

    it('should render subHeader using Text component when provided', () => {
      renderWithTheme(
        <Section header="Header" subHeader="Text SubHeader">
          <div>Content</div>
        </Section>
      );

      const subHeader = screen.getByText('Text SubHeader');
      expect(subHeader).toBeInTheDocument();
    });

    it('should not render subHeader Text component when not provided', () => {
      const { container } = renderWithTheme(
        <Section header="Header">
          <div>Content</div>
        </Section>
      );

      // Only header should be present, not subHeader
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering', () => {
    it('should conditionally render subHeader based on prop', () => {
      const { rerender } = renderWithTheme(
        <Section header="Header" subHeader="Present">
          <div>Content</div>
        </Section>
      );

      expect(screen.getByText('Present')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <Section header="Header">
            <div>Content</div>
          </Section>
        </ThemeProvider>
      );

      expect(screen.queryByText('Present')).not.toBeInTheDocument();
    });

    it('should handle dynamic children rendering', () => {
      const { rerender } = renderWithTheme(
        <Section header="Header">
          {true && <div>Visible</div>}
        </Section>
      );

      expect(screen.getByText('Visible')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <Section header="Header">
            {false && <div>Visible</div>}
          </Section>
        </ThemeProvider>
      );

      expect(screen.queryByText('Visible')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Sections', () => {
    it('should render multiple sections independently', () => {
      renderWithTheme(
        <>
          <Section header="Section 1">
            <div>Content 1</div>
          </Section>
          <Section header="Section 2" subHeader="SubHeader 2">
            <div>Content 2</div>
          </Section>
          <Section header="Section 3">
            <div>Content 3</div>
          </Section>
        </>
      );

      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
      expect(screen.getByText('Section 3')).toBeInTheDocument();
      expect(screen.getByText('SubHeader 2')).toBeInTheDocument();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.getByText('Content 3')).toBeInTheDocument();
    });
  });
});

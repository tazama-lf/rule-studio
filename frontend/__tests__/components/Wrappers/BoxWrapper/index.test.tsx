import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BoxWrapper from '../../../../src/components/Wrappers/BoxWrapper';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('BoxWrapper', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = renderWithTheme(
        <BoxWrapper>
          <div>Test Content</div>
        </BoxWrapper>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      renderWithTheme(
        <BoxWrapper>
          <div>Test Content</div>
        </BoxWrapper>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render as a Box component', () => {
      const { container } = renderWithTheme(
        <BoxWrapper>
          <div>Content</div>
        </BoxWrapper>
      );

      const box = container.firstChild;
      expect(box).toHaveClass('MuiBox-root');
    });
  });

  describe('Children Rendering', () => {
    it('should render multiple children', () => {
      renderWithTheme(
        <BoxWrapper>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </BoxWrapper>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('should render text children', () => {
      renderWithTheme(<BoxWrapper>Plain text content</BoxWrapper>);

      expect(screen.getByText('Plain text content')).toBeInTheDocument();
    });

    it('should render complex children', () => {
      renderWithTheme(
        <BoxWrapper>
          <div>
            <h1>Title</h1>
            <p>Paragraph</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </BoxWrapper>
      );

      expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should render nested components', () => {
      const NestedComponent = () => <div data-testid="nested">Nested Component</div>;

      renderWithTheme(
        <BoxWrapper>
          <NestedComponent />
        </BoxWrapper>
      );

      expect(screen.getByTestId('nested')).toBeInTheDocument();
    });

    it('should render children with fragments', () => {
      renderWithTheme(
        <BoxWrapper>
          <>
            <span>Fragment Child 1</span>
            <span>Fragment Child 2</span>
          </>
        </BoxWrapper>
      );

      expect(screen.getByText('Fragment Child 1')).toBeInTheDocument();
      expect(screen.getByText('Fragment Child 2')).toBeInTheDocument();
    });

    it('should render array of children', () => {
      const children = [
        <div key="1">Array Child 1</div>,
        <div key="2">Array Child 2</div>,
      ];

      renderWithTheme(<BoxWrapper>{children}</BoxWrapper>);

      expect(screen.getByText('Array Child 1')).toBeInTheDocument();
      expect(screen.getByText('Array Child 2')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have white background color', () => {
      const { container } = renderWithTheme(
        <BoxWrapper>
          <div>Content</div>
        </BoxWrapper>
      );

      const box = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(box);
      expect(styles.backgroundColor).toMatch(/rgb\(255,\s*255,\s*255\)|white/);
    });

    it('should have padding', () => {
      const { container } = renderWithTheme(
        <BoxWrapper>
          <div>Content</div>
        </BoxWrapper>
      );

      const box = container.firstChild as HTMLElement;
      expect(box).toHaveStyle({ padding: '24px' });
    });

    it('should have box shadow', () => {
      const { container } = renderWithTheme(
        <BoxWrapper>
          <div>Content</div>
        </BoxWrapper>
      );

      const box = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(box);
      expect(styles.boxShadow).toBeTruthy();
    });

    it('should apply MUI Box classes', () => {
      const { container } = renderWithTheme(
        <BoxWrapper>
          <div>Content</div>
        </BoxWrapper>
      );

      const box = container.firstChild;
      expect(box).toHaveClass('MuiBox-root');
    });
  });

  describe('Component Behavior', () => {
    it('should maintain children state', () => {
      const TestComponent = () => {
        const [count, setCount] = React.useState(0);
        return (
          <button onClick={() => setCount(count + 1)} data-testid="counter">
            Count: {count}
          </button>
        );
      };

      renderWithTheme(
        <BoxWrapper>
          <TestComponent />
        </BoxWrapper>
      );

      const button = screen.getByTestId('counter');
      expect(button).toHaveTextContent('Count: 0');

      act(() => {
        fireEvent.click(button);
      });
      expect(button).toHaveTextContent('Count: 1');
    });

    it('should preserve children props', () => {
      renderWithTheme(
        <BoxWrapper>
          <div data-testid="test-div" className="custom-class" id="custom-id">
            Content
          </div>
        </BoxWrapper>
      );

      const div = screen.getByTestId('test-div');
      expect(div).toHaveClass('custom-class');
      expect(div).toHaveAttribute('id', 'custom-id');
    });

    it('should not interfere with children event handlers', () => {
      const handleClick = jest.fn();

      renderWithTheme(
        <BoxWrapper>
          <button onClick={handleClick}>Click Me</button>
        </BoxWrapper>
      );

      const button = screen.getByRole('button', { name: 'Click Me' });
      button.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Memo', () => {
    it('should render consistently with same children', () => {
      const { container, rerender } = renderWithTheme(
        <BoxWrapper>
          <div>Test Content</div>
        </BoxWrapper>
      );

      const initialHTML = container.innerHTML;

      rerender(
        <ThemeProvider theme={theme}>
          <BoxWrapper>
            <div>Test Content</div>
          </BoxWrapper>
        </ThemeProvider>
      );

      expect(container.innerHTML).toBe(initialHTML);
    });

    it('should update when children change', () => {
      const { rerender } = renderWithTheme(
        <BoxWrapper>
          <div>Initial Content</div>
        </BoxWrapper>
      );

      expect(screen.getByText('Initial Content')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <BoxWrapper>
            <div>Updated Content</div>
          </BoxWrapper>
        </ThemeProvider>
      );

      expect(screen.queryByText('Initial Content')).not.toBeInTheDocument();
      expect(screen.getByText('Updated Content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string children', () => {
      const { container } = renderWithTheme(<BoxWrapper>{''}</BoxWrapper>);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle null children gracefully', () => {
      const { container } = renderWithTheme(<BoxWrapper>{null as any}</BoxWrapper>);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle undefined children gracefully', () => {
      const { container } = renderWithTheme(<BoxWrapper>{undefined as any}</BoxWrapper>);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle boolean children', () => {
      const { container } = renderWithTheme(
        <BoxWrapper>
          {true && <div>Conditional Content</div>}
        </BoxWrapper>
      );

      expect(screen.getByText('Conditional Content')).toBeInTheDocument();
    });

    it('should handle number children', () => {
      renderWithTheme(<BoxWrapper>{42}</BoxWrapper>);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should handle zero as children', () => {
      renderWithTheme(<BoxWrapper>{0}</BoxWrapper>);

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should preserve ARIA attributes on children', () => {
      renderWithTheme(
        <BoxWrapper>
          <button aria-label="Test Button">Click</button>
        </BoxWrapper>
      );

      const button = screen.getByLabelText('Test Button');
      expect(button).toBeInTheDocument();
    });

    it('should preserve role attributes', () => {
      renderWithTheme(
        <BoxWrapper>
          <div role="alert">Alert Message</div>
        </BoxWrapper>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should maintain semantic structure', () => {
      renderWithTheme(
        <BoxWrapper>
          <nav>
            <ul>
              <li>Nav Item</li>
            </ul>
          </nav>
        </BoxWrapper>
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should preserve tabIndex on children', () => {
      renderWithTheme(
        <BoxWrapper>
          <div tabIndex={0} data-testid="focusable">
            Focusable Content
          </div>
        </BoxWrapper>
      );

      const div = screen.getByTestId('focusable');
      expect(div).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Integration', () => {
    it('should work with form elements', () => {
      renderWithTheme(
        <BoxWrapper>
          <form>
            <input type="text" placeholder="Enter text" />
            <button type="submit">Submit</button>
          </form>
        </BoxWrapper>
      );

      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('should work with lists', () => {
      renderWithTheme(
        <BoxWrapper>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
        </BoxWrapper>
      );

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('should work with images', () => {
      renderWithTheme(
        <BoxWrapper>
          <img src="test.jpg" alt="Test Image" />
        </BoxWrapper>
      );

      const image = screen.getByAltText('Test Image');
      expect(image).toBeInTheDocument();
    });

    it('should work with links', () => {
      renderWithTheme(
        <BoxWrapper>
          <a href="https://example.com">Example Link</a>
        </BoxWrapper>
      );

      const link = screen.getByRole('link', { name: 'Example Link' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('should work with tables', () => {
      renderWithTheme(
        <BoxWrapper>
          <table>
            <thead>
              <tr>
                <th>Header</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data</td>
              </tr>
            </tbody>
          </table>
        </BoxWrapper>
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Content Types', () => {
    it('should render headings correctly', () => {
      renderWithTheme(
        <BoxWrapper>
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
        </BoxWrapper>
      );

      expect(screen.getByRole('heading', { level: 1, name: 'Heading 1' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Heading 2' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Heading 3' })).toBeInTheDocument();
    });

    it('should render paragraphs correctly', () => {
      renderWithTheme(
        <BoxWrapper>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </BoxWrapper>
      );

      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph')).toBeInTheDocument();
    });

    it('should render code blocks', () => {
      renderWithTheme(
        <BoxWrapper>
          <pre>
            <code>const x = 10;</code>
          </pre>
        </BoxWrapper>
      );

      expect(screen.getByText('const x = 10;')).toBeInTheDocument();
    });

    it('should render emphasized text', () => {
      renderWithTheme(
        <BoxWrapper>
          <em>Emphasized text</em>
          <strong>Strong text</strong>
        </BoxWrapper>
      );

      expect(screen.getByText('Emphasized text')).toBeInTheDocument();
      expect(screen.getByText('Strong text')).toBeInTheDocument();
    });
  });

  describe('Dynamic Content', () => {
    it('should handle conditionally rendered children', () => {
      const { rerender } = renderWithTheme(
        <BoxWrapper>
          {true && <div>Visible</div>}
          {false && <div>Hidden</div>}
        </BoxWrapper>
      );

      expect(screen.getByText('Visible')).toBeInTheDocument();
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <BoxWrapper>
            {false && <div>Visible</div>}
            {true && <div>Hidden</div>}
          </BoxWrapper>
        </ThemeProvider>
      );

      expect(screen.queryByText('Visible')).not.toBeInTheDocument();
      expect(screen.getByText('Hidden')).toBeInTheDocument();
    });

    it('should handle mapped children', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];

      renderWithTheme(
        <BoxWrapper>
          {items.map((item, index) => (
            <div key={index}>{item}</div>
          ))}
        </BoxWrapper>
      );

      items.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });

    it('should handle children updates', () => {
      const { rerender } = renderWithTheme(
        <BoxWrapper>
          <div>Original</div>
        </BoxWrapper>
      );

      expect(screen.getByText('Original')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <BoxWrapper>
            <div>Updated</div>
          </BoxWrapper>
        </ThemeProvider>
      );

      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.queryByText('Original')).not.toBeInTheDocument();
    });
  });

  describe('Container Properties', () => {
    it('should be a block-level element', () => {
      const { container } = renderWithTheme(
        <BoxWrapper>
          <div>Content</div>
        </BoxWrapper>
      );

      const box = container.firstChild as HTMLElement;
      expect(box.tagName).toBe('DIV');
    });

    it('should contain children within its boundaries', () => {
      const { container } = renderWithTheme(
        <BoxWrapper>
          <div data-testid="child">Child Element</div>
        </BoxWrapper>
      );

      const wrapper = container.firstChild as HTMLElement;
      const child = screen.getByTestId('child');

      expect(wrapper.contains(child)).toBe(true);
    });
  });
});

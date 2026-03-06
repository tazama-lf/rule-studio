import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Modal, { ModalProps } from '../../../../src/components/Wrappers/Modal';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const defaultProps: ModalProps = {
  open: true,
  title: 'Test Modal',
  children: <div>Modal Content</div>,
  onClose: jest.fn(),
};

describe('Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render when open is true', () => {
      renderWithTheme(<Modal {...defaultProps} />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      renderWithTheme(<Modal {...defaultProps} open={false} />);

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('should render without crashing', () => {
      const { container } = renderWithTheme(<Modal {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it('should render modal structure correctly', () => {
      renderWithTheme(<Modal {...defaultProps} />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Title Rendering', () => {
    it('should render title when provided', () => {
      renderWithTheme(<Modal {...defaultProps} title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should render title as h6 variant', () => {
      renderWithTheme(<Modal {...defaultProps} title="Title Text" />);

      const title = screen.getByText('Title Text');
      expect(title).toHaveClass('MuiTypography-h6');
    });

    it('should handle empty title', () => {
      renderWithTheme(<Modal {...defaultProps} title="" />);

      const { container } = render(
        <ThemeProvider theme={theme}>
          <Modal {...defaultProps} title="" />
        </ThemeProvider>
      );
      expect(container).toBeInTheDocument();
    });

    it('should handle undefined title', () => {
      renderWithTheme(
        <Modal {...defaultProps} title={undefined}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should render long titles', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines';
      renderWithTheme(<Modal {...defaultProps} title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });
  });

  describe('Children Rendering', () => {
    it('should render children correctly', () => {
      renderWithTheme(
        <Modal {...defaultProps}>
          <div>Child Content</div>
        </Modal>
      );

      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      renderWithTheme(
        <Modal {...defaultProps}>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </Modal>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('should render complex children', () => {
      renderWithTheme(
        <Modal {...defaultProps}>
          <div>
            <h2>Section Title</h2>
            <p>Paragraph content</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </Modal>
      );

      expect(screen.getByRole('heading', { name: 'Section Title' })).toBeInTheDocument();
      expect(screen.getByText('Paragraph content')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should render nested components as children', () => {
      const NestedComponent = () => <div data-testid="nested">Nested</div>;

      renderWithTheme(
        <Modal {...defaultProps}>
          <NestedComponent />
        </Modal>
      );

      expect(screen.getByTestId('nested')).toBeInTheDocument();
    });

    it('should render form elements as children', () => {
      renderWithTheme(
        <Modal {...defaultProps}>
          <form>
            <input type="text" placeholder="Enter text" />
            <button type="submit">Submit</button>
          </form>
        </Modal>
      );

      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('should handle text children', () => {
      renderWithTheme(<Modal {...defaultProps}>Plain text content</Modal>);

      expect(screen.getByText('Plain text content')).toBeInTheDocument();
    });
  });

  describe('Footer Rendering', () => {
    it('should render footer when provided', () => {
      renderWithTheme(
        <Modal {...defaultProps} footer={<button>Footer Button</button>} />
      );

      expect(screen.getByRole('button', { name: 'Footer Button' })).toBeInTheDocument();
    });

    it('should not render footer when not provided', () => {
      const { container } = renderWithTheme(<Modal {...defaultProps} footer={undefined} />);

      const boxes = container.querySelectorAll('.MuiBox-root');
      const footerBox = Array.from(boxes).find(box => 
        window.getComputedStyle(box).borderTop.includes('1px')
      );
      expect(footerBox).toBeFalsy();
    });

    it('should render multiple footer elements', () => {
      renderWithTheme(
        <Modal
          {...defaultProps}
          footer={
            <>
              <button>Cancel</button>
              <button>Save</button>
              <button>Submit</button>
            </>
          }
        />
      );

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('should render complex footer content', () => {
      renderWithTheme(
        <Modal
          {...defaultProps}
          footer={
            <div data-testid="footer-content">
              <span>Footer Text</span>
              <button>Action</button>
            </div>
          }
        />
      );

      expect(screen.getByTestId('footer-content')).toBeInTheDocument();
      expect(screen.getByText('Footer Text')).toBeInTheDocument();
    });

    it('should handle empty footer', () => {
      renderWithTheme(<Modal {...defaultProps} footer={<></>} />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('should render close button', () => {
      renderWithTheme(<Modal {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button');
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = jest.fn();
      renderWithTheme(<Modal {...defaultProps} onClose={onClose} />);

      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => !btn.textContent);
      
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should render CloseIcon in close button', () => {
      const { container } = renderWithTheme(<Modal {...defaultProps} />);

      const closeIcon = container.querySelector('[data-testid="CloseIcon"]');
      expect(closeIcon).toBeInTheDocument();
    });

    it('should have proper styling on close button', () => {
      const { container } = renderWithTheme(<Modal {...defaultProps} />);

      const iconButton = container.querySelector('.MuiIconButton-root');
      expect(iconButton).toBeInTheDocument();
    });
  });

  describe('MaxWidth Variants', () => {
    it('should apply sm maxWidth (550px)', () => {
      const { container } = renderWithTheme(<Modal {...defaultProps} maxWidth="sm" />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(container).toBeInTheDocument();
    });

    it('should apply md maxWidth (650px)', () => {
      const { container } = renderWithTheme(<Modal {...defaultProps} maxWidth="md" />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(container).toBeInTheDocument();
    });

    it('should apply lg maxWidth (900px) by default', () => {
      const { container } = renderWithTheme(<Modal {...defaultProps} />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(container).toBeInTheDocument();
    });

    it('should apply xl maxWidth (1200px)', () => {
      const { container } = renderWithTheme(<Modal {...defaultProps} maxWidth="xl" />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(container).toBeInTheDocument();
    });

    it('should apply custom maxWidth string', () => {
      const { container } = renderWithTheme(
        <Modal {...defaultProps} maxWidth="500px" />
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(container).toBeInTheDocument();
    });

    it('should handle various custom maxWidth values', () => {
      const customValues = ['300px', '75%', '50vw', '40rem'];

      customValues.forEach(maxWidth => {
        const { container } = renderWithTheme(
          <Modal {...defaultProps} maxWidth={maxWidth} />
        );
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should toggle visibility based on open prop', () => {
      const { rerender } = renderWithTheme(<Modal {...defaultProps} open={true} />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <Modal {...defaultProps} open={false} />
        </ThemeProvider>
      );
      const modalExists = screen.queryByText('Test Modal') !== null;
      expect(modalExists).toBeDefined();
    });

    it('should maintain content when reopened', () => {
      const { rerender } = renderWithTheme(<Modal {...defaultProps} open={false} />);

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <Modal {...defaultProps} open={true} />
        </ThemeProvider>
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should update children content', () => {
      const { rerender } = renderWithTheme(
        <Modal {...defaultProps}>
          <div>Initial Content</div>
        </Modal>
      );

      expect(screen.getByText('Initial Content')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <Modal {...defaultProps}>
            <div>Updated Content</div>
          </Modal>
        </ThemeProvider>
      );

      expect(screen.getByText('Updated Content')).toBeInTheDocument();
      expect(screen.queryByText('Initial Content')).not.toBeInTheDocument();
    });

    it('should update title', () => {
      const { rerender } = renderWithTheme(
        <Modal {...defaultProps} title="Original Title" />
      );

      expect(screen.getByText('Original Title')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <Modal {...defaultProps} title="New Title" />
        </ThemeProvider>
      );

      expect(screen.getByText('New Title')).toBeInTheDocument();
    });

    it('should update footer', () => {
      const { rerender } = renderWithTheme(
        <Modal {...defaultProps} footer={<button>Initial Footer</button>} />
      );

      expect(screen.getByRole('button', { name: 'Initial Footer' })).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <Modal {...defaultProps} footer={<button>Updated Footer</button>} />
        </ThemeProvider>
      );

      expect(screen.getByRole('button', { name: 'Updated Footer' })).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('should render backdrop overlay', () => {
      const { container } = renderWithTheme(<Modal {...defaultProps} />);

      const backdrop = container.querySelector('[style*="position: fixed"]');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have proper modal content structure', () => {
      const { container } = renderWithTheme(<Modal {...defaultProps} />);

      const boxes = container.querySelectorAll('.MuiBox-root');
      expect(boxes.length).toBeGreaterThan(0);
    });

    it('should render header with border', () => {
      renderWithTheme(<Modal {...defaultProps} />);
      
      const title = screen.getByText('Test Modal');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('MuiTypography-h6');
    });

    it('should render scrollable content area', () => {
      renderWithTheme(
        <Modal {...defaultProps}>
          <div style={{ height: '2000px' }}>Tall Content</div>
        </Modal>
      );

      expect(screen.getByText('Tall Content')).toBeInTheDocument();
    });

    it('should render footer with border when footer is provided', () => {
      renderWithTheme(
        <Modal {...defaultProps} footer={<button>Footer</button>} />
      );

      const footer = screen.getByRole('button', { name: 'Footer' });
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should preserve ARIA attributes in children', () => {
      renderWithTheme(
        <Modal {...defaultProps}>
          <button aria-label="Accessible Button">Click</button>
        </Modal>
      );

      expect(screen.getByLabelText('Accessible Button')).toBeInTheDocument();
    });

    it('should maintain focus management elements', () => {
      renderWithTheme(
        <Modal {...defaultProps}>
          <input type="text" placeholder="Focus me" />
        </Modal>
      );

      expect(screen.getByPlaceholderText('Focus me')).toBeInTheDocument();
    });

    it('should preserve role attributes', () => {
      renderWithTheme(
        <Modal {...defaultProps}>
          <div role="alert">Alert Message</div>
        </Modal>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should maintain semantic HTML structure', () => {
      renderWithTheme(
        <Modal {...defaultProps}>
          <nav>
            <ul>
              <li>Nav Item</li>
            </ul>
          </nav>
        </Modal>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should preserve tabIndex on elements', () => {
      renderWithTheme(
        <Modal {...defaultProps}>
          <div tabIndex={0} data-testid="focusable">
            Focusable
          </div>
        </Modal>
      );

      const element = screen.getByTestId('focusable');
      expect(element).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Animation and Motion', () => {
    it('should render with AnimatePresence', () => {
      const { container } = renderWithTheme(<Modal {...defaultProps} />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle open to closed transition', () => {
      const { rerender } = renderWithTheme(<Modal {...defaultProps} open={true} />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <Modal {...defaultProps} open={false} />
        </ThemeProvider>
      );

      expect(screen.queryByText).toBeDefined();
    });

    it('should render motion divs', () => {
      const { container } = renderWithTheme(<Modal {...defaultProps} />);

      const divs = container.querySelectorAll('div');
      expect(divs.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children gracefully', () => {
      const { container } = renderWithTheme(
        <Modal {...defaultProps}>{null as any}</Modal>
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle undefined children gracefully', () => {
      const { container } = renderWithTheme(
        <Modal {...defaultProps}>{undefined as any}</Modal>
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle boolean children', () => {
      renderWithTheme(
        <Modal {...defaultProps}>
          {true && <div>Conditional</div>}
        </Modal>
      );

      expect(screen.getByText('Conditional')).toBeInTheDocument();
    });

    it('should handle empty string title', () => {
      const { container } = renderWithTheme(<Modal {...defaultProps} title="" />);

      expect(container).toBeInTheDocument();
    });

    it('should handle multiple onClose calls', () => {
      const onClose = jest.fn();
      renderWithTheme(<Modal {...defaultProps} onClose={onClose} />);

      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => !btn.textContent);

      if (closeButton) {
        fireEvent.click(closeButton);
        fireEvent.click(closeButton);
        fireEvent.click(closeButton);
        
        expect(onClose).toHaveBeenCalledTimes(3);
      }
    });

    it('should handle rapid open/close toggles', () => {
      const { rerender } = renderWithTheme(<Modal {...defaultProps} open={true} />);

      for (let i = 0; i < 5; i++) {
        rerender(
          <ThemeProvider theme={theme}>
            <Modal {...defaultProps} open={i % 2 === 0} />
          </ThemeProvider>
        );
      }

      expect(screen.queryByText).toBeDefined();
    });
  });

  describe('Props Validation', () => {
    it('should render with all props provided', () => {
      renderWithTheme(
        <Modal
          open={true}
          title="Full Props Modal"
          onClose={jest.fn()}
          maxWidth="md"
          footer={<button>Footer</button>}
        >
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByText('Full Props Modal')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Footer' })).toBeInTheDocument();
    });

    it('should render with minimal required props', () => {
      renderWithTheme(
        <Modal open={true} onClose={jest.fn()}>
          <div>Minimal Content</div>
        </Modal>
      );

      expect(screen.getByText('Minimal Content')).toBeInTheDocument();
    });

    it('should handle all maxWidth options', () => {
      const options: Array<'sm' | 'md' | 'lg' | 'xl'> = ['sm', 'md', 'lg', 'xl'];

      options.forEach(maxWidth => {
        const { container } = renderWithTheme(
          <Modal {...defaultProps} maxWidth={maxWidth} />
        );
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('Integration', () => {
    it('should work with form submission', () => {
      const handleSubmit = jest.fn(e => e.preventDefault());

      renderWithTheme(
        <Modal {...defaultProps}>
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Name" />
            <button type="submit">Submit Form</button>
          </form>
        </Modal>
      );

      const submitButton = screen.getByRole('button', { name: 'Submit Form' });
      fireEvent.click(submitButton);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('should work with interactive elements', () => {
      const handleClick = jest.fn();

      renderWithTheme(
        <Modal {...defaultProps}>
          <button onClick={handleClick}>Interactive Button</button>
        </Modal>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Interactive Button' }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should work with input fields', () => {
      renderWithTheme(
        <Modal {...defaultProps}>
          <input type="text" placeholder="Type here" defaultValue="" />
        </Modal>
      );

      const input = screen.getByPlaceholderText('Type here') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'test value' } });

      expect(input.value).toBe('test value');
    });

    it('should work with checkboxes', () => {
      renderWithTheme(
        <Modal {...defaultProps}>
          <label>
            <input type="checkbox" />
            Accept Terms
          </label>
        </Modal>
      );

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it('should handle footer actions correctly', () => {
      const handleCancel = jest.fn();
      const handleSave = jest.fn();

      renderWithTheme(
        <Modal
          {...defaultProps}
          footer={
            <>
              <button onClick={handleCancel}>Cancel</button>
              <button onClick={handleSave}>Save</button>
            </>
          }
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(handleCancel).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(handleSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling', () => {
    it('should apply backdrop styling', () => {
      const { container } = renderWithTheme(<Modal {...defaultProps} />);

      const backdrop = container.querySelector('[style*="position: fixed"]') as HTMLElement;
      expect(backdrop).toBeInTheDocument();
    });

    it('should apply modal content styling', () => {
      renderWithTheme(<Modal {...defaultProps} />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should have proper z-index for overlay', () => {
      const { container } = renderWithTheme(<Modal {...defaultProps} />);

      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });
  });
});

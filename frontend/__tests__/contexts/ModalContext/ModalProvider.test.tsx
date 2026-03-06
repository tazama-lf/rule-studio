import React, { act } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ModalProvider } from '../../../src/contexts/ModalContext/ModalProvider';
import { useModal } from '../../../src/contexts/ModalContext/useModal';

jest.mock('../../../src/components/Wrappers/Modal', () => ({
  __esModule: true,
  default: ({ open, title, children, footer, onClose }: any) => (
    open ? (
      <div data-testid="modal">
        {title && <div data-testid="modal-title">{title}</div>}
        <div data-testid="modal-content">{children}</div>
        {footer && <div data-testid="modal-footer">{footer}</div>}
        <button onClick={onClose} data-testid="modal-close">Close</button>
      </div>
    ) : null
  ),
}));

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const TestComponent = () => {
  const { open, close } = useModal();

  return (
    <div>
      <button
        onClick={() =>
          open(
            'Test Modal',
            <div>Modal Content</div>,
            <button onClick={close}>Footer Button</button>
          )
        }
      >
        Open Modal
      </button>
      <button
        onClick={() =>
          open('Simple Modal', <div>Simple Content</div>)
        }
      >
        Open Simple
      </button>
      <button onClick={close}>Close Modal</button>
    </div>
  );
};

describe('ModalProvider', () => {
  describe('Basic Rendering', () => {
    it('should render children correctly', () => {
      renderWithTheme(
        <ModalProvider>
          <div>Child Content</div>
        </ModalProvider>
      );

      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should render without crashing', () => {
      const { container } = renderWithTheme(
        <ModalProvider>
          <div>Test</div>
        </ModalProvider>
      );

      expect(container).toBeInTheDocument();
    });

    it('should not show modal initially', () => {
      renderWithTheme(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should render multiple children', () => {
      renderWithTheme(
        <ModalProvider>
          <div>Child 1</div>
          <div>Child 2</div>
        </ModalProvider>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('Modal Opening', () => {
    it('should open modal with title and content', async () => {
      renderWithTheme(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open Modal'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByTestId('modal-title')).toHaveTextContent('Test Modal');
        expect(screen.getByTestId('modal-content')).toHaveTextContent('Modal Content');
      });
    });

    it('should open modal without footer', async () => {
      renderWithTheme(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open Simple'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal-title')).toHaveTextContent('Simple Modal');
        expect(screen.queryByTestId('modal-footer')).not.toBeInTheDocument();
      });
    });

    it('should display footer when provided', async () => {
      renderWithTheme(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open Modal'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal-footer')).toBeInTheDocument();
      });
    });

    it('should render modal content correctly', async () => {
      renderWithTheme(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open Modal'));
      });

      await waitFor(() => {
        const content = screen.getByTestId('modal-content');
        expect(content).toBeInTheDocument();
      });
    });

    it('should show modal when open is called', async () => {
      renderWithTheme(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();

      act(() => {
        fireEvent.click(screen.getByText('Open Modal'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Closing', () => {
    it('should close modal using context close function', async () => {
      renderWithTheme(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open Modal'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      act(() => {
        fireEvent.click(screen.getByText('Close Modal'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });

    it('should close modal using onClose from Modal component', async () => {
      renderWithTheme(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open Modal'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      act(() => {
        fireEvent.click(screen.getByTestId('modal-close'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });

    it('should remove modal from DOM when closed', async () => {
      renderWithTheme(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open Modal'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      act(() => {
        fireEvent.click(screen.getByTestId('modal-close'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('modal-title')).not.toBeInTheDocument();
        expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Modal Content Updates', () => {
    it('should update modal content when opened again', async () => {
      renderWithTheme(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      // Open first modal
      act(() => {
        fireEvent.click(screen.getByText('Open Modal'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal-title')).toHaveTextContent('Test Modal');
      });

      // Close it
      act(() => {
        fireEvent.click(screen.getByTestId('modal-close'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });

      // Open different modal
      act(() => {
        fireEvent.click(screen.getByText('Open Simple'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal-title')).toHaveTextContent('Simple Modal');
      });
    });

    it('should update title correctly', async () => {
      const DynamicTitle = () => {
        const { open } = useModal();
        const [title, setTitle] = React.useState('First Title');

        return (
          <div>
            <button onClick={() => open(title, <div>Content</div>)}>
              Open
            </button>
            <button onClick={() => setTitle('Second Title')}>
              Change Title
            </button>
          </div>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <DynamicTitle />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal-title')).toHaveTextContent('First Title');
      });
    });

    it('should update content correctly', async () => {
      const DynamicContent = () => {
        const { open, close } = useModal();

        return (
          <div>
            <button onClick={() => open('Title', <div>First Content</div>)}>
              Open First
            </button>
            <button onClick={() => open('Title', <div>Second Content</div>)}>
              Open Second
            </button>
            <button onClick={close}>Close</button>
          </div>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <DynamicContent />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open First'));
      });

      await waitFor(() => {
        expect(screen.getByText('First Content')).toBeInTheDocument();
      });

      act(() => {
        fireEvent.click(screen.getAllByText('Close')[0]);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });

      act(() => {
        fireEvent.click(screen.getByText('Open Second'));
      });

      await waitFor(() => {
        expect(screen.getByText('Second Content')).toBeInTheDocument();
      });
    });
  });

  describe('Context Value', () => {
    it('should provide open and close functions', () => {
      const TestContextValue = () => {
        const modal = useModal();

        return (
          <div>
            <div data-testid="has-open">{typeof modal.open}</div>
            <div data-testid="has-close">{typeof modal.close}</div>
          </div>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <TestContextValue />
        </ModalProvider>
      );

      expect(screen.getByTestId('has-open')).toHaveTextContent('function');
      expect(screen.getByTestId('has-close')).toHaveTextContent('function');
    });

    it('should provide correct function types', () => {
      const TestFunctions = () => {
        const { open, close } = useModal();

        return (
          <div>
            <div data-testid="open-type">{typeof open}</div>
            <div data-testid="close-type">{typeof close}</div>
          </div>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <TestFunctions />
        </ModalProvider>
      );

      expect(screen.getByTestId('open-type')).toHaveTextContent('function');
      expect(screen.getByTestId('close-type')).toHaveTextContent('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null content', async () => {
      const NullContent = () => {
        const { open } = useModal();

        return (
          <button onClick={() => open('Title', null)}>
            Open Null
          </button>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <NullContent />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open Null'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal-title')).toHaveTextContent('Title');
        expect(screen.getByTestId('modal-content')).toBeInTheDocument();
      });
    });

    it('should handle empty title', async () => {
      const EmptyTitle = () => {
        const { open } = useModal();

        return (
          <button onClick={() => open('', <div>Content</div>)}>
            Open Empty Title
          </button>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <EmptyTitle />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open Empty Title'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal-content')).toHaveTextContent('Content');
        expect(screen.queryByTestId('modal-title')).not.toBeInTheDocument();
      });
    });

    it('should handle string content', async () => {
      const StringContent = () => {
        const { open } = useModal();

        return (
          <button onClick={() => open('Title', 'String content' as any)}>
            Open String
          </button>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <StringContent />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open String'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal-content')).toHaveTextContent('String content');
      });
    });

    it('should handle number content', async () => {
      const NumberContent = () => {
        const { open } = useModal();

        return (
          <button onClick={() => open('Title', 42 as any)}>
            Open Number
          </button>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <NumberContent />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open Number'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal-content')).toHaveTextContent('42');
      });
    });

    it('should handle multiple close calls', async () => {
      renderWithTheme(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open Modal'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      act(() => {
        fireEvent.click(screen.getByText('Close Modal'));
        fireEvent.click(screen.getByText('Close Modal'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Modal Props', () => {
    it('should pass props to modal', async () => {
      const PropsTest = () => {
        const { open } = useModal();

        return (
          <button
            onClick={() =>
              open('Title', <div>Content</div>, null, { maxWidth: 'xl' })
            }
          >
            Open with Props
          </button>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <PropsTest />  
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open with Props'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
    });

    it(' should work without optional props', async () => {
      const NoProps = () => {
        const { open } = useModal();

        return (
          <button onClick={() => open('Title', <div>Content</div>)}>
            Open No Props
          </button>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <NoProps />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open No Props'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
    });

    it('should work with undefined props', async () => {
      const UndefinedProps = () => {
        const { open } = useModal();

        return (
          <button onClick={() => open('Title', <div>Content</div>, undefined, undefined)}>
            Open Undefined Props
          </button>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <UndefinedProps />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open Undefined Props'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
    });
  });

  describe('Footer Handling', () => {
    it('should display footer when provided', async () => {
      const FooterTest = () => {
        const { open, close } = useModal();

        return (
          <button
            onClick={() =>
              open(
                'Title',
                <div>Content</div>,
                <button onClick={close}>Custom Footer</button>
              )
            }
          >
            Open with Footer
          </button>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <FooterTest />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open with Footer'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal-footer')).toBeInTheDocument();
        expect(screen.getByText('Custom Footer')).toBeInTheDocument();
      });
    });

    it('should not display footer when null', async () => {
      const NoFooter = () => {
        const { open } = useModal();

        return (
          <button onClick={() => open('Title', <div>Content</div>, null)}>
            Open No Footer
          </button>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <NoFooter />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open No Footer'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.queryByTestId('modal-footer')).not.toBeInTheDocument();
      });
    });

    it('should not display footer when undefined', async () => {
      const UndefinedFooter = () => {
        const { open } = useModal();

        return (
          <button onClick={() => open('Title', <div>Content</div>)}>
            Open Undefined Footer
          </button>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <UndefinedFooter />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open Undefined Footer'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('modal-footer')).not.toBeInTheDocument();
      });
    });
  });

  describe('Integration', () => {
    it('should work with complex content', async () => {
      const ComplexContent = () => {
        const { open } = useModal();

        return (
          <button
            onClick={() =>
              open(
                'Complex Modal',
                <div>
                  <h3>Complex Content</h3>
                  <p>Paragraph</p>
                  <ul>
                    <li>Item 1</li>
                    <li>Item 2</li>
                  </ul>
                </div>
              )
            }
          >
            Open Complex
          </button>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <ComplexContent />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open Complex'));
      });

      await waitFor(() => {
        expect(screen.getByText('Complex Content')).toBeInTheDocument();
        expect(screen.getByText('Paragraph')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
      });
    });

    it('should handle nested components', async () => {
      const NestedComponent = () => <div data-testid="nested">Nested</div>;

      const NestedModal = () => {
        const { open } = useModal();

        return (
          <button onClick={() => open('Title', <NestedComponent />)}>
            Open Nested
          </button>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <NestedModal />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open Nested'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('nested')).toBeInTheDocument();
      });
    });

    it('should work with forms in content', async () => {
      const FormContent = () => {
        const { open } = useModal();

        return (
          <button
            onClick={() =>
              open(
                'Form Modal',
                <form data-testid="modal-form">
                  <input type="text" placeholder="Name" />
                  <button type="submit">Submit</button>
                </form>
              )
            }
          >
            Open Form
          </button>
        );
      };

      renderWithTheme(
        <ModalProvider>
          <FormContent />
        </ModalProvider>
      );

      act(() => {
        fireEvent.click(screen.getByText('Open Form'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal-form')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      });
    });
  });
});

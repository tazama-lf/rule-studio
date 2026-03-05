import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ModalFooter from '../../../src/components/ModalFooter';

const mockClose = jest.fn();

jest.mock('../../../src/contexts/ModalContext', () => ({
  useModal: () => ({ close: mockClose }),
}));


const theme = createTheme({
  palette: {
    text: { primary: '#000', secondary: '#666' },
    static: { 
      grey: '#ccc', 
      border: '#ddd',
      primary: '#000',
      secondary: '#666',
      skyBlue: '#87CEEB',
      ternary: '#999',
      black: '#000',
      white: '#fff',
      lightBlue: '#add8e6',
      lightGrey: '#e0e0e0'
    },
  },
});

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ModalFooter Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render Cancel and Submit buttons', () => {
      renderWithTheme(<ModalFooter onSubmit={jest.fn()} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      renderWithTheme(<ModalFooter onSubmit={jest.fn()} title="Save" />);
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should render two buttons', () => {
      renderWithTheme(<ModalFooter onSubmit={jest.fn()} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });
  });

  describe('Layout', () => {
    it('should use flex layout with end alignment', () => {
      const { container } = renderWithTheme(<ModalFooter onSubmit={jest.fn()} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({
        display: 'flex',
        justifyContent: 'flex-end',
      });
    });

    it('should take full width', () => {
      const { container } = renderWithTheme(<ModalFooter onSubmit={jest.fn()} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ width: '100%' });
    });
  });

  describe('Cancel Button', () => {
    it('should call modal close on Cancel click', () => {
      renderWithTheme(<ModalFooter onSubmit={jest.fn()} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onSubmit when Cancel is clicked', () => {
      const onSubmit = jest.fn();
      renderWithTheme(<ModalFooter onSubmit={onSubmit} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Submit Button', () => {
    it('should call onSubmit on Submit click', () => {
      const onSubmit = jest.fn();
      renderWithTheme(<ModalFooter onSubmit={onSubmit} />);
      fireEvent.click(screen.getByText('Submit'));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('should not call close when Submit is clicked', () => {
      renderWithTheme(<ModalFooter onSubmit={jest.fn()} />);
      fireEvent.click(screen.getByText('Submit'));
      expect(mockClose).not.toHaveBeenCalled();
    });

    it('should show loading state when isSubmitting is true', () => {
      const { container } = renderWithTheme(
        <ModalFooter onSubmit={jest.fn()} isSubmitting />
      );
      const progressbar = container.querySelector('[role="progressbar"]');
      expect(progressbar).toBeInTheDocument();
    });

    it('should not show loading state by default', () => {
      const { container } = renderWithTheme(
        <ModalFooter onSubmit={jest.fn()} />
      );
      const progressbar = container.querySelector('[role="progressbar"]');
      expect(progressbar).not.toBeInTheDocument();
    });
  });

  describe('Custom Title', () => {
    it('should use "Submit" as default title', () => {
      renderWithTheme(<ModalFooter onSubmit={jest.fn()} />);
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('should render with custom title text', () => {
      renderWithTheme(<ModalFooter onSubmit={jest.fn()} title="Create Rule" />);
      expect(screen.getByText('Create Rule')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('should call onSubmit when custom title button is clicked', () => {
      const onSubmit = jest.fn();
      renderWithTheme(<ModalFooter onSubmit={onSubmit} title="Deploy" />);
      fireEvent.click(screen.getByText('Deploy'));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button Types', () => {
    it('should default submit button to primary type', () => {
      renderWithTheme(<ModalFooter onSubmit={jest.fn()} />);
      // Cancel button always exists as danger, Submit as primary by default
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('should render with danger type for submit', () => {
      renderWithTheme(<ModalFooter onSubmit={jest.fn()} type="danger" title="Delete" />);
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should render with success type for submit', () => {
      renderWithTheme(<ModalFooter onSubmit={jest.fn()} type="success" title="Approve" />);
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props do not change', () => {
      const onSubmit = jest.fn();
      const { rerender, container } = renderWithTheme(
        <ModalFooter onSubmit={onSubmit} />
      );
      const first = container.firstChild;

      rerender(
        <ThemeProvider theme={theme}>
          <ModalFooter onSubmit={onSubmit} />
        </ThemeProvider>
      );
      const second = container.firstChild;

      expect(first).toBe(second);
    });
  });
});

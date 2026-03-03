import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Loader from '../../../src/components/Loader';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('Loader Component', () => {
  describe('Basic Rendering', () => {
    it('should render a CircularProgress', () => {
      renderWithTheme(<Loader />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Size', () => {
    it('should use default size of 24', () => {
      renderWithTheme(<Loader />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveStyle({ width: '24px', height: '24px' });
    });

    it('should apply custom size', () => {
      renderWithTheme(<Loader size={48} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveStyle({ width: '48px', height: '48px' });
    });

    it('should apply small size', () => {
      renderWithTheme(<Loader size={16} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveStyle({ width: '16px', height: '16px' });
    });
  });

  describe('Color', () => {
    it('should use primary color by default', () => {
      const { container } = renderWithTheme(<Loader />);
      const progress = container.querySelector('.MuiCircularProgress-root');
      expect(progress).toHaveClass('MuiCircularProgress-colorPrimary');
    });

    it('should apply secondary color', () => {
      const { container } = renderWithTheme(<Loader color="secondary" />);
      const progress = container.querySelector('.MuiCircularProgress-root');
      expect(progress).toHaveClass('MuiCircularProgress-colorSecondary');
    });

    it('should apply success color', () => {
      const { container } = renderWithTheme(<Loader color="success" />);
      const progress = container.querySelector('.MuiCircularProgress-root');
      expect(progress).toHaveClass('MuiCircularProgress-colorSuccess');
    });

    it('should apply error color', () => {
      const { container } = renderWithTheme(<Loader color="error" />);
      const progress = container.querySelector('.MuiCircularProgress-root');
      expect(progress).toHaveClass('MuiCircularProgress-colorError');
    });

    it('should apply warning color', () => {
      const { container } = renderWithTheme(<Loader color="warning" />);
      const progress = container.querySelector('.MuiCircularProgress-root');
      expect(progress).toHaveClass('MuiCircularProgress-colorWarning');
    });

    it('should apply inherit color', () => {
      const { container } = renderWithTheme(<Loader color="inherit" />);
      const progress = container.querySelector('.MuiCircularProgress-root');
      expect(progress).toHaveClass('MuiCircularProgress-colorInherit');
    });
  });

  describe('Center', () => {
    it('should not wrap in centering Box by default', () => {
      const { container } = renderWithTheme(<Loader />);
      // The root element should be the CircularProgress itself, not a Box
      expect(container.firstChild).toHaveClass('MuiCircularProgress-root');
    });

    it('should wrap in centering Box when center is true', () => {
      const { container } = renderWithTheme(<Loader center />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('MuiBox-root');
      expect(wrapper).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      });
    });

    it('should still render CircularProgress inside centered Box', () => {
      renderWithTheme(<Loader center />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Type', () => {
    it('should use spinner type by default', () => {
      const { container } = renderWithTheme(<Loader />);
      const circle = container.querySelector('circle');
      expect(circle).toBeInTheDocument();
      const spinnerWidth = circle!.getAttribute('stroke-width');
      expect(Number(spinnerWidth)).toBeGreaterThan(0);
    });

    it('should have different thickness for circular vs spinner type', () => {
      const { container: spinnerContainer } = renderWithTheme(<Loader type="spinner" />);
      const { container: circularContainer } = renderWithTheme(<Loader type="circular" />);
      const spinnerWidth = spinnerContainer.querySelector('circle')!.getAttribute('stroke-width');
      const circularWidth = circularContainer.querySelector('circle')!.getAttribute('stroke-width');
      // spinner has thickness 5, circular has thickness 4 → different stroke-widths
      expect(spinnerWidth).not.toBe(circularWidth);
    });

    it('should render circular type', () => {
      renderWithTheme(<Loader type="circular" />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should render centered with custom size and color', () => {
      const { container } = renderWithTheme(
        <Loader size={40} color="error" center type="circular" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('MuiBox-root');

      const progress = container.querySelector('.MuiCircularProgress-root');
      expect(progress).toHaveClass('MuiCircularProgress-colorError');

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveStyle({ width: '40px', height: '40px' });

      const circle = container.querySelector('circle');
      expect(circle).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props do not change', () => {
      const { rerender, container } = renderWithTheme(<Loader />);
      const first = container.querySelector('.MuiCircularProgress-root');

      rerender(
        <ThemeProvider theme={theme}>
          <Loader />
        </ThemeProvider>
      );
      const second = container.querySelector('.MuiCircularProgress-root');

      expect(first).toBe(second);
    });
  });
});

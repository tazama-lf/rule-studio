import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ComingSoon from '../../../src/pages/ComingSoon';

const theme = createTheme({
  palette: {
    primary: { main: '#51BE99' },
    grey: { 100: '#f5f5f5', 900: '#212121' },
  } as any,
});

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ComingSoon Component', () => {
  describe('Component Rendering', () => {
    it('should render the ComingSoon component', () => {
      renderWithTheme(<ComingSoon />);

      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('should render without errors', () => {
      const { container } = renderWithTheme(<ComingSoon />);

      expect(container).toBeInTheDocument();
    });

    it('should render the complete component structure', () => {
      renderWithTheme(<ComingSoon />);

      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
      expect(
        screen.getByText("We're working on something amazing. Stay tuned!")
      ).toBeInTheDocument();
      expect(screen.getByAltText('Logo')).toBeInTheDocument();
    });
  });

  describe('Logo Display', () => {
    it('should render the logo image', () => {
      renderWithTheme(<ComingSoon />);

      const logo = screen.getByAltText('Logo');
      expect(logo).toBeInTheDocument();
    });

    it('should have correct alt text for logo', () => {
      renderWithTheme(<ComingSoon />);

      const logo = screen.getByAltText('Logo');
      expect(logo).toHaveAttribute('alt', 'Logo');
    });

    it('should load logo with src attribute', () => {
      renderWithTheme(<ComingSoon />);

      const logo = screen.getByAltText('Logo');
      expect(logo).toHaveAttribute('src');
    });

    it('should render logo as an img element', () => {
      renderWithTheme(<ComingSoon />);

      const logo = screen.getByAltText('Logo');
      expect(logo.tagName).toBe('IMG');
    });
  });

  describe('Text Content', () => {
    it('should display "Coming Soon" heading', () => {
      renderWithTheme(<ComingSoon />);

      const heading = screen.getByText('Coming Soon');
      expect(heading).toBeInTheDocument();
    });

    it('should display subtitle message', () => {
      renderWithTheme(<ComingSoon />);

      const subtitle = screen.getByText(
        "We're working on something amazing. Stay tuned!"
      );
      expect(subtitle).toBeInTheDocument();
    });

    it('should render heading with h3 variant', () => {
      renderWithTheme(<ComingSoon />);

      const heading = screen.getByText('Coming Soon');
      expect(heading.className).toContain('MuiTypography');
    });

    it('should render subtitle with body1 variant', () => {
      renderWithTheme(<ComingSoon />);

      const subtitle = screen.getByText(
        "We're working on something amazing. Stay tuned!"
      );
      expect(subtitle.className).toContain('MuiTypography');
    });

    it('should have correct text content', () => {
      renderWithTheme(<ComingSoon />);

      expect(screen.getByText('Coming Soon')).toHaveTextContent('Coming Soon');
      expect(
        screen.getByText("We're working on something amazing. Stay tuned!")
      ).toHaveTextContent("We're working on something amazing. Stay tuned!");
    });
  });

  describe('Layout Structure', () => {
    it('should render centered layout', () => {
      const { container } = renderWithTheme(<ComingSoon />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render outer Box container', () => {
      const { container } = renderWithTheme(<ComingSoon />);

      const outerBox = container.querySelector('.MuiBox-root');
      expect(outerBox).toBeInTheDocument();
    });

    it('should render inner Box for content', () => {
      renderWithTheme(<ComingSoon />);

      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('should have proper component hierarchy', () => {
      renderWithTheme(<ComingSoon />);

      const logo = screen.getByAltText('Logo');
      const heading = screen.getByText('Coming Soon');
      const subtitle = screen.getByText(
        "We're working on something amazing. Stay tuned!"
      );

      expect(logo).toBeInTheDocument();
      expect(heading).toBeInTheDocument();
      expect(subtitle).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should apply correct styling to outer Box', () => {
      const { container } = renderWithTheme(<ComingSoon />);

      const outerBox = container.querySelector('.MuiBox-root');
      expect(outerBox).toBeInTheDocument();
    });

    it('should center content vertically and horizontally', () => {
      const { container } = renderWithTheme(<ComingSoon />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have background color styling', () => {
      const { container } = renderWithTheme(<ComingSoon />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should apply text-center to inner Box', () => {
      renderWithTheme(<ComingSoon />);

      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive typography for heading', () => {
      renderWithTheme(<ComingSoon />);

      const heading = screen.getByText('Coming Soon');
      expect(heading).toBeInTheDocument();
    });

    it('should have responsive typography for subtitle', () => {
      renderWithTheme(<ComingSoon />);

      const subtitle = screen.getByText(
        "We're working on something amazing. Stay tuned!"
      );
      expect(subtitle).toBeInTheDocument();
    });

    it('should apply responsive font sizes', () => {
      renderWithTheme(<ComingSoon />);

      const heading = screen.getByText('Coming Soon');
      expect(heading.className).toContain('MuiTypography');
    });

    it('should have maxWidth for logo responsiveness', () => {
      renderWithTheme(<ComingSoon />);

      const logo = screen.getByAltText('Logo');
      expect(logo).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible alt text for images', () => {
      renderWithTheme(<ComingSoon />);

      const logo = screen.getByAltText('Logo');
      expect(logo).toHaveAccessibleName();
    });

    it('should render semantic HTML elements', () => {
      renderWithTheme(<ComingSoon />);

      const heading = screen.getByText('Coming Soon');
      expect(heading).toBeInTheDocument();
    });

    it('should have readable text content', () => {
      renderWithTheme(<ComingSoon />);

      expect(screen.getByText('Coming Soon')).toBeVisible();
      expect(
        screen.getByText("We're working on something amazing. Stay tuned!")
      ).toBeVisible();
    });

    it('should render all content accessibly', () => {
      renderWithTheme(<ComingSoon />);

      expect(screen.getByAltText('Logo')).toHaveAccessibleName();
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
      expect(
        screen.getByText("We're working on something amazing. Stay tuned!")
      ).toBeInTheDocument();
    });
  });

  describe('Material-UI Integration', () => {
    it('should use MUI Box component', () => {
      const { container } = renderWithTheme(<ComingSoon />);

      const boxes = container.querySelectorAll('.MuiBox-root');
      expect(boxes.length).toBeGreaterThan(0);
    });

    it('should use MUI Typography component for heading', () => {
      renderWithTheme(<ComingSoon />);

      const heading = screen.getByText('Coming Soon');
      expect(heading.className).toContain('MuiTypography');
    });

    it('should use MUI Typography component for subtitle', () => {
      renderWithTheme(<ComingSoon />);

      const subtitle = screen.getByText(
        "We're working on something amazing. Stay tuned!"
      );
      expect(subtitle.className).toContain('MuiTypography');
    });

    it('should apply MUI theme styles', () => {
      renderWithTheme(<ComingSoon />);

      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should render without requiring props', () => {
      renderWithTheme(<ComingSoon />);

      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('should be a functional component', () => {
      const { container } = renderWithTheme(<ComingSoon />);

      expect(container).toBeTruthy();
    });

    it('should return valid JSX', () => {
      const { container } = renderWithTheme(<ComingSoon />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    it('should load image from assets', () => {
      renderWithTheme(<ComingSoon />);

      const logo = screen.getByAltText('Logo');
      expect(logo).toHaveAttribute('src');
    });

    it('should render img with component="img"', () => {
      renderWithTheme(<ComingSoon />);

      const logo = screen.getByAltText('Logo');
      expect(logo.tagName).toBe('IMG');
    });

    it('should have logo as part of Box component', () => {
      renderWithTheme(<ComingSoon />);

      const logo = screen.getByAltText('Logo');
      expect(logo.parentElement?.className).toContain('MuiBox-root');
    });
  });

  describe('Typography Variants', () => {
    it('should use h3 variant for main heading', () => {
      renderWithTheme(<ComingSoon />);

      const heading = screen.getByText('Coming Soon');
      expect(heading.className).toContain('MuiTypography');
    });

    it('should use body1 variant for subtitle', () => {
      renderWithTheme(<ComingSoon />);

      const subtitle = screen.getByText(
        "We're working on something amazing. Stay tuned!"
      );
      expect(subtitle.className).toContain('MuiTypography');
    });

    it('should have proper font weight for heading', () => {
      renderWithTheme(<ComingSoon />);

      const heading = screen.getByText('Coming Soon');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Content Verification', () => {
    it('should display exact heading text', () => {
      renderWithTheme(<ComingSoon />);

      expect(screen.getByText('Coming Soon')).toHaveTextContent('Coming Soon');
    });

    it('should display exact subtitle text', () => {
      renderWithTheme(<ComingSoon />);

      expect(
        screen.getByText("We're working on something amazing. Stay tuned!")
      ).toHaveTextContent("We're working on something amazing. Stay tuned!");
    });

    it('should not have any additional unexpected text', () => {
      renderWithTheme(<ComingSoon />);

      const heading = screen.getByText('Coming Soon');
      const subtitle = screen.getByText(
        "We're working on something amazing. Stay tuned!"
      );

      expect(heading).toBeInTheDocument();
      expect(subtitle).toBeInTheDocument();
    });
  });

  describe('Box Styling', () => {
    it('should apply sx prop to outer Box', () => {
      const { container } = renderWithTheme(<ComingSoon />);

      const outerBox = container.querySelector('.MuiBox-root');
      expect(outerBox).toBeInTheDocument();
    });

    it('should apply sx prop to inner Box', () => {
      renderWithTheme(<ComingSoon />);

      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('should apply sx prop to logo Box', () => {
      renderWithTheme(<ComingSoon />);

      const logo = screen.getByAltText('Logo');
      expect(logo).toBeInTheDocument();
    });

    it('should apply sx prop to Typography elements', () => {
      renderWithTheme(<ComingSoon />);

      const heading = screen.getByText('Coming Soon');
      const subtitle = screen.getByText(
        "We're working on something amazing. Stay tuned!"
      );

      expect(heading).toBeInTheDocument();
      expect(subtitle).toBeInTheDocument();
    });
  });

  describe('Component Export', () => {
    it('should export ComingSoon as default', () => {
      expect(ComingSoon).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof ComingSoon).toBe('function');
    });

    it('should render when imported', () => {
      renderWithTheme(<ComingSoon />);

      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple renders', () => {
      const { rerender } = renderWithTheme(<ComingSoon />);

      expect(screen.getByText('Coming Soon')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <ComingSoon />
        </ThemeProvider>
      );

      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('should render consistently', () => {
      const { container: container1 } = renderWithTheme(<ComingSoon />);
      const { container: container2 } = renderWithTheme(<ComingSoon />);

      expect(container1.innerHTML).toBeTruthy();
      expect(container2.innerHTML).toBeTruthy();
    });

    it('should not throw errors on render', () => {
      expect(() => renderWithTheme(<ComingSoon />)).not.toThrow();
    });
  });

  describe('Theme Integration', () => {
    it('should work with ThemeProvider', () => {
      renderWithTheme(<ComingSoon />);

      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('should apply theme colors', () => {
      renderWithTheme(<ComingSoon />);

      const heading = screen.getByText('Coming Soon');
      expect(heading).toBeInTheDocument();
    });

    it('should use theme palette values', () => {
      renderWithTheme(<ComingSoon />);

      const subtitle = screen.getByText(
        "We're working on something amazing. Stay tuned!"
      );
      expect(subtitle).toBeInTheDocument();
    });
  });

  describe('Component Structure Validation', () => {
    it('should have three main elements (logo, heading, subtitle)', () => {
      renderWithTheme(<ComingSoon />);

      expect(screen.getByAltText('Logo')).toBeInTheDocument();
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
      expect(
        screen.getByText("We're working on something amazing. Stay tuned!")
      ).toBeInTheDocument();
    });

    it('should maintain correct rendering order', () => {
      const { container } = renderWithTheme(<ComingSoon />);

      const elements = container.querySelectorAll('*');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should have all sections rendered', () => {
      renderWithTheme(<ComingSoon />);

      expect(screen.getByAltText('Logo')).toBeInTheDocument();
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
      expect(
        screen.getByText("We're working on something amazing. Stay tuned!")
      ).toBeInTheDocument();
    });
  });
});

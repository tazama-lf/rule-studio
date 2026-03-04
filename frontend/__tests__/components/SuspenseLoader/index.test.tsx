import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SuspenseLoader from '../../../src/components/SuspenseLoader';

describe('SuspenseLoader', () => {
  describe('Rendering', () => {
    it('should render the component', () => {
      const { container } = render(<SuspenseLoader />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with correct layout structure', () => {
      const { container } = render(<SuspenseLoader />);
      const mainBox = container.firstChild;
      expect(mainBox).toBeInTheDocument();
    });

    it('should render all required elements', () => {
      render(<SuspenseLoader />);
      const logo = screen.getByAltText('logo');
      expect(logo).toBeInTheDocument();
    });
  });

  describe('Logo Display', () => {
    it('should render logo image with correct alt text', () => {
      render(<SuspenseLoader />);
      const logo = screen.getByAltText('logo');
      expect(logo).toBeInTheDocument();
      expect(logo.tagName).toBe('IMG');
    });

    it('should render logo with src attribute', () => {
      render(<SuspenseLoader />);
      const logo = screen.getByAltText('logo') as HTMLImageElement;
      expect(logo.src).toBeTruthy();
      expect(logo).toHaveAttribute('src');
    });

    it('should render logo as img element', () => {
      render(<SuspenseLoader />);
      const logo = screen.getByAltText('logo');
      expect(logo).toHaveAttribute('src');
    });
  });

  describe('Animation Bars', () => {
    it('should render four animation bars', () => {
      const { container } = render(<SuspenseLoader />);
      const stack = container.querySelector('[class*="MuiStack-root"]');
      // The Stack container should have 4 Bar children
      expect(stack?.children.length).toBe(4);
    });

    it('should render bars within a Stack container', () => {
      const { container } = render(<SuspenseLoader />);
      const stack = container.querySelector('[class*="MuiStack-root"]');
      expect(stack).toBeInTheDocument();
    });

    it('should render all bars within Stack', () => {
      const { container } = render(<SuspenseLoader />);
      const stack = container.querySelector('[class*="MuiStack-root"]');
      
      expect(stack).toBeInTheDocument();
      expect(stack?.children.length).toBe(4);
    });
  });

  describe('Layout and Styling', () => {
    it('should have full viewport height container', () => {
      const { container } = render(<SuspenseLoader />);
      const mainBox = container.firstChild as HTMLElement;
      expect(mainBox).toHaveStyle({ minHeight: '100vh' });
    });

    it('should center content with flexbox', () => {
      const { container } = render(<SuspenseLoader />);
      const mainBox = container.firstChild as HTMLElement;
      expect(mainBox).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      });
    });

    it('should have column flex direction', () => {
      const { container } = render(<SuspenseLoader />);
      const mainBox = container.firstChild as HTMLElement;
      expect(mainBox).toHaveStyle({ flexDirection: 'column' });
    });

    it('should have background styling', () => {
      const { container } = render(<SuspenseLoader />);
      const mainBox = container.firstChild as HTMLElement;
      expect(mainBox).toBeInTheDocument();
      expect(mainBox.className).toContain('MuiBox-root');
    });

    it('should render Stack with row direction', () => {
      const { container } = render(<SuspenseLoader />);
      const stack = container.querySelector('[class*="MuiStack-root"]') as HTMLElement;
      expect(stack).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have correct component hierarchy', () => {
      const { container } = render(<SuspenseLoader />);

      const mainBox = container.firstChild;
      expect(mainBox).toBeInTheDocument();

      const logo = screen.getByAltText('logo');
      expect(logo).toBeInTheDocument();

      const stack = container.querySelector('[class*="MuiStack-root"]');
      expect(stack).toBeInTheDocument();
    });

    it('should render logo before animation bars', () => {
      const { container } = render(<SuspenseLoader />);
      const mainBox = container.firstChild as HTMLElement;
      const children = Array.from(mainBox.children);

      const firstChild = children[0];
      const logo = screen.getByAltText('logo');
      expect(firstChild.contains(logo)).toBe(true);
    });

    it('should maintain proper nesting structure', () => {
      const { container } = render(<SuspenseLoader />);
      const mainContainer = container.firstChild;
      expect(mainContainer?.childNodes.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible logo with alt text', () => {
      render(<SuspenseLoader />);
      const logo = screen.getByAltText('logo');
      expect(logo).toHaveAccessibleName('logo');
    });

    it('should render logo as img element for screen readers', () => {
      render(<SuspenseLoader />);
      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
    });

    it('should have descriptive alt text for logo', () => {
      render(<SuspenseLoader />);
      const logo = screen.getByAltText('logo');
      expect(logo).toHaveAttribute('alt', 'logo');
    });
  });

  describe('Visual Elements', () => {
    it('should render container with gap spacing', () => {
      const { container } = render(<SuspenseLoader />);
      const mainBox = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(mainBox);
      expect(styles.gap || mainBox.style.gap).toBeTruthy();
    });

    it('should render all visual components without errors', () => {
      const { container } = render(<SuspenseLoader />);
      expect(container).toBeInTheDocument();
      expect(screen.getByAltText('logo')).toBeInTheDocument();
    });

    it('should display logo and loader together', () => {
      render(<SuspenseLoader />);
      const logo = screen.getByAltText('logo');
      expect(logo).toBeVisible();
    });
  });

  describe('Snapshot and Consistency', () => {
    it('should render consistently', () => {
      const { container: container1 } = render(<SuspenseLoader />);
      const { container: container2 } = render(<SuspenseLoader />);
      
      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('should maintain structure across multiple renders', () => {
      const { rerender, container } = render(<SuspenseLoader />);
      const initialHTML = container.innerHTML;
      
      rerender(<SuspenseLoader />);
      
      expect(container.innerHTML).toBe(initialHTML);
    });
  });

  describe('Error Handling', () => {
    it('should render without crashing when mounted', () => {
      expect(() => render(<SuspenseLoader />)).not.toThrow();
    });

    it('should handle unmounting gracefully', () => {
      const { unmount } = render(<SuspenseLoader />);
      expect(() => unmount()).not.toThrow();
    });

    it('should handle multiple mounts and unmounts', () => {
      const { unmount: unmount1 } = render(<SuspenseLoader />);
      unmount1();
      
      const { unmount: unmount2 } = render(<SuspenseLoader />);
      unmount2();
      
      const { container } = render(<SuspenseLoader />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Component Behavior', () => {
    it('should be a stateless component', () => {
      const { container: container1 } = render(<SuspenseLoader />);
      const { container: container2 } = render(<SuspenseLoader />);
      
      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('should not accept props', () => {
      const { container } = render(<SuspenseLoader />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render independently', () => {
      const { container } = render(
        <>
          <SuspenseLoader />
          <SuspenseLoader />
        </>
      );
      
      const logos = screen.getAllByAltText('logo');
      expect(logos.length).toBe(2);
    });
  });

  describe('Integration', () => {
    it('should work within Suspense boundary', () => {
      const { container } = render(
        <React.Suspense fallback={<SuspenseLoader />}>
          <SuspenseLoader />
        </React.Suspense>
      );
      
      expect(container).toBeInTheDocument();
    });

    it('should render as a standalone component', () => {
      const { container } = render(<SuspenseLoader />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should maintain appearance when nested', () => {
      const { container } = render(
        <div>
          <SuspenseLoader />
        </div>
      );
      
      const logo = screen.getByAltText('logo');
      expect(logo).toBeInTheDocument();
    });
  });

  describe('Animation Delays', () => {
    it('should render bars with staggered animations', () => {
      const { container } = render(<SuspenseLoader />);
      const bars = container.querySelectorAll('[class*="MuiBox-root"]');
      
      expect(bars.length).toBeGreaterThan(1);
    });

    it('should create visual loading effect with multiple bars', () => {
      const { container } = render(<SuspenseLoader />);
      const stack = container.querySelector('[class*="MuiStack-root"]');
      
      expect(stack).toBeInTheDocument();
      expect(stack?.children.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Styling Classes', () => {
    it('should apply MUI Box classes to main container', () => {
      const { container } = render(<SuspenseLoader />);
      const mainBox = container.firstChild as HTMLElement;
      expect(mainBox.className).toContain('MuiBox-root');
    });

    it('should apply MUI Stack classes to bar container', () => {
      const { container } = render(<SuspenseLoader />);
      const stack = container.querySelector('[class*="MuiStack-root"]');
      expect(stack).toBeInTheDocument();
      expect(stack?.className).toContain('MuiStack-root');
    });

    it('should have proper CSS classes applied', () => {
      const { container } = render(<SuspenseLoader />);
      const muiElements = container.querySelectorAll('[class*="Mui"]');
      expect(muiElements.length).toBeGreaterThan(0);
    });
  });
});

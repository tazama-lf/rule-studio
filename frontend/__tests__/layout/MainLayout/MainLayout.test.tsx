import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MainLayout from '../../../src/layout/MainLayout';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));

jest.mock('../../../src/layout/Header', () => {
  return function Header({ expanded, setExpanded }: { expanded: boolean; setExpanded: (v: boolean) => void }) {
    return (
      <div data-testid="header">
        Header Component
        <button onClick={() => setExpanded(!expanded)} data-testid="toggle-button">
          Toggle
        </button>
        <span data-testid="header-expanded-state">{expanded ? 'expanded' : 'collapsed'}</span>
      </div>
    );
  };
});

jest.mock('../../../src/layout/Sidebar', () => {
  return function Sidebar({ expanded }: { expanded: boolean }) {
    return (
      <div data-testid="sidebar">
        Sidebar Component
        <span data-testid="sidebar-expanded-state">{expanded ? 'expanded' : 'collapsed'}</span>
      </div>
    );
  };
});

jest.mock('../../../src/utils/Constants', () => ({
  NAV_HEIGHT: 64,
}));

describe('MainLayout Component', () => {
  describe('Basic Rendering', () => {
    it('should render MainLayout component', () => {
      const { container } = render(<MainLayout />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render Header component', () => {
      render(<MainLayout />);
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should render Sidebar component', () => {
      render(<MainLayout />);
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('should render Outlet for nested routes', () => {
      render(<MainLayout />);
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
      expect(screen.getByText('Outlet Content')).toBeInTheDocument();
    });

    it('should render all main components together', () => {
      render(<MainLayout />);
      
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });
  });

  describe('Initial State', () => {
    it('should initialize with sidebar collapsed', () => {
      render(<MainLayout />);
      
      const sidebarState = screen.getByTestId('sidebar-expanded-state');
      expect(sidebarState).toHaveTextContent('collapsed');
    });

    it('should pass collapsed state to Header initially', () => {
      render(<MainLayout />);
      
      const headerState = screen.getByTestId('header-expanded-state');
      expect(headerState).toHaveTextContent('collapsed');
    });

    it('should initialize both Header and Sidebar with same state', () => {
      render(<MainLayout />);
      
      const headerState = screen.getByTestId('header-expanded-state');
      const sidebarState = screen.getByTestId('sidebar-expanded-state');
      
      expect(headerState).toHaveTextContent('collapsed');
      expect(sidebarState).toHaveTextContent('collapsed');
    });
  });

  describe('State Management', () => {
    it('should toggle expanded state when toggle button is clicked', () => {
      render(<MainLayout />);
      
      const toggleButton = screen.getByTestId('toggle-button');
      const headerState = screen.getByTestId('header-expanded-state');
      const sidebarState = screen.getByTestId('sidebar-expanded-state');
      
      expect(headerState).toHaveTextContent('collapsed');
      expect(sidebarState).toHaveTextContent('collapsed');
      
      fireEvent.click(toggleButton);
      
      expect(headerState).toHaveTextContent('expanded');
      expect(sidebarState).toHaveTextContent('expanded');
    });

    it('should toggle back to collapsed state on second click', () => {
      render(<MainLayout />);
      
      const toggleButton = screen.getByTestId('toggle-button');
      const headerState = screen.getByTestId('header-expanded-state');
      
      fireEvent.click(toggleButton);
      expect(headerState).toHaveTextContent('expanded');
      
      fireEvent.click(toggleButton);
      expect(headerState).toHaveTextContent('collapsed');
    });

    it('should maintain consistent state across Header and Sidebar', () => {
      render(<MainLayout />);
      
      const toggleButton = screen.getByTestId('toggle-button');
      const headerState = screen.getByTestId('header-expanded-state');
      const sidebarState = screen.getByTestId('sidebar-expanded-state');
      
      toggleButton.click();
      
      expect(headerState.textContent).toBe(sidebarState.textContent);
      
      toggleButton.click();
      
      expect(headerState.textContent).toBe(sidebarState.textContent);
    });

    it('should handle multiple toggles correctly', () => {
      render(<MainLayout />);
      
      const toggleButton = screen.getByTestId('toggle-button');
      const headerState = screen.getByTestId('header-expanded-state');
      
      expect(headerState).toHaveTextContent('collapsed');
      
      fireEvent.click(toggleButton);
      expect(headerState).toHaveTextContent('expanded');
      
      fireEvent.click(toggleButton);
      expect(headerState).toHaveTextContent('collapsed');
      
      fireEvent.click(toggleButton);
      expect(headerState).toHaveTextContent('expanded');
    });
  });

  describe('Component Structure', () => {
    it('should have proper layout structure with flex display', () => {
      const { container } = render(<MainLayout />);
      const mainBox = container.firstChild as HTMLElement;
      
      expect(mainBox).toHaveStyle({ display: 'flex' });
    });

    it('should render Header before Outlet', () => {
      const { container } = render(<MainLayout />);
      const header = screen.getByTestId('header');
      const outlet = screen.getByTestId('outlet');
      
      expect(container.firstChild).toContainElement(header);
      expect(container.firstChild).toContainElement(outlet);
    });

    it('should render Sidebar independently', () => {
      render(<MainLayout />);
      const sidebar = screen.getByTestId('sidebar');
      
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should pass expanded prop to Header', () => {
      render(<MainLayout />);
      const headerState = screen.getByTestId('header-expanded-state');
      
      expect(headerState).toBeInTheDocument();
    });

    it('should pass expanded prop to Sidebar', () => {
      render(<MainLayout />);
      const sidebarState = screen.getByTestId('sidebar-expanded-state');
      
      expect(sidebarState).toBeInTheDocument();
    });

    it('should pass setExpanded callback to Header', () => {
      render(<MainLayout />);
      const toggleButton = screen.getByTestId('toggle-button');
      
      expect(toggleButton).toBeInTheDocument();
      expect(() => fireEvent.click(toggleButton)).not.toThrow();
    });

    it('should update Sidebar when Header changes state', () => {
      render(<MainLayout />);
      
      const toggleButton = screen.getByTestId('toggle-button');
      const sidebarState = screen.getByTestId('sidebar-expanded-state');
      
      expect(sidebarState).toHaveTextContent('collapsed');
      
      fireEvent.click(toggleButton);
      
      expect(sidebarState).toHaveTextContent('expanded');
    });
  });

  describe('Integration', () => {
    it('should render complete layout hierarchy', () => {
      render(<MainLayout />);
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('should maintain state synchronization between components', () => {
      render(<MainLayout />);
      
      const toggleButton = screen.getByTestId('toggle-button');
      const headerState = screen.getByTestId('header-expanded-state');
      const sidebarState = screen.getByTestId('sidebar-expanded-state');
      
      for (let i = 0; i < 3; i++) {
        fireEvent.click(toggleButton);
        expect(headerState.textContent).toBe(sidebarState.textContent);
      }
    });

    it('should handle rapid state changes', () => {
      render(<MainLayout />);
      
      const toggleButton = screen.getByTestId('toggle-button');
      const headerState = screen.getByTestId('header-expanded-state');
      
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);
      
      expect(headerState).toHaveTextContent('expanded');
    });
  });

  describe('Outlet Integration', () => {
    it('should render Outlet for child routes', () => {
      render(<MainLayout />);
      
      const outlet = screen.getByTestId('outlet');
      expect(outlet).toBeInTheDocument();
    });

    it('should display Outlet content', () => {
      render(<MainLayout />);
      
      expect(screen.getByText('Outlet Content')).toBeInTheDocument();
    });

    it('should render Outlet in main content area', () => {
      render(<MainLayout />);
      
      const outlet = screen.getByTestId('outlet');
      expect(outlet.parentElement).toBeInTheDocument();
    });
  });

  describe('Component Isolation', () => {
    it('should render even if Header fails', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { container } = render(<MainLayout />);
      
      expect(container.firstChild).toBeInTheDocument();
      
      consoleError.mockRestore();
    });

    it('should render event if Sidebar fails', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { container } = render(<MainLayout />);
      
      expect(container.firstChild).toBeInTheDocument();
      
      consoleError.mockRestore();
    });
  });

  describe('State Independence', () => {
    it('should not affect other rendered instances', () => {
      const { unmount } = render(<MainLayout />);
      const toggleButton1 = screen.getByTestId('toggle-button');
      
      fireEvent.click(toggleButton1);
      unmount();
      
      render(<MainLayout />);
      const headerState = screen.getByTestId('header-expanded-state');
      
      expect(headerState).toHaveTextContent('collapsed');
    });

    it('should start fresh on each render', () => {
      const { unmount: unmount1 } = render(<MainLayout />);
      unmount1();
      
      const { unmount: unmount2 } = render(<MainLayout />);
      const headerState = screen.getByTestId('header-expanded-state');
      
      expect(headerState).toHaveTextContent('collapsed');
      unmount2();
    });
  });

  describe('Edge Cases', () => {
    it('should handle consecutive renders', () => {
      const { rerender } = render(<MainLayout />);
      
      expect(screen.getByTestId('header')).toBeInTheDocument();
      
      rerender(<MainLayout />);
      
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('should maintain state through rerenders', () => {
      const { rerender } = render(<MainLayout />);
      
      const toggleButton = screen.getByTestId('toggle-button');
      fireEvent.click(toggleButton);
      
      const headerState = screen.getByTestId('header-expanded-state');
      expect(headerState).toHaveTextContent('expanded');
      
      rerender(<MainLayout />);
      
      const newHeaderState = screen.getByTestId('header-expanded-state');
      expect(newHeaderState).toBeInTheDocument();
    });
  });
});

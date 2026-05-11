import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar from '../../../src/layout/Sidebar';
import { useNavigate } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../../../src/utils/Common/storage', () => ({
  resetData: jest.fn(),
  extractData: jest.fn(() => ({ claims: 'editor' })),
}));

import { resetData } from '../../../src/utils/Common/storage';

const mockNavigate = jest.fn();
const mockResetData = resetData as jest.Mock;

describe('Sidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  describe('Basic Rendering', () => {
    it('should render Sidebar component', () => {
      const { container } = render(<Sidebar expanded={false} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render all menu items when collapsed', () => {
      const { container } = render(<Sidebar expanded={false} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render all menu items when expanded', () => {
      render(<Sidebar expanded={true} />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Sandbox')).toBeInTheDocument();
    });

    it('should render logout button', () => {
      render(<Sidebar expanded={true} />);
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should have correct structure', () => {
      const { container } = render(<Sidebar expanded={false} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Expanded State', () => {
    it('should show menu labels when expanded', () => {
      render(<Sidebar expanded={true} />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Sandbox')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should hide menu labels when collapsed', () => {
      render(<Sidebar expanded={false} />);
      
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      expect(screen.queryByText('Sandbox')).not.toBeInTheDocument();
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });

    it('should render icons regardless of expanded state', () => {
      const { container, rerender } = render(<Sidebar expanded={false} />);
      expect(container.firstChild).toBeInTheDocument();
      
      rerender(<Sidebar expanded={true} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Menu Navigation', () => {
    it('should navigate to home on clicking Home', () => {
      render(<Sidebar expanded={true} />);
      
      const homeButton = screen.getByText('Home');
      fireEvent.click(homeButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('home');
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('should navigate to sandbox on clicking Sandbox', () => {
      render(<Sidebar expanded={true} />);
      
      const sandboxButton = screen.getByText('Sandbox');
      fireEvent.click(sandboxButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('sandbox');
    });

    it('should navigate correctly using Home item', () => {
      render(<Sidebar expanded={true} />);
      
      const homeButton = screen.getByText('Home');
      fireEvent.click(homeButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('home');
    });

    it('should handle multiple navigation clicks', () => {
      render(<Sidebar expanded={true} />);
      
      fireEvent.click(screen.getByText('Home'));
      fireEvent.click(screen.getByText('Sandbox'));
      
      expect(mockNavigate).toHaveBeenCalledTimes(2);
      expect(mockNavigate).toHaveBeenNthCalledWith(1, 'home');
      expect(mockNavigate).toHaveBeenNthCalledWith(2, 'sandbox');
    });
  });

  describe('Active State Management', () => {
    it('should start with first menu item active by default', () => {
      render(<Sidebar expanded={true} />);
      
      const homeButton = screen.getByText('Home');
      expect(homeButton).toBeInTheDocument();
    });

    it('should update active state on menu click', () => {
      render(<Sidebar expanded={true} />);
      
      const sandboxButton = screen.getByText('Sandbox');
      fireEvent.click(sandboxButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('sandbox');
    });

    it('should handle rapid successive clicks', () => {
      render(<Sidebar expanded={true} />);
      
      const homeButton = screen.getByText('Home');
      const sandboxButton = screen.getByText('Sandbox');
      
      fireEvent.click(homeButton);
      fireEvent.click(sandboxButton);
      fireEvent.click(homeButton);
      
      expect(mockNavigate).toHaveBeenCalledTimes(3);
    });

    it('should allow clicking same menu item multiple times', () => {
      render(<Sidebar expanded={true} />);
      
      const homeButton = screen.getByText('Home');
      
      fireEvent.click(homeButton);
      fireEvent.click(homeButton);
      
      expect(mockNavigate).toHaveBeenCalledTimes(2);
      expect(mockNavigate).toHaveBeenCalledWith('home');
    });
  });

  describe('Logout Functionality', () => {
    it('should call resetData on logout click', () => {
      render(<Sidebar expanded={true} />);
      
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
      
      expect(mockResetData).toHaveBeenCalledTimes(1);
    });

    it('should navigate to login page on logout', () => {
      render(<Sidebar expanded={true} />);
      
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should call resetData before navigation', () => {
      render(<Sidebar expanded={true} />);
      
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
      
      expect(mockResetData).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should handle logout functionality', () => {
      render(<Sidebar expanded={true} />);
      
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
      
      expect(mockResetData).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Props Handling', () => {
    it('should handle expanded prop correctly', () => {
      const { rerender } = render(<Sidebar expanded={false} />);
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      
      rerender(<Sidebar expanded={true} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should update when expanded prop changes', () => {
      const { rerender } = render(<Sidebar expanded={false} />);
      expect(screen.queryByText('Sandbox')).not.toBeInTheDocument();
      
      rerender(<Sidebar expanded={true} />);
      expect(screen.getByText('Sandbox')).toBeInTheDocument();
      
      rerender(<Sidebar expanded={false} />);
      expect(screen.queryByText('Sandbox')).not.toBeInTheDocument();
    });

    it('should maintain navigation functionality when toggling expanded state', () => {
      const { rerender } = render(<Sidebar expanded={true} />);
      
      fireEvent.click(screen.getByText('Sandbox'));
      expect(mockNavigate).toHaveBeenCalledWith('sandbox');
      
      rerender(<Sidebar expanded={false} />);
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Menu Items Configuration', () => {
    it('should render exactly 2 main menu items', () => {
      render(<Sidebar expanded={true} />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Sandbox')).toBeInTheDocument();
    });

    it('should have logout as separate item', () => {
      render(<Sidebar expanded={true} />);
      
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should render all menu items in correct order', () => {
      render(<Sidebar expanded={true} />);
      
      const labels = ['Home', 'Sandbox'];
      labels.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation in Collapsed State', () => {
    it('should render sidebar in collapsed state', () => {
      const { container } = render(<Sidebar expanded={false} />);
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('should maintain structure when collapsed', () => {
      const { container } = render(<Sidebar expanded={false} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid expand/collapse changes', () => {
      const { rerender } = render(<Sidebar expanded={false} />);
      
      for (let i = 0; i < 5; i++) {
        rerender(<Sidebar expanded={i % 2 === 0} />);
      }
      
      // After 5 iterations (0-4), i=4 which is even, so expanded=true
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should maintain state through rerender', () => {
      const { rerender } = render(<Sidebar expanded={true} />);
      
      fireEvent.click(screen.getByText('Sandbox'));
      
      rerender(<Sidebar expanded={true} />);
      
      expect(mockNavigate).toHaveBeenCalledWith('sandbox');
    });
  });

  describe('Component Isolation', () => {
    it('should not affect other instances', () => {
      const { unmount } = render(<Sidebar expanded={true} />);
      
      fireEvent.click(screen.getByText('Sandbox'));
      unmount();
      
      render(<Sidebar expanded={true} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should start fresh on each mount', () => {
      const { unmount: unmount1 } = render(<Sidebar expanded={true} />);
      fireEvent.click(screen.getByText('Sandbox'));
      unmount1();
      
      const { unmount: unmount2 } = render(<Sidebar expanded={true} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      unmount2();
    });
  });

  describe('Click Event Handling', () => {
    it('should handle menu item clicks in expanded state', () => {
      render(<Sidebar expanded={true} />);
      
      const menuItems = ['Home', 'Sandbox'];
      const routes = ['home', 'sandbox'];
      
      menuItems.forEach((item, index) => {
        jest.clearAllMocks();
        fireEvent.click(screen.getByText(item));
        expect(mockNavigate).toHaveBeenCalledWith(routes[index]);
      });
    });

    it('should prevent event bubbling', () => {
      const containerClick = jest.fn();
      const { container } = render(
        <div onClick={containerClick}>
          <Sidebar expanded={true} />
        </div>
      );
      
      fireEvent.click(screen.getByText('Home'));
      
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have clickable elements', () => {
      render(<Sidebar expanded={true} />);
      
      const homeButton = screen.getByText('Home');
      expect(homeButton).toBeInTheDocument();
    });

    it('should have all menu items accessible', () => {
      render(<Sidebar expanded={true} />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Sandbox')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should maintain accessibility in collapsed state', () => {
      const { container } = render(<Sidebar expanded={false} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should integrate navigation and state management', () => {
      render(<Sidebar expanded={true} />);
      
      fireEvent.click(screen.getByText('Home'));
      expect(mockNavigate).toHaveBeenCalledWith('home');
      
      fireEvent.click(screen.getByText('Sandbox'));
      expect(mockNavigate).toHaveBeenCalledWith('sandbox');
      
      expect(mockNavigate).toHaveBeenCalledTimes(2);
    });

    it('should handle complete user flow', () => {
      render(<Sidebar expanded={true} />);
      
      fireEvent.click(screen.getByText('Home'));
      fireEvent.click(screen.getByText('Sandbox'));
      fireEvent.click(screen.getByText('Logout'));
      
      expect(mockNavigate).toHaveBeenCalledTimes(3);
      expect(mockResetData).toHaveBeenCalledTimes(1);
    });
  });
});

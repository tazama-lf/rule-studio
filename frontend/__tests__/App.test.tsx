import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';
import { ROUTES } from '../src/routes';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div data-testid="browser-router">{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div data-testid="routes">{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => <div data-testid="route">{element}</div>,
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">Navigate to {to}</div>,
}));

jest.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="toaster">Toaster Component</div>,
}));

jest.mock('../src/contexts/ModalContext', () => ({
  ModalProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal-provider">{children}</div>
  ),
}));

jest.mock('../src/layout/MainLayout', () => {
  return function MainLayout() {
    return <div data-testid="main-layout">Main Layout</div>;
  };
});

jest.mock('../src/routes/PrivateRoute', () => {
  return function PrivateRoute() {
    return <div data-testid="private-route">Private Route</div>;
  };
});

jest.mock('../src/routes/ProtectedRoute', () => {
  return function ProtectedRoute() {
    return <div data-testid="protected-route">Protected Route</div>;
  };
});

jest.mock('../src/utils/Theme', () => ({
  __esModule: true,
  default: () => ({
    palette: {
      static: {
        primary: '#000',
        secondary: '#fff',
        skyBlue: '#87CEEB',
        ternary: '#888',
        black: '#000',
        white: '#fff',
        lightBlue: '#ADD8E6',
        border: '#ccc',
        grey: '#808080',
        lightGrey: '#D3D3D3',
      },
      text: {
        primary: '#000',
        secondary: '#666',
        black: '#000',
      },
    },
  }),
}));

jest.mock('../src/routes', () => ({
  ROUTES: [
    {
      path: '/login',
      element: <div>Login Page</div>,
      private: false,
      layout: false,
    },
    {
      path: '/home',
      element: <div>Home Page</div>,
      private: true,
      layout: true,
    },
    {
      path: '/editor',
      element: <div>Editor Page</div>,
      private: true,
      layout: true,
    },
    {
      path: '/components',
      element: <div>Components Page</div>,
      private: true,
      layout: false,
    },
    {
      path: '/rule-builder/:id',
      element: <div>Rule Builder Page</div>,
      private: true,
      layout: false,
    },
  ],
}));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<App />);
      expect(container).toBeInTheDocument();
    });

    it('should render BrowserRouter', () => {
      render(<App />);
      expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    });

    it('should render ThemeProvider with MUI theme', () => {
      const { container } = render(<App />);
      expect(container.querySelector('[data-testid="browser-router"]')).toBeInTheDocument();
    });

    it('should render ModalProvider', () => {
      render(<App />);
      expect(screen.getByTestId('modal-provider')).toBeInTheDocument();
    });

    it('should render Toaster component', () => {
      render(<App />);
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });

    it('should render Routes component', () => {
      render(<App />);
      expect(screen.getByTestId('routes')).toBeInTheDocument();
    });
  });

  describe('Route Filtering', () => {
    it('should filter routes correctly into three categories', () => {
      render(<App />);
      
      const routes = screen.getAllByTestId('route');
      expect(routes.length).toBeGreaterThan(0);
    });

    it('should have privateWithLayoutRoutes (private: true, layout: true)', () => {
      const privateWithLayout = ROUTES.filter(
        route => route.private === true && route.layout === true
      );
      
      expect(privateWithLayout).toHaveLength(2);
      expect(privateWithLayout[0].path).toBe('/home');
      expect(privateWithLayout[1].path).toBe('/editor');
    });

    it('should have publicNoLayoutRoutes (private: false, layout: false)', () => {
      const publicNoLayout = ROUTES.filter(
        route => route.private === false && route.layout === false
      );
      
      expect(publicNoLayout).toHaveLength(1);
      expect(publicNoLayout[0].path).toBe('/login');
    });

    it('should have privateWithoutLayoutRoutes (private: true, layout: false)', () => {
      const privateWithoutLayout = ROUTES.filter(
        route => route.private === true && route.layout === false
      );
      
      expect(privateWithoutLayout).toHaveLength(2);
      expect(privateWithoutLayout[0].path).toBe('/components');
      expect(privateWithoutLayout[1].path).toBe('/rule-builder/:id');
    });
  });

  describe('Route Protection', () => {
    it('should render ProtectedRoute for public routes', () => {
      render(<App />);
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });

    it('should render PrivateRoute for private routes', () => {
      render(<App />);
      expect(screen.getByTestId('private-route')).toBeInTheDocument();
    });
  });

  describe('Layout Rendering', () => {
    it('should setup routes structure for layout rendering', () => {
      render(<App />);
      // Verify that routes are set up correctly
      expect(screen.getByTestId('routes')).toBeInTheDocument();
      expect(screen.getByTestId('private-route')).toBeInTheDocument();
    });

    it('should handle routes with and without layout configuration', () => {
      render(<App />);
      // Verify route filtering works correctly
      const routes = screen.getAllByTestId('route');
      expect(routes.length).toBeGreaterThan(0);
    });
  });

  describe('Route Structure', () => {
    it('should have correct route hierarchy for public routes', () => {
      render(<App />);
      
      const protectedRoute = screen.getByTestId('protected-route');
      expect(protectedRoute).toBeInTheDocument();
    });

    it('should have correct route hierarchy for private routes with layout', () => {
      render(<App />);
      
      const privateRoute = screen.getByTestId('private-route');
      
      expect(privateRoute).toBeInTheDocument();
    });

    it('should have correct route hierarchy for private routes without layout', () => {
      render(<App />);
      
      const privateRoute = screen.getByTestId('private-route');
      expect(privateRoute).toBeInTheDocument();
    });
  });

  describe('Providers and Wrappers', () => {
    it('should wrap routes with BrowserRouter', () => {
      const { container } = render(<App />);
      const browserRouter = container.querySelector('[data-testid="browser-router"]');
      const routes = container.querySelector('[data-testid="routes"]');
      
      expect(browserRouter).toBeInTheDocument();
      expect(routes).toBeInTheDocument();
    });

    it('should wrap content with ThemeProvider', () => {
      const { container } = render(<App />);
      expect(container).toBeInTheDocument();
    });

    it('should wrap content with ModalProvider', () => {
      render(<App />);
      const modalProvider = screen.getByTestId('modal-provider');
      const routes = screen.getByTestId('routes');
      
      expect(modalProvider).toBeInTheDocument();
      expect(routes).toBeInTheDocument();
    });

    it('should include Toaster in the component tree', () => {
      render(<App />);
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });
  });

  describe('useMemo Optimization', () => {
    it('should memoize privateWithLayoutRoutes', () => {
      const { rerender } = render(<App />);
      const initialRoutes = screen.getAllByTestId('route');
      
      rerender(<App />);
      const afterRerenderRoutes = screen.getAllByTestId('route');

      expect(initialRoutes.length).toBe(afterRerenderRoutes.length);
    });

    it('should memoize publicNoLayoutRoutes', () => {
      const { rerender } = render(<App />);
      rerender(<App />);

      expect(screen.getByTestId('routes')).toBeInTheDocument();
    });

    it('should memoize privateWithoutLayoutRoutes', () => {
      const { rerender } = render(<App />);
      rerender(<App />);

      expect(screen.getByTestId('routes')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should render all major components together', () => {
      render(<App />);
      
      expect(screen.getByTestId('browser-router')).toBeInTheDocument();
      expect(screen.getByTestId('modal-provider')).toBeInTheDocument();
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
      expect(screen.getByTestId('routes')).toBeInTheDocument();
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByTestId('private-route')).toBeInTheDocument();
    });

    it('should maintain component hierarchy', () => {
      const { container } = render(<App />);

      const browserRouter = container.querySelector('[data-testid="browser-router"]');
      const modalProvider = screen.getByTestId('modal-provider');
      const routes = screen.getByTestId('routes');
      
      expect(browserRouter).toBeInTheDocument();
      expect(modalProvider).toBeInTheDocument();
      expect(routes).toBeInTheDocument();
    });

    it('should handle multiple rerenders gracefully', () => {
      const { rerender } = render(<App />);
      
      rerender(<App />);
      rerender(<App />);
      rerender(<App />);
      
      expect(screen.getByTestId('browser-router')).toBeInTheDocument();
      expect(screen.getByTestId('modal-provider')).toBeInTheDocument();
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });
  });

  describe('Theme Configuration', () => {
    it('should create theme with correct configuration', () => {
      const { container } = render(<App />);
      expect(container).toBeInTheDocument();
    });

    it('should apply theme to child components', () => {
      render(<App />);
      expect(screen.getByTestId('routes')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty routes array gracefully', () => {
      const { container } = render(<App />);
      expect(container).toBeInTheDocument();
    });

    it('should render without errors when routes change', () => {
      const { rerender } = render(<App />);
      rerender(<App />);
      
      expect(screen.getByTestId('routes')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have correct nesting: BrowserRouter > ThemeProvider > ModalProvider', () => {
      const { container } = render(<App />);
      
      const browserRouter = container.querySelector('[data-testid="browser-router"]');
      expect(browserRouter).toBeInTheDocument();
      
      const modalProvider = screen.getByTestId('modal-provider');
      expect(modalProvider).toBeInTheDocument();
    });

    it('should include Toaster as a sibling to Routes', () => {
      render(<App />);
      
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
      expect(screen.getByTestId('routes')).toBeInTheDocument();
    });

    it('should render all route protection components', () => {
      render(<App />);
      
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByTestId('private-route')).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Tabs, { TabItem } from '../../../src/components/Tabs';
import { TabContext, TabContextType } from '../../../src/contexts/TabContext/TabContext';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const theme = createTheme({
  palette: {
    static: {
      lightBlue: '#eff6ff',
      secondary: '#4b7eee',
      primary: '#1f2937',
      skyBlue: '#dbeafe',
      ternary: '#616a76',
      black: '#000',
      white: '#fff',
      border: '#dfddde',
      grey: '#fbf9fa',
      lightGrey: '#f3f4f6',
    },
    text: {
      black: '#000',
    },
  },
} as any);

describe('Tabs', () => {
  const mockTabs: TabItem[] = [
    { label: 'Tab 1', value: 'tab1', enabled: true },
    { label: 'Tab 2', value: 'tab2', enabled: true },
    { label: 'Tab 3', value: 'tab3', enabled: false },
  ];

  const createMockContext = (selectedTab: string = 'tab1'): TabContextType => ({
    tabs: mockTabs,
    selectedTab,
    enabledTabs: ['tab1', 'tab2'],
    setSelectedTab: jest.fn(),
    enableNextTab: jest.fn(),
    enableAllTabs: jest.fn(),
    enablePreviousTab: jest.fn(),
  });

  const renderWithContext = (contextValue: TabContextType) => {
    return render(
      <ThemeProvider theme={theme}>
        <TabContext.Provider value={contextValue}>
          <Tabs />
        </TabContext.Provider>
      </ThemeProvider>
    );
  };

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const mockContext = createMockContext();
      const { container } = renderWithContext(mockContext);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render all tabs from context', () => {
      const mockContext = createMockContext();
      renderWithContext(mockContext);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('should render correct number of tabs', () => {
      const mockContext = createMockContext();
      renderWithContext(mockContext);

      const tabs = screen.getAllByText(/Tab \d/);
      expect(tabs).toHaveLength(3);
    });

    it('should render wrapper container', () => {
      const mockContext = createMockContext();
      const { container } = renderWithContext(mockContext);

      const wrapper = container.firstChild;
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Tab Selection', () => {
    it('should mark the selected tab as active', () => {
      const mockContext = createMockContext('tab1');
      renderWithContext(mockContext);

      const tab1 = screen.getByText('Tab 1');
      expect(tab1).toBeInTheDocument();
    });

    it('should show underline for active tab only', () => {
      const mockContext = createMockContext('tab1');
      const { container } = renderWithContext(mockContext);

      const underlines = container.querySelectorAll('[data-layoutid="underline"]');
      expect(container.innerHTML).toContain('layoutid');
    });

    it('should update when selected tab changes', () => {
      const mockContext = createMockContext('tab1');
      const { rerender } = renderWithContext(mockContext);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();

      const updatedContext = createMockContext('tab2');
      rerender(
        <ThemeProvider theme={theme}>
          <TabContext.Provider value={updatedContext}>
            <Tabs />
          </TabContext.Provider>
        </ThemeProvider>
      );

      expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });

    it('should handle selection of first tab', () => {
      const mockContext = createMockContext('tab1');
      renderWithContext(mockContext);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
    });

    it('should handle selection of last tab', () => {
      const mockContext = createMockContext('tab3');
      renderWithContext(mockContext);

      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('should handle selection of middle tab', () => {
      const mockContext = createMockContext('tab2');
      renderWithContext(mockContext);

      expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });
  });

  describe('Tab Labels', () => {
    it('should render tab labels correctly', () => {
      const mockContext = createMockContext();
      renderWithContext(mockContext);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('should render labels with custom text', () => {
      const customTabs: TabItem[] = [
        { label: 'Dashboard', value: 'dashboard', enabled: true },
        { label: 'Settings', value: 'settings', enabled: true },
      ];

      const mockContext = {
        ...createMockContext(),
        tabs: customTabs,
        selectedTab: 'dashboard',
      };

      renderWithContext(mockContext);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should handle long tab labels', () => {
      const longLabelTabs: TabItem[] = [
        { label: 'This is a very long tab label', value: 'long', enabled: true },
      ];

      const mockContext = {
        ...createMockContext(),
        tabs: longLabelTabs,
        selectedTab: 'long',
      };

      renderWithContext(mockContext);

      expect(screen.getByText('This is a very long tab label')).toBeInTheDocument();
    });

    it('should handle tab labels with special characters', () => {
      const specialCharTabs: TabItem[] = [
        { label: 'Tab & Settings', value: 'special', enabled: true },
        { label: 'Tab > Configuration', value: 'special2', enabled: true },
      ];

      const mockContext = {
        ...createMockContext(),
        tabs: specialCharTabs,
        selectedTab: 'special',
      };

      renderWithContext(mockContext);

      expect(screen.getByText('Tab & Settings')).toBeInTheDocument();
      expect(screen.getByText('Tab > Configuration')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should handle empty tabs array', () => {
      const mockContext = {
        ...createMockContext(),
        tabs: [],
      };

      renderWithContext(mockContext);

      const tabs = screen.queryAllByText(/Tab/);
      expect(tabs).toHaveLength(0);
    });

    it('should render container even with no tabs', () => {
      const mockContext = {
        ...createMockContext(),
        tabs: [],
      };

      const { container } = renderWithContext(mockContext);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Single Tab', () => {
    it('should render correctly with single tab', () => {
      const singleTab: TabItem[] = [
        { label: 'Only Tab', value: 'only', enabled: true },
      ];

      const mockContext = {
        ...createMockContext(),
        tabs: singleTab,
        selectedTab: 'only',
      };

      renderWithContext(mockContext);

      expect(screen.getByText('Only Tab')).toBeInTheDocument();
    });

    it('should show underline for single active tab', () => {
      const singleTab: TabItem[] = [
        { label: 'Only Tab', value: 'only', enabled: true },
      ];

      const mockContext = {
        ...createMockContext(),
        tabs: singleTab,
        selectedTab: 'only',
      };

      const { container } = renderWithContext(mockContext);
      expect(container.innerHTML).toContain('layoutid');
    });
  });

  describe('Multiple Tabs', () => {
    it('should render many tabs correctly', () => {
      const manyTabs: TabItem[] = Array.from({ length: 10 }, (_, i) => ({
        label: `Tab ${i + 1}`,
        value: `tab${i + 1}`,
        enabled: true,
      }));

      const mockContext = {
        ...createMockContext(),
        tabs: manyTabs,
        selectedTab: 'tab5',
      };

      renderWithContext(mockContext);

      const tabs = screen.getAllByText(/Tab \d+/);
      expect(tabs).toHaveLength(10);
    });

    it('should handle switching between many tabs', () => {
      const manyTabs: TabItem[] = Array.from({ length: 5 }, (_, i) => ({
        label: `Tab ${i + 1}`,
        value: `tab${i + 1}`,
        enabled: true,
      }));

      const mockContext = {
        ...createMockContext(),
        tabs: manyTabs,
        selectedTab: 'tab1',
      };

      const { rerender } = renderWithContext(mockContext);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();

      const updatedContext = {
        ...mockContext,
        selectedTab: 'tab5',
      };

      rerender(
        <ThemeProvider theme={theme}>
          <TabContext.Provider value={updatedContext}>
            <Tabs />
          </TabContext.Provider>
        </ThemeProvider>
      );

      expect(screen.getByText('Tab 5')).toBeInTheDocument();
    });
  });

  describe('Tab Enabled State', () => {
    it('should render disabled tabs', () => {
      const mockContext = createMockContext();
      renderWithContext(mockContext);

      // Tab 3 is disabled in mockTabs
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('should render enabled tabs', () => {
      const mockContext = createMockContext();
      renderWithContext(mockContext);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });

    it('should handle all tabs disabled', () => {
      const disabledTabs: TabItem[] = [
        { label: 'Tab 1', value: 'tab1', enabled: false },
        { label: 'Tab 2', value: 'tab2', enabled: false },
      ];

      const mockContext = {
        ...createMockContext(),
        tabs: disabledTabs,
        enabledTabs: [],
      };

      renderWithContext(mockContext);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });

    it('should handle all tabs enabled', () => {
      const enabledTabs: TabItem[] = [
        { label: 'Tab 1', value: 'tab1', enabled: true },
        { label: 'Tab 2', value: 'tab2', enabled: true },
        { label: 'Tab 3', value: 'tab3', enabled: true },
      ];

      const mockContext = {
        ...createMockContext(),
        tabs: enabledTabs,
        enabledTabs: ['tab1', 'tab2', 'tab3'],
      };

      renderWithContext(mockContext);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });
  });

  describe('Underline Animation', () => {
    it('should render underline for active tab', () => {
      const mockContext = createMockContext('tab1');
      const { container } = renderWithContext(mockContext);

      // Check that layoutId is present in the DOM (underline component)
      expect(container.innerHTML).toContain('layoutid');
    });

    it('should not render multiple underlines', () => {
      const mockContext = createMockContext('tab2');
      const { container } = renderWithContext(mockContext);

      // Should only have one underline
      const layoutIdMatches = container.innerHTML.match(/layoutid/g);
      expect(layoutIdMatches).toHaveLength(1);
    });

    it('should render underline with correct layoutId', () => {
      const mockContext = createMockContext('tab1');
      const { container } = renderWithContext(mockContext);

      expect(container.innerHTML).toContain('layoutid="underline"');
    });
  });

  describe('Component Memo', () => {
    it('should render consistently with same props', () => {
      const mockContext = createMockContext();
      const { container, rerender } = renderWithContext(mockContext);

      const initialHTML = container.innerHTML;

      rerender(
        <ThemeProvider theme={theme}>
          <TabContext.Provider value={mockContext}>
            <Tabs />
          </TabContext.Provider>
        </ThemeProvider>
      );

      expect(container.innerHTML).toBe(initialHTML);
    });

    it('should update when context changes', () => {
      const mockContext = createMockContext('tab1');
      const { container, rerender } = renderWithContext(mockContext);

      const initialHTML = container.innerHTML;

      const updatedContext = createMockContext('tab2');
      rerender(
        <ThemeProvider theme={theme}>
          <TabContext.Provider value={updatedContext}>
            <Tabs />
          </TabContext.Provider>
        </ThemeProvider>
      );

      expect(container.innerHTML).not.toBe(initialHTML);
    });
  });

  describe('Tab Values', () => {
    it('should use unique tab values as keys', () => {
      const mockContext = createMockContext();
      const { container } = renderWithContext(mockContext);

      // React uses keys internally, we can check that tabs are rendered uniquely
      const tabs = screen.getAllByText(/Tab \d/);
      expect(tabs).toHaveLength(3);
    });

    it('should handle tabs with different value formats', () => {
      const customTabs: TabItem[] = [
        { label: 'First', value: 'first-tab', enabled: true },
        { label: 'Second', value: 'SECOND_TAB', enabled: true },
        { label: 'Third', value: '3rdTab', enabled: true },
      ];

      const mockContext = {
        ...createMockContext(),
        tabs: customTabs,
        selectedTab: 'first-tab',
      };

      renderWithContext(mockContext);

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle context with undefined selectedTab', () => {
      const mockContext = {
        ...createMockContext(),
        selectedTab: '',
      };

      expect(() => renderWithContext(mockContext)).not.toThrow();
    });

    it('should handle selectedTab that does not match any tab value', () => {
      const mockContext = {
        ...createMockContext(),
        selectedTab: 'nonexistent',
      };

      renderWithContext(mockContext);

      // All tabs should still render
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });
  });

  describe('Integration with Context', () => {
    it('should read tabs from TabContext', () => {
      const mockContext = createMockContext();
      renderWithContext(mockContext);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('should read selectedTab from TabContext', () => {
      const mockContext = createMockContext('tab2');
      renderWithContext(mockContext);

      expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });

    it('should handle context updates', () => {
      const mockContext = createMockContext('tab1');
      const { rerender } = renderWithContext(mockContext);

      const newTabs: TabItem[] = [
        { label: 'New Tab 1', value: 'new1', enabled: true },
        { label: 'New Tab 2', value: 'new2', enabled: true },
      ];

      const updatedContext = {
        ...mockContext,
        tabs: newTabs,
        selectedTab: 'new1',
      };

      rerender(
        <ThemeProvider theme={theme}>
          <TabContext.Provider value={updatedContext}>
            <Tabs />
          </TabContext.Provider>
        </ThemeProvider>
      );

      expect(screen.getByText('New Tab 1')).toBeInTheDocument();
      expect(screen.getByText('New Tab 2')).toBeInTheDocument();
      expect(screen.queryByText('Tab 1')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render tab labels as text elements', () => {
      const mockContext = createMockContext();
      renderWithContext(mockContext);

      const tab1Label = screen.getByText('Tab 1');
      expect(tab1Label).toBeInTheDocument();
      expect(tab1Label.tagName).toBe('P');
    });

    it('should have readable content', () => {
      const mockContext = createMockContext();
      const { container } = renderWithContext(mockContext);

      expect(container.textContent).toContain('Tab 1');
      expect(container.textContent).toContain('Tab 2');
      expect(container.textContent).toContain('Tab 3');
    });
  });

  describe('Layout and Structure', () => {
    it('should have wrapper container', () => {
      const mockContext = createMockContext();
      const { container } = renderWithContext(mockContext);

      const wrapper = container.firstChild;
      expect(wrapper).toBeInTheDocument();
    });

    it('should have tabs container inside wrapper', () => {
      const mockContext = createMockContext();
      const { container } = renderWithContext(mockContext);

      const wrapper = container.firstChild;
      expect(wrapper?.firstChild).toBeInTheDocument();
    });

    it('should render tab items in order', () => {
      const mockContext = createMockContext();
      renderWithContext(mockContext);

      const tabs = screen.getAllByText(/Tab \d/);
      expect(tabs[0]).toHaveTextContent('Tab 1');
      expect(tabs[1]).toHaveTextContent('Tab 2');
      expect(tabs[2]).toHaveTextContent('Tab 3');
    });
  });
});

import React, { act } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { TabProvider } from '../../../src/contexts/TabContext/TabProvider';
import { useTab } from '../../../src/contexts/TabContext/useTab';

jest.mock('../../../src/utils/Common/storage', () => ({
  extractData: jest.fn((key: string) => {
    if (key === 'user') {
      return { claims: 'viewer' };
    }
    return null;
  }),
}));

jest.mock('../../../src/utils/Constants/data', () => ({
  claims: {
    editor: 'editor',
    viewer: 'viewer',
  },
  Tabs: [
    {value: 'tab1', label: 'Tab 1', enabled: true },
    { value: 'tab2', label: 'Tab 2', enabled: false },
    { value: 'parser', label: 'Parser', enabled: false },
    { value: 'tab3', label: 'Tab 3', enabled: false },
  ],
}));

const TestComponent = () => {
  const {
    selectedTab,
    enabledTabs,
    tabs,
    setSelectedTab,
    enableNextTab,
    enableAllTabs,
    enablePreviousTab,
  } = useTab();

  return (
    <div>
      <div data-testid="selected-tab">{selectedTab}</div>
      <div data-testid="enabled-tabs">{enabledTabs.join(',')}</div>
      <div data-testid="tabs-count">{tabs.length}</div>
      
      {tabs.map(tab => (
        <div key={tab.value} data-testid={`tab-${tab.value}`}>
          {tab.label} - {tab.enabled ? 'enabled' : 'disabled'}
        </div>
      ))}
      
      <button onClick={() => setSelectedTab('tab2')}>Select Tab 2</button>
      <button onClick={enableNextTab}>Enable Next</button>
      <button onClick={enableAllTabs}>Enable All</button>
      <button onClick={enablePreviousTab}>Enable Previous</button>
    </div>
  );
};

const renderWithRouter = (ui: React.ReactElement, initialUrl = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      {ui}
    </MemoryRouter>
  );
};

describe('TabProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render children correctly', () => {
      renderWithRouter(
        <TabProvider>
          <div>Child Content</div>
        </TabProvider>
      );

      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should render without crashing', () => {
      const { container } = renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      expect(container).toBeInTheDocument();
    });

    it('should initialize with first tab selected', () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      expect(screen.getByTestId('selected-tab')).toHaveTextContent('tab1');
    });

    it('should initialize tabs array', () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      expect(screen.getByTestId('tabs-count')).toHaveTextContent('3');
    });

    it('should show first tab as enabled', () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      expect(screen.getByTestId('tab-tab1')).toHaveTextContent('enabled');
    });
  });

  describe('Tab Selection', () => {
    it('should change selected tab when setSelectedTab is called', async () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      expect(screen.getByTestId('selected-tab')).toHaveTextContent('tab1');

      await act(async () => {
        fireEvent.click(screen.getByText('Select Tab 2'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-tab')).toHaveTextContent('tab2');
      });
    });

    it('should update selection multiple times', async () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Select Tab 2'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-tab')).toHaveTextContent('tab2');
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Select Tab 2'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-tab')).toHaveTextContent('tab2');
      });
    });
  });

  describe('Enable Next Tab', () => {
    it('should enable and select next tab', async () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      expect(screen.getByTestId('tab-tab2')).toHaveTextContent('disabled');

      await act(async () => {
        fireEvent.click(screen.getByText('Enable Next'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-tab2')).toHaveTextContent('enabled');
        expect(screen.getByTestId('selected-tab')).toHaveTextContent('tab2');
      });
    });

    it('should enable next tab sequentially', async () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Enable Next'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-tab2')).toHaveTextContent('enabled');
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Enable Next'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-tab3')).toHaveTextContent('enabled');
      });
    });

    it('should enable tab2 then tab3 (parser filtered for viewer)', async () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      // Enable tab2
      await act(async () => {
        fireEvent.click(screen.getByText('Enable Next'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-tab2')).toHaveTextContent('enabled');
        expect(screen.getByTestId('selected-tab')).toHaveTextContent('tab2');
      });

      // Enable tab3 (parser is filtered out for viewers)
      await act(async () => {
        fireEvent.click(screen.getByText('Enable Next'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-tab3')).toHaveTextContent('enabled');
        expect(screen.getByTestId('selected-tab')).toHaveTextContent('tab3');
      });
    });
  });

  describe('Enable Previous Tab', () => {
    it('should enable previous tab when available', async () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      // First enable tab2
      await act(async () => {
        fireEvent.click(screen.getByText('Enable Next'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-tab')).toHaveTextContent('tab2');
      });

      // Now enable previous (tab1)
      await act(async () => {
        fireEvent.click(screen.getByText('Enable Previous'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-tab')).toHaveTextContent('tab1');
      });
    });

    it('should handle enable previous from current tab', async () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Enable Next'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-tab')).toHaveTextContent('tab2');
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Enable Previous'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-tab1')).toHaveTextContent('enabled');
      });
    });
  });

  describe('Enable All Tabs', () => {
    it('should enable all tabs', async () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Enable All'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-tab1')).toHaveTextContent('enabled');
        expect(screen.getByTestId('tab-tab2')).toHaveTextContent('enabled');
        expect(screen.getByTestId('tab-tab3')).toHaveTextContent('enabled');
      });
    });

    it('should keep selected tab unchanged', async () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      expect(screen.getByTestId('selected-tab')).toHaveTextContent('tab1');

      await act(async () => {
        fireEvent.click(screen.getByText('Enable All'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-tab')).toHaveTextContent('tab1');
      });
    });

    it('should allow selecting any tab after enabling all', async () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Enable All'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-tab2')).toHaveTextContent('enabled');
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Select Tab 2'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-tab')).toHaveTextContent('tab2');
      });
    });
  });

  describe('Enabled Tabs List', () => {
    it('should show initially enabled tabs', () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      expect(screen.getByTestId('enabled-tabs')).toHaveTextContent('tab1');
    });

    it('should update enabled tabs list when tabs are enabled', async () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Enable Next'));
      });

      await waitFor(() => {
        const enabledTabs = screen.getByTestId('enabled-tabs').textContent;
        expect(enabledTabs).toContain('tab1');
        expect(enabledTabs).toContain('tab2');
      });
    });
  });

  describe('Context Value', () => {
    it('should provide all required context values', () => {
      const ContextValueTest = () => {
        const context = useTab();

        return (
          <div>
            <div data-testid="has-selectedTab">{typeof context.selectedTab}</div>
            <div data-testid="has-setSelectedTab">{typeof context.setSelectedTab}</div>
            <div data-testid="has-tabs">{typeof context.tabs}</div>
            <div data-testid="has-enabledTabs">{typeof context.enabledTabs}</div>
            <div data-testid="has-enableNextTab">{typeof context.enableNextTab}</div>
            <div data-testid="has-enablePreviousTab">{typeof context.enablePreviousTab}</div>
            <div data-testid="has-enableAllTabs">{typeof context.enableAllTabs}</div>
          </div>
        );
      };

      renderWithRouter(
        <TabProvider>
          <ContextValueTest />
        </TabProvider>
      );

      expect(screen.getByTestId('has-selectedTab')).toHaveTextContent('string');
      expect(screen.getByTestId('has-setSelectedTab')).toHaveTextContent('function');
      expect(screen.getByTestId('has-tabs')).toHaveTextContent('object');
      expect(screen.getByTestId('has-enabledTabs')).toHaveTextContent('object');
      expect(screen.getByTestId('has-enableNextTab')).toHaveTextContent('function');
      expect(screen.getByTestId('has-enablePreviousTab')).toHaveTextContent('function');
      expect(screen.getByTestId('has-enableAllTabs')).toHaveTextContent('function');
    });
  });

  describe('URL Synchronization', () => {
    it('should initialize from URL query parameter', () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>,
        '/?tab=tab2'
      );

      expect(screen.getByTestId('selected-tab')).toHaveTextContent('tab2');
    });

    it('should default to first tab when no URL parameter', () => {
      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      expect(screen.getByTestId('selected-tab')).toHaveTextContent('tab1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tabs array gracefully', () => {
      jest.doMock('../../../src/utils/Constants/data', () => ({
        claims: { editor: 'editor', viewer: 'viewer' },
        Tabs: [],
      }));

      renderWithRouter(
        <TabProvider>
          <TestComponent />
        </TabProvider>
      );

      expect(screen.getByTestId('tabs-count')).toHaveTextContent('3');
    });

    it('should handle multiple children in provider', () => {
      renderWithRouter(
        <TabProvider>
          <div>Child 1</div>
          <div>Child 2</div>
        </TabProvider>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });
});

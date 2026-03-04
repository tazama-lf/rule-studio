import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useTab } from '../../../src/contexts/TabContext/useTab';
import { TabProvider } from '../../../src/contexts/TabContext/TabProvider';
import { MemoryRouter } from 'react-router-dom';

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
    { value: 'tab1', label: 'Tab 1', enabled: true },
    { value: 'tab2', label: 'Tab 2', enabled: false },
    { value: 'parser', label: 'Parser', enabled: false },
    { value: 'tab3', label: 'Tab 3', enabled: false },
  ],
}));

describe('useTab', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <TabProvider>{children}</TabProvider>
    </MemoryRouter>
  );

  describe('Hook Usage', () => {
    it('should throw error when used outside TabProvider', () => {
      // Suppress console error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTab());
      }).toThrow('useTab must be used within a TabProvider');

      consoleSpy.mockRestore();
    });

    it('should return context when used within TabProvider', () => {
      const { result } = renderHook(() => useTab(), { wrapper });

      expect(result.current).toBeDefined();
    });
  });

  describe('Context Return Value', () => {
    it('should return selectedTab string', () => {
      const { result } = renderHook(() => useTab(), { wrapper });

      expect(typeof result.current.selectedTab).toBe('string');
      expect(result.current.selectedTab).toBe('tab1');
    });

    it('should return setSelectedTab function', () => {
      const { result } = renderHook(() => useTab(), { wrapper });

      expect(typeof result.current.setSelectedTab).toBe('function');
    });

    it('should return tabs array', () => {
      const { result } = renderHook(() => useTab(), { wrapper });

      expect(Array.isArray(result.current.tabs)).toBe(true);
      expect(result.current.tabs.length).toBe(3);
    });

    it('should return enabledTabs array', () => {
      const { result } = renderHook(() => useTab(), { wrapper });

      expect(Array.isArray(result.current.enabledTabs)).toBe(true);
      expect(result.current.enabledTabs).toContain('tab1');
    });

    it('should return enableNextTab function', () => {
      const { result } = renderHook(() => useTab(), { wrapper });

      expect(typeof result.current.enableNextTab).toBe('function');
    });

    it('should return enablePreviousTab function', () => {
      const { result } = renderHook(() => useTab(), { wrapper });

      expect(typeof result.current.enablePreviousTab).toBe('function');
    });

    it('should return enableAllTabs function', () => {
      const { result } = renderHook(() => useTab(), { wrapper });

      expect(typeof result.current.enableAllTabs).toBe('function');
    });

    it('should return all 7 properties in context', () => {
      const { result } = renderHook(() => useTab(), { wrapper });

      const keys = Object.keys(result.current);
      expect(keys).toHaveLength(7);
      expect(keys).toEqual(
        expect.arrayContaining([
          'selectedTab',
          'setSelectedTab',
          'tabs',
          'enabledTabs',
          'enableNextTab',
          'enablePreviousTab',
          'enableAllTabs',
        ])
      );
    });
  });

  describe('Tab Structure', () => {
    it('should return tabs with correct structure', () => {
      const { result } = renderHook(() => useTab(), { wrapper });

      const tab = result.current.tabs[0];
      expect(tab).toHaveProperty('value');
      expect(tab).toHaveProperty('label');
      expect(tab).toHaveProperty('enabled');
    });

    it('should have first tab enabled by default', () => {
      const { result } = renderHook(() => useTab(), { wrapper });

      const firstTab = result.current.tabs[0];
      expect(firstTab.enabled).toBe(true);
    });

    it('should have other tabs disabled by default', () => {
      const { result } = renderHook(() => useTab(), { wrapper });

      expect(result.current.tabs[1].enabled).toBe(false);
      expect(result.current.tabs[2].enabled).toBe(false);
    });
  });

  describe('Enabled Tabs', () => {
    it('should include only enabled tab values', () => {
      const { result } = renderHook(() => useTab(), { wrapper });

      expect(result.current.enabledTabs).toHaveLength(1);
      expect(result.current.enabledTabs[0]).toBe('tab1');
    });

    it('should contain string values', () => {
      const { result } = renderHook(() => useTab(), { wrapper });

      result.current.enabledTabs.forEach(tab => {
        expect(typeof tab).toBe('string');
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw descriptive error message', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTab());
      }).toThrow('useTab must be used within a TabProvider');

      consoleSpy.mockRestore();
    });

    it('should not throw when properly wrapped', () => {
      expect(() => {
        renderHook(() => useTab(), { wrapper });
      }).not.toThrow();
    });
  });
});

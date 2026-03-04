import React from 'react';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ModalProvider } from '../../../src/contexts/ModalContext/ModalProvider';
import { useModal } from '../../../src/contexts/ModalContext/useModal';

const theme = createTheme();

describe('useModal', () => {
  describe('Hook Usage', () => {
    it('should return modal context when used within ModalProvider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider theme={theme}>
          <ModalProvider>{children}</ModalProvider>
        </ThemeProvider>
      );

      const { result } = renderHook(() => useModal(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.open).toBeDefined();
      expect(result.current.close).toBeDefined();
    });

    it('should provide open function', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider theme={theme}>
          <ModalProvider>{children}</ModalProvider>
        </ThemeProvider>
      );

      const { result } = renderHook(() => useModal(), { wrapper });

      expect(typeof result.current.open).toBe('function');
    });

    it('should provide close function', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider theme={theme}>
          <ModalProvider>{children}</ModalProvider>
        </ThemeProvider>
      );

      const { result } = renderHook(() => useModal(), { wrapper });

      expect(typeof result.current.close).toBe('function');
    });

    it('should throw error when used outside ModalProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useModal());
      }).toThrow('useModal must be used within a ModalProvider');

      console.error = originalError;
    });

    it('should return consistent context value', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider theme={theme}>
          <ModalProvider>{children}</ModalProvider>
        </ThemeProvider>
      );

      const { result, rerender } = renderHook(() => useModal(), { wrapper });

      expect(typeof result.current.open).toBe('function');
      expect(typeof result.current.close).toBe('function');

      rerender();

      expect(typeof result.current.open).toBe('function');
      expect(typeof result.current.close).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should throw specific error message', () => {
      const originalError = console.error;
      console.error = jest.fn();

      try {
        renderHook(() => useModal());
      } catch (error) {
        expect((error as Error).message).toBe('useModal must be used within a ModalProvider');
      }

      console.error = originalError;
    });

    it('should not throw when properly wrapped', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider theme={theme}>
          <ModalProvider>{children}</ModalProvider>
        </ThemeProvider>
      );

      expect(() => {
        renderHook(() => useModal(), { wrapper });
      }).not.toThrow();
    });
  });

  describe('Context Type', () => {
    it('should have correct context type structure', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider theme={theme}>
          <ModalProvider>{children}</ModalProvider>
        </ThemeProvider>
      );

      const { result } = renderHook(() => useModal(), { wrapper });

      expect(result.current).toHaveProperty('open');
      expect(result.current).toHaveProperty('close');
      expect(Object.keys(result.current)).toHaveLength(2);
    });

    it('should return object with function properties', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider theme={theme}>
          <ModalProvider>{children}</ModalProvider>
        </ThemeProvider>
      );

      const { result } = renderHook(() => useModal(), { wrapper });

      expect(typeof result.current).toBe('object');
      expect(typeof result.current.open).toBe('function');
      expect(typeof result.current.close).toBe('function');
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should return functions for multiple hook calls', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider theme={theme}>
          <ModalProvider>{children}</ModalProvider>
        </ThemeProvider>
      );

      const { result: result1 } = renderHook(() => useModal(), { wrapper });
      const { result: result2 } = renderHook(() => useModal(), { wrapper });

      expect(typeof result1.current.open).toBe('function');
      expect(typeof result2.current.open).toBe('function');
      expect(typeof result1.current.close).toBe('function');
      expect(typeof result2.current.close).toBe('function');
    });

    it('should work with nested providers', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider theme={theme}>
          <ModalProvider>
            <ModalProvider>{children}</ModalProvider>
          </ModalProvider>
        </ThemeProvider>
      );

      const { result } = renderHook(() => useModal(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.open).toBeDefined();
      expect(result.current.close).toBeDefined();
    });
  });
});

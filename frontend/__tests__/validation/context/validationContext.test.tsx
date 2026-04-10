import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { ValidationContext } from '../../../src/validation/context/ValidationContext';
import { ValidationProvider } from '../../../src/validation/context/ValidationProvider';
import { useValidationContext } from '../../../src/validation/context/useValidationContext';
import * as contextExports from '../../../src/validation/context';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ValidationProvider>{children}</ValidationProvider>
);

describe('validation context', () => {
  it('exports context API from index', () => {
    expect(contextExports.ValidationProvider).toBeDefined();
    expect(contextExports.ValidationContext).toBe(ValidationContext);
    expect(contextExports.useValidationContext).toBe(useValidationContext);
  });

  it('throws when hook is used outside provider', () => {
    expect(() => renderHook(() => useValidationContext())).toThrow(
      'useValidationContext must be used within ValidationProvider'
    );
  });

  it('starts with an empty state', () => {
    const { result } = renderHook(() => useValidationContext(), { wrapper });

    expect(result.current.errors.size).toBe(0);
    expect(result.current.hasErrors).toBe(false);
    expect(result.current.getNodeError('missing')).toBeUndefined();
    expect(result.current.getAllErrors()).toEqual([]);
    expect(result.current.getErrorCount()).toBe(0);
  });

  it('sets and updates node errors', () => {
    const { result } = renderHook(() => useValidationContext(), { wrapper });

    act(() => {
      result.current.setNodeErrors('n1', 'Node A', 'SetVariable', { name: 'Required' });
    });

    expect(result.current.hasErrors).toBe(true);
    expect(result.current.getErrorCount()).toBe(1);
    expect(result.current.getNodeError('n1')).toEqual({
      nodeId: 'n1',
      nodeName: 'Node A',
      nodeType: 'SetVariable',
      errors: { name: 'Required' },
    });

    act(() => {
      result.current.setNodeErrors('n1', 'Node A', 'SetVariable', { value: 'Invalid' });
    });

    expect(result.current.getNodeError('n1')?.errors).toEqual({ value: 'Invalid' });
  });

  it('deletes an entry when setNodeErrors receives empty errors', () => {
    const { result } = renderHook(() => useValidationContext(), { wrapper });

    act(() => {
      result.current.setNodeErrors('n1', 'Node A', 'SetVariable', { name: 'Required' });
      result.current.setNodeErrors('n1', 'Node A', 'SetVariable', {});
    });

    expect(result.current.getNodeError('n1')).toBeUndefined();
    expect(result.current.hasErrors).toBe(false);
  });

  it('clears one node or all nodes', () => {
    const { result } = renderHook(() => useValidationContext(), { wrapper });

    act(() => {
      result.current.setNodeErrors('n1', 'Node A', 'SetVariable', { a: 'err-a' });
      result.current.setNodeErrors('n2', 'Node B', 'If', { b: 'err-b' });
    });

    expect(result.current.getErrorCount()).toBe(2);

    act(() => {
      result.current.clearNodeErrors('n1');
    });

    expect(result.current.getNodeError('n1')).toBeUndefined();
    expect(result.current.getNodeError('n2')).toBeDefined();
    expect(result.current.getErrorCount()).toBe(1);

    act(() => {
      result.current.clearAllErrors();
    });

    expect(result.current.getAllErrors()).toEqual([]);
    expect(result.current.getErrorCount()).toBe(0);
    expect(result.current.hasErrors).toBe(false);
  });
});

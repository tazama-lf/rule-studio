import { renderHook } from '@testing-library/react';

import { useInputHelpers } from '../../../../src/components/RuleBuilder/RightSidebar/components/ParameterFields/hooks/useInputHelpers';
import { useInputVisibility } from '../../../../src/components/RuleBuilder/RightSidebar/components/ParameterFields/hooks/useInputVisibility';
import type { NodeInput } from '../../../../src/types/nodeInput';

const baseInput: NodeInput = {
  key: 'name',
  label: 'Name',
  defaultValue: 'default',
};

describe('useInputHelpers', () => {
  it('resolves current values and fetch-db fallbacks', () => {
    const { result } = renderHook(() =>
      useInputHelpers({
        currentParams: { variable: 'v1', resultVar: 'r1' },
        isFetchDBNode: true,
        isReadOnly: false,
        viewOnly: false,
        variableError: null,
      })
    );

    expect(result.current.getCurrentValue({ ...baseInput, key: 'resultVar', defaultValue: 'd1' })).toBe('r1');
    expect(result.current.getCurrentValue({ ...baseInput, key: 'variable', defaultValue: 'd2' })).toBe('v1');
    expect(result.current.getCurrentValue(baseInput)).toBe('default');
  });

  it('builds helper text for different states', () => {
    const { result } = renderHook(() =>
      useInputHelpers({
        currentParams: {},
        isFetchDBNode: false,
        isReadOnly: true,
        viewOnly: false,
        variableError: 'Variable name conflict',
      })
    );

    expect(result.current.getHelperText(baseInput, 'Field error', false, false)).toBe('Field error');
    expect(result.current.getHelperText(baseInput, undefined, true, false)).toBe('Variable name conflict');
    expect(result.current.getHelperText(baseInput, undefined, false, false)).toBe('Start/End nodes cannot be edited');

    const { result: viewOnlyResult } = renderHook(() =>
      useInputHelpers({
        currentParams: {},
        isFetchDBNode: false,
        isReadOnly: false,
        viewOnly: true,
        variableError: null,
      })
    );

    expect(viewOnlyResult.current.getHelperText(baseInput, undefined, false, false)).toBe('View only mode');
    expect(viewOnlyResult.current.getHelperText(baseInput, undefined, false, true)).toBe('View only mode');
  });

  it('returns min rows by field type', () => {
    const { result } = renderHook(() =>
      useInputHelpers({
        currentParams: {},
        isFetchDBNode: false,
        isReadOnly: false,
        viewOnly: false,
        variableError: null,
      })
    );

    expect(result.current.getMinRows({ ...baseInput, key: 'code' }, false)).toBe(15);
    expect(result.current.getMinRows({ ...baseInput, key: 'query' }, false)).toBe(10);
    expect(result.current.getMinRows(baseInput, true)).toBe(8);
    expect(result.current.getMinRows(baseInput, false)).toBe(1);
  });
});

describe('useInputVisibility', () => {
  it('hides loop-specific fields based on loop type', () => {
    const { result } = renderHook(() =>
      useInputVisibility({
        currentParams: { loopType: 'while' },
      })
    );

    expect(result.current.shouldRenderInput({ ...baseInput, key: 'indexVariable' })).toBe(false);
    expect(result.current.shouldRenderInput({ ...baseInput, key: 'arrayVariable' })).toBe(false);
    expect(result.current.shouldRenderInput({ ...baseInput, key: 'loopCondition' })).toBe(true);
    expect(result.current.shouldRenderInput({ ...baseInput, key: 'filterCondition' })).toBe(false);
  });

  it('hides type-specific fields for node modes', () => {
    const { result: arrayResult } = renderHook(() =>
      useInputVisibility({
        currentParams: { operation: 'reverse' },
        nodeType: 'arrayOp',
      })
    );
    expect(arrayResult.current.shouldRenderInput({ ...baseInput, key: 'value' })).toBe(false);

    const { result: mathResult } = renderHook(() =>
      useInputVisibility({
        currentParams: { method: 'sin' },
        nodeType: 'math',
      })
    );
    expect(mathResult.current.shouldRenderInput({ ...baseInput, key: 'value2' })).toBe(false);

    const { result: stringResult } = renderHook(() =>
      useInputVisibility({
        currentParams: { method: 'trim' },
        nodeType: 'stringFunc',
      })
    );
    expect(stringResult.current.shouldRenderInput({ ...baseInput, key: 'separator' })).toBe(false);
    expect(stringResult.current.shouldRenderInput({ ...baseInput, key: 'start' })).toBe(false);

    const { result: objectResult } = renderHook(() =>
      useInputVisibility({
        currentParams: { operation: 'keys' },
        nodeType: 'objectOp',
      })
    );
    expect(objectResult.current.shouldRenderInput({ ...baseInput, key: 'keys' })).toBe(false);
    expect(objectResult.current.shouldRenderInput({ ...baseInput, key: 'property' })).toBe(false);
    expect(objectResult.current.shouldRenderInput({ ...baseInput, key: 'sourceObjects' })).toBe(false);
  });

  it('handles exit and ternary visibility', () => {
    const { result: exitResult } = renderHook(() =>
      useInputVisibility({
        currentParams: { exitType: 'break' },
      })
    );
    expect(exitResult.current.shouldRenderInput({ ...baseInput, key: 'returnValue' })).toBe(false);

    const { result: ternaryResult } = renderHook(() =>
      useInputVisibility({
        currentParams: {},
        nodeType: 'Ternary',
      })
    );
    expect(ternaryResult.current.shouldRenderInput({ ...baseInput, key: 'ternaryTree' })).toBe(false);
    expect(ternaryResult.current.shouldRenderInput({ ...baseInput, key: 'storeResult' })).toBe(false);
    expect(ternaryResult.current.shouldRenderInput({ ...baseInput, key: 'resultVar' })).toBe(false);
    expect(ternaryResult.current.shouldRenderInput({ ...baseInput, key: 'safeField' })).toBe(true);
  });
});

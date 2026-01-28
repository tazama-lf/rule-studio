import { useCallback } from 'react';
import type { NodeInput } from '../../../../../../types/nodeInput';

interface UseInputVisibilityProps {
  currentParams: Record<string, string>;
  nodeType?: string;
}

export const useInputVisibility = ({ currentParams, nodeType }: UseInputVisibilityProps) => {
  const shouldRenderInput = useCallback((input: NodeInput): boolean => {
    const loopType = currentParams['loopType'];
    const operation = currentParams['operation'];
    const method = currentParams['method'];
    const exitType = currentParams['exitType'];

    if (['customIncrement', 'incrementOperation', 'initialization'].includes(input.key) && loopType !== 'for') {
      return false;
    }
    if (input.key === 'loopCondition' && loopType !== 'for' && loopType !== 'while') {
      return false;
    }
    if (input.key === 'itemVariable' && (loopType === 'for' || loopType === 'while')) {
      return false;
    }
    if (input.key === 'indexVariable' && loopType === 'while') {
      return false;
    }
    if (input.key === 'arrayVariable' && loopType === 'while') {
      return false;
    }
    if (input.key === 'resultVariable' && (loopType === 'for' || loopType === 'while')) {
      return false;
    }
    if (input.key === 'filterCondition' && loopType !== 'filter') {
      return false;
    }
    if (input.key === 'condition' && !['every', 'some', 'find', 'map', 'forEach'].includes(loopType)) {
      return false;
    }
    if (['reduceLogic', 'initialValue'].includes(input.key) && loopType !== 'reduce') {
      return false;
    }

    if (nodeType === 'arrayOp' && input.key === 'value' && !['push', 'concat', 'findIndex'].includes(operation)) {
      return false;
    }

    if (nodeType === 'math' && input.key === 'value2' && method !== 'pow') {
      return false;
    }

    if (nodeType === 'stringFunc') {
      if (input.key === 'separator' && method !== 'split') {
        return false;
      }
      if (['start', 'end'].includes(input.key) && method !== 'slice' && method !== 'substring') {
        return false;
      }
    }

    if (nodeType === 'objectOp') {
      if (input.key === 'keys' && operation !== 'destructure') {
        return false;
      }
      if (input.key === 'property' && operation !== 'hasOwnProperty') {
        return false;
      }
      if (input.key === 'sourceObjects' && operation !== 'assign') {
        return false;
      }
    }

    if (input.key === 'returnValue' && exitType !== 'return') {
      return false;
    }

    if (nodeType === 'Ternary' && (input.key === 'ternaryTree' || input.key === 'storeResult' || input.key === 'resultVar')) {
      return false;
    }

    return true;
  }, [currentParams, nodeType]);

  return { shouldRenderInput };
};

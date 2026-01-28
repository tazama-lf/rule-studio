import { useCallback } from 'react';
import type { NodeInput } from '../../../../../../types/nodeInput';

interface UseInputHelpersProps {
  currentParams: Record<string, string>;
  isFetchDBNode: boolean;
  isReadOnly: boolean;
  viewOnly: boolean;
  variableError: string | null;
}

export const useInputHelpers = ({
  currentParams,
  isFetchDBNode,
  isReadOnly,
  viewOnly,
  variableError,
}: UseInputHelpersProps) => {
  const getCurrentValue = useCallback((input: NodeInput): string => {
    let value = input.key in currentParams ? currentParams[input.key] : input.defaultValue;

    if (isFetchDBNode) {
      if (input.key === 'resultVar' && !(input.key in currentParams)) {
        value = 'variable' in currentParams ? currentParams['variable'] : input.defaultValue;
      } else if (input.key === 'variable' && !(input.key in currentParams)) {
        value = 'resultVar' in currentParams ? currentParams['resultVar'] : input.defaultValue;
      }
    }

    return value;
  }, [currentParams, isFetchDBNode]);

  const getHelperText = useCallback(
    (input: NodeInput, fieldError: string | undefined, isVariableNameField: boolean, isCodeField: boolean): string => {
      if (fieldError) return fieldError;
      if (isVariableNameField && variableError) return variableError;
      if (isReadOnly) return 'Start/End nodes cannot be edited';
      if (viewOnly) return 'View only mode';
      if (isCodeField) return 'Write or paste your code here';
      return `Default: ${input.defaultValue}. Drop variables here.`;
    },
    [isReadOnly, viewOnly, variableError]
  );

  const getMinRows = useCallback((input: NodeInput, isMultiline: boolean): number => {
    if (['code', 'loopBody'].includes(input.key)) return 15;
    if (['query', 'importStatement'].includes(input.key)) return 10;
    if (isMultiline) return 8;
    return 1;
  }, []);

  return { getCurrentValue, getHelperText, getMinRows };
};

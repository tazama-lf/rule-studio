import { useCallback } from 'react';

export interface IfCondition {
  type: 'if' | 'elseif' | 'else';
  condition?: string;
}

interface UseIfConditionsProps {
  currentParams: Record<string, string>;
}

export const useIfConditions = ({
  currentParams,
}: UseIfConditionsProps) => {
  // Parse conditions from params
  const getConditions = useCallback((): IfCondition[] => {
    try {
      const conditionsStr = currentParams['conditions'];
      return conditionsStr ? JSON.parse(conditionsStr) : [{ type: 'if', condition: 'x > 5' }];
    } catch {
      return [{ type: 'if', condition: 'x > 5' }];
    }
  }, [currentParams]);

  return {
    conditions: getConditions(),
  };
};

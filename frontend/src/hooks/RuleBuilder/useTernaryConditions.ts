import { useMemo, useCallback } from 'react';
import type { TernaryNode } from '../../components/RuleBuilder/RightSidebar/components/TernaryConditionEditor';

interface UseTernaryConditionsProps {
  currentParams: Record<string, string>;
  onParamChange: (key: string, value: string) => void;
}

export const useTernaryConditions = ({ currentParams, onParamChange }: UseTernaryConditionsProps) => {
  const ternaryTree = useMemo<TernaryNode>(() => {
    try {
      const treeStr = currentParams.ternaryTree || 
        '{"condition":"true","trueValue":{"type":"value","value":"\'yes\'"},"falseValue":{"type":"value","value":"\'no\'"}}';
      return JSON.parse(treeStr) as TernaryNode;
    } catch {
      return {
        condition: 'true',
        trueValue: { type: 'value', value: "'yes'" },
        falseValue: { type: 'value', value: "'no'" }
      };
    }
  }, [currentParams.ternaryTree]);

  const handleTreeChange = useCallback((newTree: TernaryNode) => {
    const jsonStr = JSON.stringify(newTree);
    onParamChange('ternaryTree', jsonStr);
  }, [onParamChange]);

  const handleStoreResultChange = useCallback((checked: boolean) => {
    onParamChange('storeResult', String(checked));
  }, [onParamChange]);

  const handleResultVarChange = useCallback((newValue: string) => {
    onParamChange('resultVar', newValue);
  }, [onParamChange]);

  return {
    ternaryTree,
    handleTreeChange,
    handleStoreResultChange,
    handleResultVarChange,
  };
};

import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { useGetGlobalVariablesQuery } from '../../redux/Api/Rule-builder';
import { globalVariables } from '../../utils/Flow/GlobalVariables';
import { useVariableTree, useLocalVariables } from './index';

interface UseVariableDataProps {
  ruleId?: string;
  allNodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
}

export const useVariableData = ({ ruleId, allNodes, edges, selectedNodeId }: UseVariableDataProps) => {
  const { data: globalVarsData } = useGetGlobalVariablesQuery(
    ruleId || '',
    { skip: !ruleId }
  );

  const currentGlobalVariables = useMemo(() => {
    if (globalVarsData) {
      return {
        RuleRequest: globalVarsData.RuleRequest || {},
        RuleConfig: globalVarsData.RuleConfig || {},
        RuleResult: globalVarsData.RuleResult || {},
      };
    }
    return globalVariables;
  }, [globalVarsData]);

  const { localVars, loopVars, loopContext } = useLocalVariables({ 
    allNodes, 
    edges, 
    selectedNodeId 
  });

  const localVarsTree = useVariableTree({ obj: localVars, parentPath: '' });
  const loopVarsTree = useVariableTree({ obj: loopVars, parentPath: '' });
  const ruleRequestTree = useVariableTree({ obj: currentGlobalVariables.RuleRequest, parentPath: 'RuleRequest' });
  const ruleConfigTree = useVariableTree({ obj: currentGlobalVariables.RuleConfig, parentPath: 'RuleConfig' });
  const ruleResultTree = useVariableTree({ obj: currentGlobalVariables.RuleResult || {}, parentPath: 'RuleResult' });

  return {
    localVarsTree,
    loopVarsTree,
    loopContext,
    ruleRequestTree,
    ruleConfigTree,
    ruleResultTree,
  };
};

import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { useGetGlobalVariablesQuery } from '../../redux/Api/Rule-builder';
import { globalVariables } from '../../utils/Flow/GlobalVariables';
import { useLocalVariables } from './index';
import type { VariableTreeNode } from './useVariableTree';

// Helper to get value type matching VariableTreeNode type union
const getValueType = (value: unknown): VariableTreeNode['type'] => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const type = typeof value;
  if (type === 'object' || type === 'string' || type === 'number' || type === 'boolean') {
    return type;
  }
  // For other types (bigint, symbol, undefined, function), default to 'string' representation
  return 'string';
};

const buildVariableTree = (obj: unknown, parentPath: string = ''): VariableTreeNode[] => {
  if (typeof obj !== 'object' || obj === null) {
    return [];
  }

  const result: VariableTreeNode[] = [];
  const entries = Object.entries(obj);

  entries.forEach(([key, value]) => {
    const currentPath = parentPath ? `${parentPath}.${key}` : key;
    const valueType = getValueType(value);
    const isDraggable = true;

    const node: VariableTreeNode = {
      key,
      path: currentPath,
      value,
      type: valueType,
      isDraggable,
    };

    if (valueType === 'object') {
      node.children = buildVariableTree(value, currentPath);
    } else if (valueType === 'array' && Array.isArray(value)) {
      node.children = value.map((item, index) => {
        const arrayPath = `${currentPath}[${index}]`;
        const itemType = getValueType(item);
        const itemNode: VariableTreeNode = {
          key: `[${index}]`,
          path: arrayPath,
          value: item,
          type: itemType,
          isDraggable: true,
        };

        if (itemType === 'object') {
          itemNode.children = buildVariableTree(item, arrayPath);
        }

        return itemNode;
      });
    }

    result.push(node);
  });

  return result;
};

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

  const localVarsTree = useMemo(() => 
    buildVariableTree(localVars, ''), 
    [localVars]
  );
  
  const loopVarsTree = useMemo(() => 
    buildVariableTree(loopVars, ''), 
    [loopVars]
  );
  
  const ruleRequestTree = useMemo(() => 
    buildVariableTree(currentGlobalVariables.RuleRequest, 'RuleRequest'), 
    [currentGlobalVariables.RuleRequest]
  );
  
  const ruleConfigTree = useMemo(() => 
    buildVariableTree(currentGlobalVariables.RuleConfig, 'RuleConfig'), 
    [currentGlobalVariables.RuleConfig]
  );
  
  const ruleResultTree = useMemo(() => 
    buildVariableTree(currentGlobalVariables.RuleResult || {}, 'RuleResult'), 
    [currentGlobalVariables.RuleResult]
  );

  return {
    localVarsTree,
    loopVarsTree,
    loopContext,
    ruleRequestTree,
    ruleConfigTree,
    ruleResultTree,
  };
};

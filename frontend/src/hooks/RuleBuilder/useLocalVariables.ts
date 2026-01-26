import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { useNodeScope } from './useNodeScope';

interface NodeData {
  nodeType?: string;
  params?: Record<string, string>;
  [key: string]: unknown;
}

interface UseLocalVariablesProps {
  allNodes: Node[];
  edges?: Edge[];
  selectedNodeId?: string | null;
}

interface UseLocalVariablesResult {
  localVars: Record<string, unknown>;
  loopVars: Record<string, unknown>;
  loopContext: {
    isInLoopScope: boolean;
    loopNames: string[];
  };
}

export const useLocalVariables = ({ 
  allNodes, 
  edges = [], 
  selectedNodeId = null 
}: UseLocalVariablesProps): UseLocalVariablesResult => {

  const { parentLoops, isInLoopScope } = useNodeScope({
    nodeId: selectedNodeId,
    edges,
    nodes: allNodes,
  });

  return useMemo(() => {
    const localVars: Record<string, unknown> = {};
    const loopVars: Record<string, unknown> = {};

    allNodes.forEach((node) => {
      const nodeData = node.data as NodeData;
      const params = nodeData?.params || {};

      if (nodeData?.nodeType === 'SetVariable') {
        const varName = params.name || params.variableName;
        const varValue = params.value || params.variableValue || '';
        const dataType = params.dataType || 'any';
        
        if (varName) {
          if (!varValue || varValue.trim() === '' || dataType === 'undefined') {
            localVars[varName] = undefined;
          } else {
            localVars[varName] = varValue;
          }
        }
      }

      if (nodeData?.nodeType === 'FetchDB') {
        const resultVar = params.resultVar || params.variable;
        if (resultVar) {
          localVars[resultVar] = '{ }';
        }
        const queryVar = params.queryVar;
        if (queryVar) {
          localVars[queryVar] = 'string';
        }
      }

      if (nodeData?.nodeType === 'CustomFunction') {
        const resultVar = params.resultVar;
        if (resultVar) {
          localVars[resultVar] = '{ }';
        }
      }
      if (nodeData?.nodeType === 'math') {
        const resultVar = params.resultVar;
        if (resultVar) {
          localVars[resultVar] = '<number>';
        }
      }

      if (nodeData?.nodeType === 'stringFunc') {
        const resultVar = params.resultVar;
        if (resultVar) {
          localVars[resultVar] = '<string>';
        }
      }

      if (nodeData?.nodeType === 'arrayOp') {
        const resultVar = params.resultVar;
        if (resultVar) {
          localVars[resultVar] = '<array | value>';
        }
      }

      if (nodeData?.nodeType === 'objectOp') {
        const resultVar = params.resultVar;
        const operation = params.operation;
        if (resultVar) {
          if (operation === 'keys' || operation === 'values' || operation === 'entries') {
            localVars[resultVar] = '<array>';
          } else if (operation === 'hasOwnProperty') {
            localVars[resultVar] = '<boolean>';
          } else if (operation === 'assign' || operation === 'freeze' || operation === 'seal') {
            localVars[resultVar] = '<object>';
          }
        }
      }

      if (nodeData?.nodeType === 'length') {
        const resultVar = params.resultVar;
        if (resultVar) {
          localVars[resultVar] = '<number>';
        }
      }

      if (nodeData?.nodeType === 'Ternary') {
        const storeResult = params.storeResult !== 'false';
        const resultVar = params.resultVar;
        if (storeResult && resultVar) {
          localVars[resultVar] = '<any>';
        }
      }

      if (nodeData?.nodeType === 'Loop') {
        const loopType = params.loopType;
        const resultVar = params.resultVariable;

        if (resultVar && ['map', 'filter', 'reduce', 'find', 'every', 'some'].includes(loopType)) {
          const varType = (loopType === 'map' || loopType === 'filter') ? '<array>' : '<any>';
          localVars[resultVar] = varType;
        }

        if (loopType === 'for' && params.arrayResultVariable) {
          localVars[params.arrayResultVariable] = '<array>';
        }
      }
    });

    const loopNames: string[] = [];
    
    parentLoops.forEach((loopContext, index) => {
      const params = loopContext.loopNode.data.params as Record<string, string>;
      const loopLabel = (loopContext.loopNode.data as { label?: string }).label || `Loop ${index + 1}`;
      loopNames.push(loopLabel);

      if (loopContext.itemVariable && loopContext.itemVariable.trim() !== '') {
        loopVars[loopContext.itemVariable] = `<item from ${loopContext.arrayVariable}>`;
      }

      if (loopContext.indexVariable && loopContext.indexVariable.trim() !== '') {
        loopVars[loopContext.indexVariable] = '<number>';
      }

      if (loopContext.arrayVariable) {
        loopVars[loopContext.arrayVariable] = '<array>';
      }

      if ((loopContext.loopType === 'map' || loopContext.loopType === 'filter') && params.resultVariable) {
        loopVars[params.resultVariable] = '<array>';
      }
    });

    return {
      localVars,
      loopVars,
      loopContext: {
        isInLoopScope,
        loopNames,
      },
    };
  }, [allNodes, parentLoops, isInLoopScope]);
};

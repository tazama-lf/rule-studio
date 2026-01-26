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

/**
 * Extract local variables from SetVariable, FetchDB, and CustomFunction nodes
 * Also extracts loop variables if selectedNodeId is inside a loop scope
 */
export const useLocalVariables = ({ 
  allNodes, 
  edges = [], 
  selectedNodeId = null 
}: UseLocalVariablesProps): UseLocalVariablesResult => {
  // Get loop scope context for selected node
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

      // SetVariable nodes
      if (nodeData?.nodeType === 'SetVariable') {
        const varName = params.name || params.variableName;
        const varValue = params.value || params.variableValue || '';
        const dataType = params.dataType || 'any';
        
        if (varName) {
          // Handle undefined or empty value
          if (!varValue || varValue.trim() === '' || dataType === 'undefined') {
            localVars[varName] = undefined;
          } else {
            localVars[varName] = varValue;
          }
        }
      }

      // FetchDB nodes
      if (nodeData?.nodeType === 'FetchDB') {
        const resultVar = params.resultVar || params.variable;
        if (resultVar) {
          localVars[resultVar] = '{ }'; // Placeholder for DB result
        }
      }

      // Custom Function nodes
      if (nodeData?.nodeType === 'CustomFunction') {
        const resultVar = params.resultVar;
        if (resultVar) {
          localVars[resultVar] = '{ }'; // Placeholder for function result
        }
      }

      // Math Function nodes
      if (nodeData?.nodeType === 'math') {
        const resultVar = params.resultVar;
        if (resultVar) {
          localVars[resultVar] = '<number>'; // Math result
        }
      }

      // String Function nodes
      if (nodeData?.nodeType === 'stringFunc') {
        const resultVar = params.resultVar;
        if (resultVar) {
          localVars[resultVar] = '<string>'; // String result
        }
      }

      // Array Operation nodes
      if (nodeData?.nodeType === 'arrayOp') {
        const resultVar = params.resultVar;
        if (resultVar) {
          localVars[resultVar] = '<array | value>';
        }
      }

      // Object Operation nodes
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

      // length nodes
      if (nodeData?.nodeType === 'length') {
        const resultVar = params.resultVar;
        if (resultVar) {
          localVars[resultVar] = '<number>';
        }
      }

      if (nodeData?.nodeType === 'Loop') {
        const loopType = params.loopType;
        const resultVar = params.resultVariable;

        // For loops that return a single value or a new array
        if (resultVar && ['map', 'filter', 'reduce', 'find', 'every', 'some'].includes(loopType)) {
          const varType = (loopType === 'map' || loopType === 'filter') ? '<array>' : '<any>';
          localVars[resultVar] = varType;
        }
        
        // For "for" loops, register array result variable
        if (loopType === 'for' && params.arrayResultVariable) {
          localVars[params.arrayResultVariable] = '<array>';
        }
      }
    });

    // Extract loop variables from parent loops (if node is in loop scope)
    const loopNames: string[] = [];
    
    parentLoops.forEach((loopContext, index) => {
      const params = loopContext.loopNode.data.params as Record<string, string>;
      const loopLabel = (loopContext.loopNode.data as { label?: string }).label || `Loop ${index + 1}`;
      loopNames.push(loopLabel);

      // Add item variable (current element in iteration) - only if defined
      // For 'for' and 'while' loops, this is optional
      if (loopContext.itemVariable && loopContext.itemVariable.trim() !== '') {
        loopVars[loopContext.itemVariable] = `<item from ${loopContext.arrayVariable}>`;
      }

      // Add index variable (current iteration index) - only if defined
      if (loopContext.indexVariable && loopContext.indexVariable.trim() !== '') {
        loopVars[loopContext.indexVariable] = '<number>';
      }

      // Add array variable reference
      if (loopContext.arrayVariable) {
        loopVars[loopContext.arrayVariable] = '<array>';
      }

      // For map/filter loops, add result variable if exists
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

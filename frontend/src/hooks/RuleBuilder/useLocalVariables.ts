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
  globalVarsData?: {
    RuleRequest?: Record<string, unknown>;
    RuleConfig?: Record<string, unknown>;
    RuleResult?: Record<string, unknown>;
  } | null;
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
  selectedNodeId = null,
  globalVarsData = null
}: UseLocalVariablesProps): UseLocalVariablesResult => {

  const { parentLoops, isInLoopScope } = useNodeScope({
    nodeId: selectedNodeId,
    edges,
    nodes: allNodes,
  });

  return useMemo(() => {
    const localVars: Record<string, unknown> = {};
    const loopVars: Record<string, unknown> = {};

    /**
     * Helper function to get value from nested path (e.g., "RuleRequest.pain001.GroupHeader.MessageId")
     */
    const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
      const parts = path.split('.');
      let current: unknown = obj;
      
      for (const part of parts) {
        // Handle array indexing like "items[0]"
        const arrayMatch = part.match(/^(.+?)\[(\d+)\]$/);
        if (arrayMatch) {
          const [, key, index] = arrayMatch;
          current = (current as Record<string, unknown>)?.[key];
          if (Array.isArray(current)) {
            current = current[parseInt(index, 10)];
          }
        } else {
          current = (current as Record<string, unknown>)?.[part];
        }
        
        if (current === undefined || current === null) {
          return undefined;
        }
      }
      
      return current;
    };

    /**
     * Resolve template variables {{ variableName }} in a string to actual values
     */
    const resolveTemplateVariables = (value: string, depth = 0): string => {
      // Prevent infinite recursion
      if (depth > 10) {
        return value;
      }

      const templateRegex = /\{\{\s*([^}]+?)\s*\}\}/g;
      
      return value.replace(templateRegex, (match, variablePath: string) => {
        const trimmedPath = variablePath.trim();
        
        // Check if it's already resolved in localVars
        if (localVars[trimmedPath] !== undefined) {
          const localValue = localVars[trimmedPath];
          if (typeof localValue === 'string' && !localValue.startsWith('<') && localValue !== '{ }') {
            // Recursively resolve if it contains more template variables
            if (/\{\{\s*([^}]+?)\s*\}\}/.test(localValue)) {
              return resolveTemplateVariables(localValue, depth + 1);
            }
            return localValue;
          }
        }
        
        // Try to resolve from global variables
        if (globalVarsData) {
          const globalVars = {
            RuleRequest: globalVarsData.RuleRequest || {},
            RuleConfig: globalVarsData.RuleConfig || {},
            RuleResult: globalVarsData.RuleResult || {},
          };
          
          const globalValue = getNestedValue(globalVars as Record<string, unknown>, trimmedPath);
          
          if (globalValue !== undefined && globalValue !== null) {
            if (typeof globalValue === 'object') {
              return JSON.stringify(globalValue);
            }
            return String(globalValue);
          }
        }
        
        // Keep the original template if not resolved
        return match;
      });
    };

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
            // Resolve template variables in the value
            const resolvedValue = resolveTemplateVariables(varValue);
            localVars[varName] = resolvedValue;
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
          // Try to evaluate the ternary if possible
          try {
            const ternaryTree = params.ternaryTree ? JSON.parse(params.ternaryTree) : null;
            if (ternaryTree && globalVarsData) {
              // Simple evaluation: check if trueValue/falseValue reference global variables
              const evaluateValue = (valueNode: { type: string; value: string }): unknown => {
                if (!valueNode || valueNode.type !== 'value') return '<any>';
                
                const value = valueNode.value;
                
                // Try to extract variable references like "ruleConfig.config.parameters.maxQueryRange"
                // Remove type assertions and whitespace
                const cleaned = value.replace(/\s*as\s+\w+/g, '').trim();
                
                // Check if it references a global variable
                if (cleaned.startsWith('ruleConfig.')) {
                  const path = cleaned.replace('ruleConfig.', 'RuleConfig.');
                  const globalVars = {
                    RuleRequest: globalVarsData.RuleRequest || {},
                    RuleConfig: globalVarsData.RuleConfig || {},
                    RuleResult: globalVarsData.RuleResult || {},
                  };
                  const resolvedValue = getNestedValue(globalVars as Record<string, unknown>, path);
                  if (resolvedValue !== undefined) return resolvedValue;
                }
                
                if (cleaned.startsWith('req.')) {
                  const path = cleaned.replace('req.', 'RuleRequest.');
                  const globalVars = {
                    RuleRequest: globalVarsData.RuleRequest || {},
                    RuleConfig: globalVarsData.RuleConfig || {},
                    RuleResult: globalVarsData.RuleResult || {},
                  };
                  const resolvedValue = getNestedValue(globalVars as Record<string, unknown>, path);
                  if (resolvedValue !== undefined) return resolvedValue;
                }
                
                // If it's a literal value
                if (cleaned === 'undefined' || cleaned === 'null') return undefined;
                if (cleaned === 'true') return true;
                if (cleaned === 'false') return false;
                if (!isNaN(Number(cleaned))) return Number(cleaned);
                // If quoted string, remove quotes
                if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
                    (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
                  return cleaned.slice(1, -1);
                }
                
                return '<any>';
              };
              
              // Try to evaluate the condition
              const condition = ternaryTree.condition || '';
              const cleaned = condition.replace(/\s*as\s+\w+/g, '').replace(/[()]/g, '').trim();
              
              let conditionResult = false;
              if (cleaned.startsWith('!')) {
                // Negation
                const varPath = cleaned.slice(1).replace('ruleConfig.', 'RuleConfig.').replace('req.', 'RuleRequest.');
                const globalVars = {
                  RuleRequest: globalVarsData.RuleRequest || {},
                  RuleConfig: globalVarsData.RuleConfig || {},
                  RuleResult: globalVarsData.RuleResult || {},
                };
                const value = getNestedValue(globalVars as Record<string, unknown>, varPath);
                conditionResult = !value;
              } else {
                // Positive check
                const varPath = cleaned.replace('ruleConfig.', 'RuleConfig.').replace('req.', 'RuleRequest.');
                const globalVars = {
                  RuleRequest: globalVarsData.RuleRequest || {},
                  RuleConfig: globalVarsData.RuleConfig || {},
                  RuleResult: globalVarsData.RuleResult || {},
                };
                const value = getNestedValue(globalVars as Record<string, unknown>, varPath);
                conditionResult = !!value;
              }
              
              const resultValue = conditionResult 
                ? evaluateValue(ternaryTree.trueValue)
                : evaluateValue(ternaryTree.falseValue);
              
              localVars[resultVar] = resultValue;
            } else {
              localVars[resultVar] = '<any>';
            }
          } catch {
            // If parsing/evaluation fails, fall back to type placeholder
            localVars[resultVar] = '<any>';
          }
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
  }, [allNodes, parentLoops, isInLoopScope, globalVarsData]);
};

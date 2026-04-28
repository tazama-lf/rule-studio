import { useMemo, useRef } from 'react';
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

  // Stable reference for globalVarsData to prevent unnecessary re-computations
  const globalVarsDataRef = useRef<string>('');
  const currentGlobalVarsDataStr = JSON.stringify(globalVarsData);
  
  // Only update ref if the stringified value actually changed
  if (globalVarsDataRef.current !== currentGlobalVarsDataStr) {
    globalVarsDataRef.current = currentGlobalVarsDataStr;
  }

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
      // Early return if no template variables present
      if (!value || typeof value !== 'string' || !value.includes('{{')) {
        return value;
      }

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

    // First pass: Process all nodes except Ternary to populate local variables
    // Collect Ternary nodes for second pass
    const ternaryNodes: Node[] = [];
    
    allNodes.forEach((node) => {
      const nodeData = node.data as NodeData;
      const params = nodeData?.params || {};

      // Skip Ternary nodes in first pass - collect for later
      if (nodeData?.nodeType === 'Ternary') {
        ternaryNodes.push(node);
        return;
      }

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
            // Cast the stored value to the declared dataType so the variable tree
            // shows the correct type label (number, boolean, array, object, string).
            if (dataType === 'number') {
              const num = Number(resolvedValue);
              localVars[varName] = isNaN(num) ? resolvedValue : num;
            } else if (dataType === 'boolean') {
              const normalized = resolvedValue.trim().toLowerCase();
              localVars[varName] = normalized === 'true' || normalized === '1';
            } else if (dataType === 'array') {
              try {
                const parsed = JSON.parse(resolvedValue);
                localVars[varName] = Array.isArray(parsed) ? parsed : [];
              } catch {
                localVars[varName] = [];
              }
            } else if (dataType === 'object') {
              try {
                const parsed = JSON.parse(resolvedValue);
                localVars[varName] = (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) ? parsed : {};
              } catch {
                localVars[varName] = {};
              }
            } else {
              // 'string' or 'any' — keep the resolved string value
              localVars[varName] = resolvedValue;
            }
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

    // Second pass: Process only Ternary nodes after all other variables are populated
    // This ensures we can resolve variable references in ternary branches
    ternaryNodes.forEach((node) => {
      const nodeData = node.data as NodeData;
      const params = nodeData?.params || {};
      
      const storeResult = params.storeResult !== 'false';
      const resultVar = params.resultVar;
      if (storeResult && resultVar) {
          // Try to resolve the actual value from ternary tree
          try {
            const treeStr = params.ternaryTree;
            if (treeStr) {
              interface TernaryBranch {
                type: 'value' | 'nested';
                value?: string;
                nested?: TernaryNode;
              }
              
              interface TernaryNode {
                condition: string;
                trueValue: TernaryBranch;
                falseValue: TernaryBranch;
              }
              
              const tree = JSON.parse(treeStr) as TernaryNode;
              
              // Helper to extract value from a branch (recursively if nested)
              const extractBranchValue = (branch: TernaryBranch): unknown => {
                if (branch.type === 'value') {
                  const value = branch.value?.trim();
                  if (!value) return undefined;
                  
                  // Check if it contains variable reference like {{ variableName }}
                  const varMatch = value.match(/\{\{\s*([^}]+?)\s*\}\}/);
                  if (varMatch) {
                    const varPath = varMatch[1].trim();
                    
                    // Try to resolve from local variables first
                    if (localVars[varPath] !== undefined) {
                      return localVars[varPath];
                    }
                    
                    // Try to resolve from global variables
                    if (globalVarsData) {
                      const globalVars = {
                        RuleRequest: globalVarsData.RuleRequest || {},
                        RuleConfig: globalVarsData.RuleConfig || {},
                        RuleResult: globalVarsData.RuleResult || {},
                      };
                      
                      const globalValue = getNestedValue(globalVars as Record<string, unknown>, varPath);
                      if (globalValue !== undefined && globalValue !== null) {
                        // Return the actual typed value, not a string conversion
                        return globalValue;
                      }
                    }
                    
                    // Variable reference not resolved, return the original template
                    return value;
                  }
                  
                  // Direct value (literal) - try to parse it as a literal value
                  // Check if it's a number
                  if (/^-?\d+(\.\d+)?$/.test(value)) {
                    return parseFloat(value);
                  }
                  
                  // Check if it's a boolean
                  if (value === 'true') return true;
                  if (value === 'false') return false;
                  
                  // Check if it's null
                  if (value === 'null') return null;
                  
                  // Check if it's a quoted string - remove quotes
                  if ((value.startsWith("'") && value.endsWith("'")) || 
                      (value.startsWith('"') && value.endsWith('"'))) {
                    return value.slice(1, -1);
                  }
                  
                  // Return as-is (unquoted string)
                  return value;
                } else if (branch.type === 'nested' && branch.nested) {
                  // For nested ternary, we can't evaluate at design time
                  // Try to extract from the nested true branch as a preview
                  return extractBranchValue(branch.nested.trueValue);
                }
                return undefined;
              };
              
              // Try to get the true value as the primary preview
              const trueValue = extractBranchValue(tree.trueValue);
              const falseValue = extractBranchValue(tree.falseValue);
              
              // Show the resolved value, preferring trueValue
              if (trueValue !== undefined) {
                localVars[resultVar] = trueValue;
              } else if (falseValue !== undefined) {
                localVars[resultVar] = falseValue;
              } else {
                localVars[resultVar] = '<any>';
              }
            } else {
              localVars[resultVar] = '<any>';
            }
          } catch {
            // If we can't parse the tree, fall back to <any>
            localVars[resultVar] = '<any>';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNodes, parentLoops, isInLoopScope, globalVarsDataRef.current]);
};


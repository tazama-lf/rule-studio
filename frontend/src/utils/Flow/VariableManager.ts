import type { Node } from '@xyflow/react';
import type { EditableNodeData } from '../../components/RuleBuilder/EditableNode';

export interface Variable {
  name: string;
  nodeId: string;
  nodeLabel: string;
  defaultValue?: string;
}

export interface VariableValidation {
  isValid: boolean;
  error?: string;
  existingNodeId?: string;
}

export const extractVariablesFromNodes = (nodes: Node[]): Variable[] => {
  const variables: Variable[] = [];
  
  nodes.forEach((node) => {
    const nodeData = node.data as EditableNodeData;
    
    if (nodeData.nodeType === 'SetVariable' || nodeData.nodeType === 'SetVariableWithType') {
      const params = nodeData.params || {};
      const varName = params.name || params.variableName;

      if (varName && varName.trim()) {
        variables.push({
          name: varName.trim(),
          nodeId: node.id,
          nodeLabel: nodeData.label || 'Set Variable',
          defaultValue: params.value || params.variableValue,
        });
      }
    }
  });
  
  return variables;
};

export const validateVariableName = (
  variableName: string,
  currentNodeId: string,
  existingVariables: Variable[]
): VariableValidation => {
  const trimmedName = variableName.trim();
  
  if (!trimmedName) {
    return {
      isValid: false,
      error: 'Variable name cannot be empty',
    };
  }
  
  const validIdentifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  if (!validIdentifierRegex.test(trimmedName)) {
    return {
      isValid: false,
      error: 'Variable name must be a valid identifier (letters, numbers, _, $)',
    };
  }
  
  const reservedKeywords = [
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
    'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
    'if', 'import', 'in', 'instanceof', 'let', 'new', 'return', 'super', 'switch',
    'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
    'async', 'await', 'enum', 'implements', 'interface', 'package', 'private',
    'protected', 'public', 'static',
  ];
  
  if (reservedKeywords.includes(trimmedName)) {
    return {
      isValid: false,
      error: `"${trimmedName}" is a reserved keyword`,
    };
  }
  
  const duplicate = existingVariables.find(
    (v) => v.name === trimmedName && v.nodeId !== currentNodeId
  );
  
  if (duplicate) {
    return {
      isValid: false,
      error: `Variable "${trimmedName}" already declared in "${duplicate.nodeLabel}"`,
      existingNodeId: duplicate.nodeId,
    };
  }
  
  return { isValid: true };
};

export const getAvailableVariables = (
  nodes: Node[],
  excludeNodeId?: string
): string[] => {
  const variables = extractVariablesFromNodes(nodes);
  
  return variables
    .filter((v) => !excludeNodeId || v.nodeId !== excludeNodeId)
    .map((v) => v.name);
};

export const isVariableDeclaredBefore = (
  variableName: string,
  usingNodeId: string,
  nodes: Node[],
  edges: Array<{ source: string; target: string }>
): boolean => {
  const declaringNodes = nodes.filter((node) => {
    const nodeData = node.data as EditableNodeData;
    if (nodeData.nodeType !== 'SetVariable' && nodeData.nodeType !== 'SetVariableWithType') return false;

    const params = nodeData.params || {};
    const varName = params.name || params.variableName;
    return varName?.trim() === variableName;
  });
  
  if (declaringNodes.length === 0) return false;
  
  const declaringNodeIds = new Set(declaringNodes.map((n) => n.id));
  const visited = new Set<string>();
  const queue: string[] = [];
  
  const nodesWithIncoming = new Set(edges.map((e) => e.target));
  const startNodes = nodes.filter((n) => !nodesWithIncoming.has(n.id));
  
  startNodes.forEach((n) => queue.push(n.id));
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    
    if (currentId === usingNodeId) {
      return [...visited].some((id) => declaringNodeIds.has(id));
    }
    
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    
    edges
      .filter((e) => e.source === currentId)
      .forEach((e) => queue.push(e.target));
  }
  
  return false;
};

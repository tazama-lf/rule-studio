import type { Node } from '@xyflow/react';
import type { NodeTemplate } from '../../hooks/RuleBuilder/useNodePalette';
import { getAllNodeTemplates } from './nodeTemplateService';

export interface FunctionParameter {
  name: string;
  type: string;
  label: string;
  required?: boolean;
}

export const getFunctionParameters = (
  functionName: string,
  allNodes?: Node[]
): FunctionParameter[] | null => {
  const templates = getAllNodeTemplates();
  const definitionTemplate = templates.find(
    (node) => 
      (node.function_name === functionName || node.nodeType === functionName || node.type === functionName) &&
      (node.mode === 'definition' || node.generation_type === 'definition')
  );

  if (definitionTemplate?.parameters) {
    return definitionTemplate.parameters;
  }

  if (allNodes && allNodes.length > 0) {
    const definitionNode = allNodes.find(
      (node) => {
        const nodeData = node.data as {
          function_name?: string;
          params?: Record<string, string>;
          mode?: string;
          generation_type?: string;
        };
        return (
          (nodeData?.function_name === functionName || 
           nodeData?.params?.function_name === functionName) &&
          (nodeData?.mode === 'definition' || nodeData?.generation_type === 'definition')
        );
      }
    );

    if (definitionNode?.data?.params) {
      const params = definitionNode.data.params as Record<string, string>;
      
      if (params.parameters) {
        try {
          const parsedParams = JSON.parse(params.parameters);
          if (Array.isArray(parsedParams) && parsedParams.length > 0) {
            return parsedParams;
          }
        } catch (error) {
          console.warn('Failed to parse custom function parameters:', error);
        }
      }
      
      if (params.code_template && typeof params.code_template === 'string') {
        return extractParametersFromCode(params.code_template);
      }
    }
  }

  return null;
};

export const extractParametersFromCode = (code: string): FunctionParameter[] => {
  if (!code || typeof code !== 'string') return [];

  let paramsString = '';
  const arrowMatch = code.match(/(?:export\s+)?const\s+\w+\s*=\s*\(([^)]*)\)\s*=>/);
  
  if (arrowMatch) {
    paramsString = arrowMatch[1].trim();
  } else {
    const functionMatch = code.match(/function\s+\w+\s*\(([^)]*)\)/);
    if (functionMatch) {
      paramsString = functionMatch[1].trim();
    }
  }

  if (!paramsString) return [];

  const params = paramsString.split(',').map((param) => {
    const trimmed = param.trim();
    const optionalMatch = trimmed.match(/(\w+)\?\s*:\s*([\w[\]]+)/);
    if (optionalMatch) {
      return {
        name: optionalMatch[1],
        type: optionalMatch[2],
        label: optionalMatch[1].charAt(0).toUpperCase() + optionalMatch[1].slice(1),
        required: false,
      };
    }
    
    const match = trimmed.match(/(\w+)\s*:\s*([\w[\]]+)/);
    if (match) {
      return {
        name: match[1],
        type: match[2],
        label: match[1].charAt(0).toUpperCase() + match[1].slice(1),
        required: true,
      };
    }
    return {
      name: trimmed,
      type: 'any',
      label: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
      required: true,
    };
  });

  return params.filter((p) => p.name);
};

export const generateFunctionArgs = (
  parameters: FunctionParameter[],
  params: Record<string, string>
): string => {
  if (!parameters || parameters.length === 0) {
    return '';
  }

  const args = parameters.map((param) => {
    const value = params[param.name] || '';
    
    if (!value) {
      if (param.required === false) {
        return '';
      }
      return '';
    }
    
    const isVariable = /\{\{\s*.+?\s*\}\}/.test(value);
    
    if (isVariable) {
      return value.replace(/\{\{\s*(.+?)\s*\}\}/g, '$1');
    }
    
    const paramType = param.type?.toLowerCase() || 'any';
    
    if (paramType === 'number' || paramType === 'boolean') {
      return value;
    }
    
    if (paramType === 'string') {
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        return value;
      }
      return `"${value}"`;
    }
    
    if (paramType.includes('[]') || paramType === 'object' || paramType === 'any') {
      return value;
    }
    return value;
  }).filter(arg => arg !== '');

  return args.join(', ');
};

export const usesDynamicParameters = (template: NodeTemplate | null | undefined): boolean => {
  return template?.useDefinitionParameters === true;
};

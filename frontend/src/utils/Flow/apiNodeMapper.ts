import type { NodeTemplate } from '../../hooks/RuleBuilder/useNodePalette';

interface ApiNodeInput {
  key: string;
  label: string;
  type: string;
  defaultValue?: string | boolean | number;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface ApiNode {
  id: number;
  node_json: {
    name: string;
    node_type: string;
    label: string;
    description: string | null;
    type: string;
    category: string;
    color: string;
    handles: {
      source: boolean;
      target: boolean;
    };
    inputs: ApiNodeInput[];
    code_template: string;
    default_data: Record<string, unknown>;
  };
  tenant_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const mapApiNodeToTemplate = (apiNode: ApiNode): NodeTemplate => {
  const { node_json } = apiNode;
  return {
    type: node_json.node_type,
    displayName: node_json.label,
    description: node_json.description || '',
    label: node_json.label,
    color: node_json.color,
    bgColor: getBgColorFromHex(node_json.color),
    isFunction: node_json.type === 'function',
    code_template: node_json.code_template,
    inputs: node_json.inputs?.map((input) => ({
      key: input.key,
      label: input.label,
      defaultValue: input.defaultValue != null ? String(input.defaultValue) : '',
      type: input.type,
      required: input.required || false,
      placeholder: input.placeholder,
      options: input.options,
    })) || [],
    handles: {
      source: node_json.handles?.source || false,
      target: node_json.handles?.target || false,
    },
  };
};

const getBgColorFromHex = (hexColor: string): string => {
  const colorMap: Record<string, string> = {
    '#4CAF50': 'bg-green-50 border-green-400',
    '#F44336': 'bg-red-50 border-red-400',
    '#2196F3': 'bg-blue-50 border-blue-400',
    '#FF9800': 'bg-yellow-50 border-yellow-400',
    '#FFC107': 'bg-amber-50 border-amber-400',
    '#9C27B0': 'bg-purple-50 border-purple-400',
    '#00BCD4': 'bg-cyan-50 border-cyan-400',
    '#607D8B': 'bg-slate-50 border-slate-400',
    '#E91E63': 'bg-pink-50 border-pink-400',
    '#3F51B5': 'bg-indigo-50 border-indigo-400',
    '#009688': 'bg-teal-50 border-teal-400',
  };

  return colorMap[hexColor] || 'bg-gray-50 border-gray-400';
};

export const mapApiNodesToTemplates = (
  apiNodes: ApiNode[]
): Record<string, NodeTemplate> => {
  const uniqueNodes = Array.from(
    apiNodes
      .reduce((map, node) => {
        const nodeType = node.node_json.node_type;
        const existing = map.get(nodeType);
        if (!existing || new Date(node.updated_at) > new Date(existing.updated_at)) {
          map.set(nodeType, node);
        }
        return map;
      }, new Map<string, ApiNode>())
      .values()
  );

  return uniqueNodes.reduce(
    (acc, node) => {
      acc[node.node_json.node_type] = mapApiNodeToTemplate(node);
      return acc;
    },
    {} as Record<string, NodeTemplate>
  );
};

export const mapApiNodesToArray = (apiNodes: ApiNode[]): NodeTemplate[] => {
  const uniqueNodes = Array.from(
    apiNodes
      .reduce((map, node) => {
        const nodeType = node.node_json.node_type;
        const existing = map.get(nodeType);
        if (!existing || new Date(node.updated_at) > new Date(existing.updated_at)) {
          map.set(nodeType, node);
        }
        return map;
      }, new Map<string, ApiNode>())
      .values()
  );

  return uniqueNodes.map(mapApiNodeToTemplate);
};

import { mapApiNodeToTemplate } from './apiNodeMapper';
import { expandFunctionNodes } from './expandFunctionNodes';
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

interface ApiNode {
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

let apiNodesStore: ApiNode[] = [];
let expandedNodesStore: NodeTemplate[] = [];

export const setApiNodes = (apiNodes: unknown[]): void => {
  apiNodesStore = apiNodes as ApiNode[];
  // Expand nodes with modes into separate palette entries
  expandedNodesStore = expandFunctionNodes(apiNodesStore);
};

export const getApiNodes = (): ApiNode[] => {
  return apiNodesStore;
};


export const getNodeTemplate = (nodeType: string, mode?: string): NodeTemplate | undefined => {
  const result = expandedNodesStore.find((node) => {
    const typeMatch = node.type === nodeType || node.nodeType === nodeType;
    const modeMatch = !mode || node.mode === mode;
    return typeMatch && modeMatch;
  });
  
  return result;
};

export const getAllNodeTemplates = (): NodeTemplate[] => {
  return expandedNodesStore;
};

export const getNodeTemplatesMap = (): Record<string, NodeTemplate> => {
  const apiNodes = getApiNodes();
  return apiNodes.reduce(
    (acc, node) => {
      const nodeJson = node.node_json as { node_type?: string };
      if (nodeJson.node_type) {
        acc[nodeJson.node_type] = mapApiNodeToTemplate(node);
      }
      return acc;
    },
    {} as Record<string, NodeTemplate>
  );
};

import { useMemo } from 'react';
import type { NodeTemplate } from './useNodePalette';
import { mapApiNodesToArray, mapApiNodesToTemplates } from '../../utils/Flow/apiNodeMapper';

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
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

interface UseApiNodesProps {
  apiNodes?: ApiNode[];
  isLoading?: boolean;
  error?: unknown;
}

export const useApiNodes = ({ apiNodes = [], isLoading = false, error }: UseApiNodesProps) => {
  // Convert API nodes to template array
  const nodeTemplates = useMemo((): NodeTemplate[] => {
    if (!apiNodes || apiNodes.length === 0) {
      return [];
    }
    return mapApiNodesToArray(apiNodes);
  }, [apiNodes]);

  // Convert API nodes to template map (by type)
  const nodeTemplatesMap = useMemo((): Record<string, NodeTemplate> => {
    if (!apiNodes || apiNodes.length === 0) {
      return {};
    }
    return mapApiNodesToTemplates(apiNodes);
  }, [apiNodes]);

  return {
    nodeTemplates,
    nodeTemplatesMap,
    isLoading,
    error,
    hasNodes: nodeTemplates.length > 0,
  };
};

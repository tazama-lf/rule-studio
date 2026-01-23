import { useMemo } from 'react';
import type { NodeTemplate } from './useNodePalette';
import { mapApiNodesToArray, mapApiNodesToTemplates, type ApiNode } from '../../utils/Flow/apiNodeMapper';

interface UseApiNodesProps {
  apiNodes?: ApiNode[];
  isLoading?: boolean;
  error?: unknown;
}

export const useApiNodes = ({ apiNodes = [], isLoading = false, error }: UseApiNodesProps) => {
  const nodeTemplates = useMemo((): NodeTemplate[] => {
    if (!apiNodes || apiNodes.length === 0) {
      return [];
    }
    return mapApiNodesToArray(apiNodes);
  }, [apiNodes]);

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

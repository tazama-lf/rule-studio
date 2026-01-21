import { useMemo } from 'react';

export interface NodeTemplate {
  type?: string;
  nodeType?: string;
  label?: string;
  description?: string;
  color?: string;
  displayName?: string;
  isFunction?: boolean;
  bgColor?: string;
  code_template?: string;
  call_template?: string;
  mode?: 'definition' | 'call';
  generation_type?: 'definition' | 'call';
  visible_on_canvas?: string[];
  function_name?: string;
  parameters?: Array<{ name: string; type: string; label: string }>;
  useDefinitionParameters?: boolean;
  inputs?: Array<{
    key: string;
    label: string;
    defaultValue?: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
  }>;
  handles?: {
    source: boolean;
    target: boolean;
  };
}

interface UseNodePaletteProps {
  mode?: 'main' | 'modal';
  hideCustomFunctions?: boolean;
  hideImportNode?: boolean;
  apiNodes?: NodeTemplate[];
}

export const useNodePalette = ({ 
  mode = 'main', 
  hideCustomFunctions = false,
  hideImportNode = false,
  apiNodes = [],
}: UseNodePaletteProps) => {
  // Use API nodes if available, otherwise fall back to predefined nodes
  const basicNodes: NodeTemplate[] = useMemo(
    () => {
      if (apiNodes && apiNodes.length > 0) {
        let nodes = apiNodes.filter((node) => {
          // Filter by canvas visibility
          const visibleOn = node.visible_on_canvas || ['main', 'nested'];
          const isVisibleOnThisCanvas = mode === 'modal' 
            ? visibleOn.includes('nested') 
            : visibleOn.includes('main');
          
          return !node.isFunction && isVisibleOnThisCanvas;
        });
        
        // Filter out Import nodes if hideImportNode is true
        if (hideImportNode) {
          nodes = nodes.filter((node) => node.type !== 'Import');
        }
        return nodes;
      }
      const nodes = [
        { type: 'Import', label: 'Import', description: 'Import modules', color: '#8b5cf6' },
        { type: 'SetVariable', label: 'Set Variable', description: 'Assign value to variable', color: '#60a5fa' },
        { type: 'Log', label: 'Print Log', description: 'Output to console', color: '#fbbf24' },
        { type: 'If', label: 'If Condition', description: 'Conditional branch', color: '#ec4899' },
        { type: 'Code', label: 'Custom Code', description: 'Execute custom code', color: '#a78bfa' },
        { type: 'FetchDB', label: 'Fetch from DB', description: 'Database query', color: '#fb923c' },
        { type: 'ThrowError', label: 'Throw Error', description: 'Raise an error', color: '#f87171' },
      ];
      // Filter out Import nodes if hideImportNode is true
      return hideImportNode ? nodes.filter((n) => n.type !== 'Import') : nodes;
    },
    [apiNodes, hideImportNode, mode]
  );

  const modalNodes: NodeTemplate[] = useMemo(
    () => basicNodes.filter((n) => n.type !== 'Import' && n.type !== 'Start' && n.type !== 'End'),
    [basicNodes]
  );

  const functionNodes: NodeTemplate[] = useMemo(
    () => {
      if (apiNodes && apiNodes.length > 0) {
        return apiNodes.filter((node) => {
          if (!node.isFunction) return false;
          
          // Filter by canvas visibility
          const visibleOn = node.visible_on_canvas || ['nested'];
          return mode === 'modal' 
            ? visibleOn.includes('nested') 
            : visibleOn.includes('main');
        });
      }
      return [];
    },
    [apiNodes, mode]
  );

  const getNodesToShow = (activeTab: number): NodeTemplate[] => {
    if (hideCustomFunctions) {
      return mode === 'modal' ? modalNodes : basicNodes;
    }

    const isBasicTab = activeTab === 0;
    if (mode === 'modal') {
      return isBasicTab ? modalNodes : functionNodes;
    }

    return isBasicTab ? basicNodes : functionNodes;
  };

  return {
    basicNodes,
    modalNodes,
    functionNodes,
    getNodesToShow,
  };
};

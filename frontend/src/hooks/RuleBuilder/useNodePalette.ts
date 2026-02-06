import { useMemo } from 'react';

export interface NodeTemplate {
  type?: string;
  nodeType?: string;
  label?: string;
  description?: string;
  color?: string;
  displayName?: string;
  isFunction?: boolean;
  isPredefined?: boolean;
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
  hideStartEnd?: boolean;
  apiNodes?: NodeTemplate[];
}

export const useNodePalette = ({ 
  mode = 'main', 
  hideCustomFunctions = false,
  hideImportNode = false,
  hideStartEnd = false,
  apiNodes = [],
}: UseNodePaletteProps) => {
  const basicNodes: NodeTemplate[] = useMemo(
    () => {
      let nodes = apiNodes.filter((node) => {
        const visibleOn = node.visible_on_canvas || ['main', 'nested'];
        const isVisibleOnThisCanvas = mode === 'modal' 
          ? visibleOn.includes('nested') 
          : visibleOn.includes('main');
        
        return !node.isFunction && isVisibleOnThisCanvas;
      });
      
      if (hideImportNode) {
        nodes = nodes.filter((node) => node.type !== 'Import');
      }
      
      if (hideStartEnd) {
        nodes = nodes.filter((node) => node.type !== 'Start' && node.type !== 'End');
      }
      
      return nodes;
    },
    [apiNodes, hideImportNode, hideStartEnd, mode]
  );

  const modalNodes: NodeTemplate[] = useMemo(
    () => basicNodes.filter((n) => n.type !== 'Import' && n.type !== 'Start' && n.type !== 'End'),
    [basicNodes]
  );

  const functionNodes: NodeTemplate[] = useMemo(
    () => {
      return apiNodes.filter((node) => {
        if (!node.isFunction) return false;
        
        const visibleOn = node.visible_on_canvas || ['nested'];
        return mode === 'modal' 
          ? visibleOn.includes('nested') 
          : visibleOn.includes('main');
      });
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

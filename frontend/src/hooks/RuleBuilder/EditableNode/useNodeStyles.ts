import { useMemo } from 'react';
import { getNodeTemplate } from '../../../utils/Flow/nodeTemplateService';

interface NodeColors {
  backgroundColor: string;
  borderColor: string;
}

export const useNodeStyles = (nodeType: string): NodeColors => {
  return useMemo(() => {
    const template = getNodeTemplate(nodeType);
    const bgColor = template?.bgColor || '#e3f2fd';

    // Parse Tailwind-like class names to Material UI colors
    let backgroundColor = '#e3f2fd';
    let borderColor = '#2196f3';

    if (bgColor.includes('green')) {
      backgroundColor = '#e8f5e9';
      borderColor = '#4caf50';
    } else if (bgColor.includes('blue')) {
      backgroundColor = '#e3f2fd';
      borderColor = '#2196f3';
    } else if (bgColor.includes('yellow')) {
      backgroundColor = '#fff9c4';
      borderColor = '#ffeb3b';
    } else if (bgColor.includes('purple')) {
      backgroundColor = '#f3e5f5';
      borderColor = '#9c27b0';
    } else if (bgColor.includes('red')) {
      backgroundColor = '#ffebee';
      borderColor = '#f44336';
    } else if (bgColor.includes('orange')) {
      backgroundColor = '#fff3e0';
      borderColor = '#ff9800';
    } else if (bgColor.includes('pink')) {
      backgroundColor = '#fce4ec';
      borderColor = '#e91e63';
    } else if (bgColor.includes('gray')) {
      backgroundColor = '#f5f5f5';
      borderColor = '#9e9e9e';
    }

    return { backgroundColor, borderColor };
  }, [nodeType]);
};

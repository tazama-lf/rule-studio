import { useMemo } from 'react';

export interface VariableTreeNode {
  key: string;
  path: string;
  value: unknown;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  isDraggable: boolean;
  children?: VariableTreeNode[];
}

const getValueType = (value: unknown): 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value as 'object' | 'string' | 'number' | 'boolean';
};

const buildVariableTree = (obj: unknown, parentPath: string = ''): VariableTreeNode[] => {
  if (typeof obj !== 'object' || obj === null) {
    return [];
  }

  const result: VariableTreeNode[] = [];
  const entries = Object.entries(obj);

  entries.forEach(([key, value]) => {
    const currentPath = parentPath ? `${parentPath}.${key}` : key;
    const valueType = getValueType(value);
    const isDraggable = true;

    const node: VariableTreeNode = {
      key,
      path: currentPath,
      value,
      type: valueType,
      isDraggable,
    };

    if (valueType === 'object') {
      node.children = buildVariableTree(value, currentPath);
    } else if (valueType === 'array' && Array.isArray(value)) {
      node.children = value.map((item, index) => {
        const arrayPath = `${currentPath}[${index}]`;
        const itemType = getValueType(item);
        const itemNode: VariableTreeNode = {
          key: `[${index}]`,
          path: arrayPath,
          value: item,
          type: itemType,
          isDraggable: true,
        };

        if (itemType === 'object') {
          itemNode.children = buildVariableTree(item, arrayPath);
        }

        return itemNode;
      });
    }

    result.push(node);
  });

  return result;
};

interface UseVariableTreeProps {
  obj: unknown;
  parentPath?: string;
}

export const useVariableTree = ({ obj, parentPath = '' }: UseVariableTreeProps) => {
  return useMemo(() => buildVariableTree(obj, parentPath), [obj, parentPath]);
};

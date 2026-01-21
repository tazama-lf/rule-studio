import { useMemo } from 'react';
import type { EditableNodeData } from '../../components/RuleBuilder/EditableNode';
import { getNodeTemplate } from '../../utils/Flow/nodeTemplateService';
import { useNodeStyles, useNodeHandles } from './index';

export const useNodeRenderer = (nodeData: EditableNodeData) => {
  // Memoize mode extraction to prevent unnecessary lookups
  const mode = useMemo(
    () => nodeData.mode || nodeData.generation_type,
    [nodeData.mode, nodeData.generation_type]
  );
  
  // Extract clean nodeType (without mode if accidentally combined)
  const cleanNodeType = useMemo(() => {
    let nodeType = nodeData.nodeType;
    if (nodeType && nodeType.includes('::')) {
      [nodeType] = nodeType.split('::');
    }
    return nodeType;
  }, [nodeData.nodeType]);
  
  // Memoize template lookup (expensive operation)
  const template = useMemo(
    () => getNodeTemplate(cleanNodeType, mode),
    [cleanNodeType, mode]
  );
  
  const { backgroundColor, borderColor } = useNodeStyles(cleanNodeType);
  
  // Memoize local params to prevent unnecessary re-renders
  const localParams = useMemo(() => nodeData.params || {}, [nodeData.params]);

  // Check if this is a special node (Start, End, HandleTransaction)
  const isSpecialNode = useMemo(
    () =>
      cleanNodeType === 'Start' ||
      cleanNodeType === 'End' ||
      cleanNodeType === 'HandleTransaction',
    [cleanNodeType]
  );

  // Get conditions for If nodes
  const conditions = useMemo(() => {
    if (cleanNodeType !== 'If') return [];
    try {
      const conditionsStr = localParams['conditions'];
      return conditionsStr ? JSON.parse(conditionsStr) : [{ type: 'if', condition: 'x > 5' }];
    } catch {
      return [{ type: 'if', condition: 'x > 5' }];
    }
  }, [cleanNodeType, localParams]);

  // Get handle configurations (provide defaults if template not found)
  const hasTargetHandle = template?.handles?.target ?? true;
  const hasSourceHandle = template?.handles?.source ?? true;
  
  const { targetHandle, sourceHandles } = useNodeHandles(
    cleanNodeType,
    hasTargetHandle,
    hasSourceHandle,
    conditions
  );

  return {
    template,
    backgroundColor,
    borderColor,
    label: nodeData.label,
    localParams,
    isSpecialNode,
    conditions,
    targetHandle,
    sourceHandles,
  };
};

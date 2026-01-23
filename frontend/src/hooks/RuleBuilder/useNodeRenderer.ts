import { useMemo } from 'react';
import type { EditableNodeData } from '../../components/RuleBuilder/EditableNode';
import { getNodeTemplate } from '../../utils/Flow/nodeTemplateService';
import { useNodeStyles, useNodeHandles } from './index';

export const useNodeRenderer = (nodeData: EditableNodeData) => {
  const mode = useMemo(
    () => nodeData.mode || nodeData.generation_type,
    [nodeData.mode, nodeData.generation_type]
  );
  
  const cleanNodeType = useMemo(() => {
    let nodeType = nodeData.nodeType;
    if (nodeType && nodeType.includes('::')) {
      [nodeType] = nodeType.split('::');
    }
    return nodeType;
  }, [nodeData.nodeType]);
  
  const template = useMemo(
    () => getNodeTemplate(cleanNodeType, mode),
    [cleanNodeType, mode]
  );
  
  const { backgroundColor, borderColor } = useNodeStyles(cleanNodeType);
  
  const localParams = useMemo(() => nodeData.params || {}, [nodeData.params]);

  const isSpecialNode = useMemo(
    () =>
      cleanNodeType === 'Start' ||
      cleanNodeType === 'End' ||
      cleanNodeType === 'HandleTransaction',
    [cleanNodeType]
  );

  const conditions = useMemo(() => {
    if (cleanNodeType !== 'If') return [];
    try {
      const conditionsStr = localParams['conditions'];
      return conditionsStr ? JSON.parse(conditionsStr) : [{ type: 'if', condition: 'x > 5' }];
    } catch {
      return [{ type: 'if', condition: 'x > 5' }];
    }
  }, [cleanNodeType, localParams]);

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

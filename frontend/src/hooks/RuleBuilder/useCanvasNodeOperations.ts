import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { getNodeTemplate } from '../../utils/Flow/nodeTemplateService';
import { generateNodeId } from '../../utils/Flow/FlowDefaults';
import type { EditableNodeData } from '../../components/RuleBuilder/EditableNode';
import { useValidationContext } from '../../validation/context';

interface UseCanvasNodeOperationsProps {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  saveHistory: () => void;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

export const useCanvasNodeOperations = ({
  setNodes,
  saveHistory,
  setEdges,
}: UseCanvasNodeOperationsProps) => {
  const { clearNodeErrors } = useValidationContext();

  const createNodeFromTemplate = useCallback(
    (type: string, position: { x: number; y: number }, mode?: string) => {
      const template = getNodeTemplate(type, mode);
      const newNodeId = generateNodeId();

      // Initialize params with default values from template
      const defaultParams: Record<string, string> = {};
      if (template?.inputs) {
        template.inputs.forEach((input) => {
          defaultParams[input.key] = input.defaultValue || '';
        });
      }

      const newNode: Node = {
        id: newNodeId,
        type: 'editableNode',
        position,
        data: {
          label: template?.displayName || type,
          nodeType: type,
          params: defaultParams,
          mode: template?.mode,
          generation_type: template?.generation_type,
          function_name: template?.function_name,
          onChange: (value: string) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === newNodeId
                  ? { ...node, data: { ...node.data, label: value } }
                  : node
              )
            );
          },
          onParamChange: (paramKey: string, value: string) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === newNodeId
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        params: {
                          ...(node.data.params as Record<string, string> || {}),
                          [paramKey]: value,
                        },
                      },
                    }
                  : node
              )
            );
          },
        } as EditableNodeData,
      };

      saveHistory();
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, saveHistory]
  );

  // Update a node with new data
  const updateNode = useCallback(
    (nodeId: string, updates: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...updates } }
            : node
        )
      );
    },
    [setNodes]
  );

  // Delete selected nodes (excluding protected ones)
  const deleteSelectedNodes = useCallback(
    (currentNodes: Node[], selectedNodes: Node[]) => {
      const deletableNodes = selectedNodes.filter(
        (node) =>
          String(node.data.nodeType) !== 'Start' &&
          String(node.data.nodeType) !== 'HandleTransaction' &&
          String(node.data.nodeType) !== 'End'
      );

      if (deletableNodes.length > 0) {
        const deletableIds = new Set(deletableNodes.map((n) => n.id));

        deletableIds.forEach((nodeId) => {
          clearNodeErrors(nodeId);
        });

        setEdges((currentEdges) =>
          currentEdges.filter(
            (edge) => !deletableIds.has(edge.source) && !deletableIds.has(edge.target)
          )
        );

        return currentNodes.filter((node) => !deletableIds.has(node.id));
      }

      return currentNodes;
    },
    [setEdges, clearNodeErrors]
  );

  // Delete selected edges
  const deleteSelectedEdges = useCallback(
    (currentEdges: Edge[]) => {
      return currentEdges.filter((edge) => !edge.selected);
    },
    []
  );

  // Clear selections
  const clearSelections = useCallback(() => {
    setNodes((nds) => nds.map((node) => ({ ...node, selected: false })));
    setEdges((eds) => eds.map((edge) => ({ ...edge, selected: false })));
  }, [setNodes, setEdges]);

  // Check if a node is protected from deletion
  const isProtectedNode = useCallback((node: Node) => {
    const nodeType = String(node.data.nodeType);
    return (
      nodeType === 'Start' ||
      nodeType === 'HandleTransaction' ||
      nodeType === 'End'
    );
  }, []);

  return {
    createNodeFromTemplate,
    updateNode,
    deleteSelectedNodes,
    deleteSelectedEdges,
    clearSelections,
    isProtectedNode,
  };
};

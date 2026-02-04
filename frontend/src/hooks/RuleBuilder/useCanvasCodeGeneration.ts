import { useCallback, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { sortNodesInFlowOrder } from '../../utils/Common/helpers';
import { generateTypeScriptCode, generateTestCaseCode } from '../../utils/Flow/CodeGenerator';

interface NestedCanvasData {
  nodes: Node[];
  edges: Edge[];
}

interface UseCanvasCodeGenerationProps {
  nodes: Node[];
  edges: Edge[];
  nestedCanvasData: Record<string, NestedCanvasData>;
  onJsonGenerate?: (json: string) => void;
  onCodeGenerate?: (code: string) => void;
  reactFlowInstance?: Record<string, unknown>;
  mode?: 'rule-builder' | 'test-case-generate';
}

export const useCanvasCodeGeneration = ({
  nodes,
  edges,
  nestedCanvasData,
  onJsonGenerate,
  onCodeGenerate,
  mode = 'rule-builder'
}: UseCanvasCodeGenerationProps) => {
  const generateJson = useCallback(() => {
    const flowData = {
      nodes: nodes.map((node) => {
        const baseNode: Record<string, unknown> = {
          id: node.id,
          type: node.data.nodeType,
          label: node.data.label,
          params: node.data.params || {},
          position: node.position,
        };

        if (node.data.mode) {
          baseNode.mode = node.data.mode;
        }
        if (node.data.generation_type) {
          baseNode.generation_type = node.data.generation_type;
        }
        if (node.data.function_name) {
          baseNode.function_name = node.data.function_name;
        }
        if (
          node.data.nodeType === 'HandleTransaction' &&
          nestedCanvasData[node.id]
        ) {
          const nestedData = nestedCanvasData[node.id];
          const sortedNestedNodes = sortNodesInFlowOrder(
            nestedData.nodes,
            nestedData.edges
          );

          return {
            ...baseNode,
            nestedFlow: {
              nodes: sortedNestedNodes.map((nestedNode) => {
                const nestedBaseNode: Record<string, unknown> = {
                  id: nestedNode.id,
                  type: nestedNode.data.nodeType,
                  label: nestedNode.data.label,
                  params: nestedNode.data.params || {},
                  position: nestedNode.position,
                };

                if (nestedNode.data.mode) {
                  nestedBaseNode.mode = nestedNode.data.mode;
                }
                if (nestedNode.data.generation_type) {
                  nestedBaseNode.generation_type = nestedNode.data.generation_type;
                }
                if (nestedNode.data.function_name) {
                  nestedBaseNode.function_name = nestedNode.data.function_name;
                }
                
                return nestedBaseNode;
              }),
              edges: nestedData.edges.map((nestedEdge) => ({
                id: nestedEdge.id,
                source: nestedEdge.source,
                target: nestedEdge.target,
                sourceHandle: nestedEdge.sourceHandle || null,
                targetHandle: nestedEdge.targetHandle || null,
                label: nestedEdge.label || undefined,
                style: nestedEdge.style || undefined,
              })),
            },
          };
        }

        return baseNode;
      }),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || null,
        targetHandle: edge.targetHandle || null,
        label: edge.label || undefined,
        style: edge.style || undefined,
      })),
    };

    const json = JSON.stringify(flowData, null, 2);
    if (onJsonGenerate) {
      onJsonGenerate(json);
    }
    return json;
  }, [nodes, edges, nestedCanvasData, onJsonGenerate]);
  
  const generateCode = useCallback(() => {
    const code = mode === 'test-case-generate' 
      ? generateTestCaseCode(nodes, edges)
      : generateTypeScriptCode(nodes, edges, nestedCanvasData);

    if (onCodeGenerate) {
      onCodeGenerate(code);
    }
    
    return code;
  }, [nodes, edges, nestedCanvasData, onCodeGenerate, mode]);

  useEffect(() => {
    window.generateFlowJson = generateJson;
    window.generateFlowCode = generateCode;
    
    return () => {
      window.generateFlowJson = undefined;
      window.generateFlowCode = undefined;
    };
  }, [generateJson, generateCode]);

  return {
    generateJson,
    generateCode,
  };
};

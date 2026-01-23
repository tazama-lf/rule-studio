import { useCallback, useRef, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { simulateNodeExecution } from '../../utils/Flow/FlowExecutor';
import type { DebugLog } from '../../components/RuleBuilder/DebuggerPanel';

interface UseFlowAnimationProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  nestedCanvasData: Record<string, { nodes: Node[]; edges: Edge[] }>;
  setDebugVariables: (vars: Record<string, unknown>) => void;
  setDebugLogs: (logs: DebugLog[] | ((prev: DebugLog[]) => DebugLog[])) => void;
  setCurrentAnimationNode: (nodeId: string | undefined) => void;
}

export const useFlowAnimation = ({
  setIsPlaying,
  nestedCanvasData,
  setDebugVariables,
  setDebugLogs,
  setCurrentAnimationNode,
}: UseFlowAnimationProps) => {
  const animationTimeoutRef = useRef<number | null>(null);
  const flowVarsRef = useRef<Record<string, unknown>>({});
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const setNodesRef = useRef<((nodes: Node[] | ((prevNodes: Node[]) => Node[])) => void) | null>(null);
  const setEdgesRef = useRef<((edges: Edge[] | ((prevEdges: Edge[]) => Edge[])) => void) | null>(null);
  const nestedCanvasDataRef = useRef(nestedCanvasData);
  
  useEffect(() => {
    nestedCanvasDataRef.current = nestedCanvasData;
  }, [nestedCanvasData]);

  const stopAnimation = useCallback(() => {
    
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    
    setIsPlaying(false);
    setCurrentAnimationNode(undefined);
    
    if (setNodesRef.current) {
      setNodesRef.current((nds: Node[]) => nds.map((n) => ({ ...n, selected: false })));
    }
    if (setEdgesRef.current) {
      setEdgesRef.current((eds: Edge[]) => eds.map((e) => ({ ...e, selected: false })));
    }
  }, [setIsPlaying, setCurrentAnimationNode]);

  const executeNestedFlow = useCallback(
    (nestedData: { nodes: Node[]; edges: Edge[] }, _nestedNodeId: string, onNestedComplete: () => void) => {
      const executeNestedStep = (nodeId: string, onComplete: () => void) => {
        const nestedNode = nestedData.nodes.find((n) => n.id === nodeId);
        if (!nestedNode) {
          onComplete();
          return;
        }

        const nestedResult = simulateNodeExecution(nestedNode, flowVarsRef.current);
        flowVarsRef.current = nestedResult.newVariables;
        setDebugVariables({ ...nestedResult.newVariables });

        if (nestedResult.logMessage) {
          const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
          setDebugLogs((prevLogs) => [
            ...prevLogs,
            {
              time: timestamp,
              message: `  ↳ ${nestedResult.logMessage}`,
              type: nestedResult.error ? 'error' : 'info',
            },
          ]);
        }

        if (nestedNode.data.nodeType === 'End') {
          animationTimeoutRef.current = setTimeout(() => {
            onComplete();
          }, 800);
          return;
        }

        if (nestedNode.data.nodeType === 'If' && nestedResult.branchHandle) {
          const branchEdge = nestedData.edges.find(
            (e) => e.source === nodeId && e.sourceHandle === nestedResult.branchHandle
          );
          
          if (branchEdge) {
            const branchTargetNode = nestedData.nodes.find((n) => n.id === branchEdge.target);
            if (branchTargetNode) {
              animationTimeoutRef.current = setTimeout(() => {
                executeNestedStep(branchTargetNode.id, () => {
                  const exitEdge = nestedData.edges.find(
                    (e) => e.source === nodeId && e.sourceHandle === 'exit'
                  );
                  if (exitEdge) {
                    const exitTargetNode = nestedData.nodes.find((n) => n.id === exitEdge.target);
                    if (exitTargetNode) {
                      animationTimeoutRef.current = setTimeout(() => {
                        executeNestedStep(exitTargetNode.id, onComplete);
                      }, 800);
                    } else {
                      onComplete();
                    }
                  } else {
                    onComplete();
                  }
                });
              }, 800);
              return;
            }
          }
        }

        const nestedOutgoingEdge = nestedData.edges.find((e) => e.source === nodeId);
        if (nestedOutgoingEdge) {
          const nextNestedNode = nestedData.nodes.find((n) => n.id === nestedOutgoingEdge.target);
          if (nextNestedNode) {
            animationTimeoutRef.current = setTimeout(() => {
              executeNestedStep(nextNestedNode.id, onComplete);
            }, 800);
          } else {
            onComplete();
          }
        } else {
          onComplete();
        }
      };

      const nestedStartNode = nestedData.nodes.find((n) => n.data.nodeType === 'Start');
      if (nestedStartNode) {
        executeNestedStep(nestedStartNode.id, onNestedComplete);
      } else {
        onNestedComplete();
      }
    },
    [setDebugVariables, setDebugLogs]
  );

  const playFlowAnimation = useCallback(
    (startNodeId?: string) => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }

      setDebugVariables({});
      setDebugLogs([]);
      flowVarsRef.current = {};

      let startNode: Node | undefined;
      if (startNodeId) {
        startNode = nodesRef.current.find((n) => n.id === startNodeId);
      } else {
        startNode = nodesRef.current.find((n) => n.data.nodeType === 'Start');
        
        if (startNode) {
          setIsPlaying(true);
          
          if (setNodesRef.current) {
            setNodesRef.current((nds: Node[]) => nds.map((n) => ({ ...n, selected: false })));
          }
          if (setEdgesRef.current) {
            setEdgesRef.current((eds: Edge[]) => eds.map((e) => ({ ...e, selected: false })));
          }
        }
      }

      if (!startNode) {
        if (!startNodeId) {
          alert("No 'Start' node found to begin animation.");
        }
        setIsPlaying(false);
        return;
      }

      const animateStep = (nodeId: string, onDone?: () => void) => {
        const currentNodes = nodesRef.current;
        const currentEdges = edgesRef.current;
        const node = currentNodes.find((n) => n.id === nodeId);

        if (!node) {
          if (onDone) onDone();
          return;
        }

        const { newVariables, logMessage, error, branchHandle } = simulateNodeExecution(
          node,
          flowVarsRef.current
        );
        
        flowVarsRef.current = newVariables;
        setDebugVariables({ ...newVariables });

        if (logMessage) {
          const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
          setDebugLogs((prevLogs) => [
            ...prevLogs,
            {
              time: timestamp,
              message: logMessage,
              type: error ? 'error' : 'info',
            },
          ]);
        }

        const proceedToNext = () => {
          if (node.data.nodeType === 'End') {
            animationTimeoutRef.current = setTimeout(() => {
              if (onDone) onDone();
            }, 800);
            return;
          }
          
          if (node.data.nodeType === 'If' && branchHandle) {
            const branchEdge = currentEdges.find((e) => e.source === nodeId && e.sourceHandle === branchHandle);
            
            if (branchEdge) {
              animationTimeoutRef.current = setTimeout(() => {
                if (setEdgesRef.current) {
                  setEdgesRef.current((eds: Edge[]) =>
                    eds.map((e) => ({ ...e, selected: e.id === branchEdge.id }))
                  );
                }
                if (setNodesRef.current) {
                  setNodesRef.current((nds: Node[]) => nds.map((n) => ({ ...n, selected: false })));
                }

                const branchTargetNode = currentNodes.find((n) => n.id === branchEdge.target);
                if (branchTargetNode) {
                  animationTimeoutRef.current = setTimeout(() => {
                    animateStep(branchTargetNode.id, () => {
                      const exitEdge = currentEdges.find((e) => e.source === nodeId && e.sourceHandle === 'exit');
                      if (exitEdge) {
                        animationTimeoutRef.current = setTimeout(() => {
                          if (setEdgesRef.current) {
                            setEdgesRef.current((eds: Edge[]) =>
                              eds.map((e) => ({ ...e, selected: e.id === exitEdge.id }))
                            );
                          }
                          
                          const exitTargetNode = currentNodes.find((n) => n.id === exitEdge.target);
                          if (exitTargetNode) {
                            animationTimeoutRef.current = setTimeout(() => {
                              animateStep(exitTargetNode.id, onDone);
                            }, 800);
                          } else {
                            if (onDone) onDone();
                          }
                        }, 800);
                      } else {
                        if (onDone) onDone();
                      }
                    });
                  }, 800);
                } else {
                  if (onDone) onDone();
                }
              }, 800);
              return;
            }
          }
          
          const outgoingEdge = currentEdges.find((e) => e.source === nodeId);
          
          if (!outgoingEdge) {
            if (onDone) onDone();
            return;
          }

          animationTimeoutRef.current = setTimeout(() => {
            if (setEdgesRef.current) {
              setEdgesRef.current((eds: Edge[]) =>
                eds.map((e) => ({ ...e, selected: e.id === outgoingEdge.id }))
              );
            }
            if (setNodesRef.current) {
              setNodesRef.current((nds: Node[]) => nds.map((n) => ({ ...n, selected: false })));
            }

            const nextNode = currentNodes.find((n) => n.id === outgoingEdge.target);
            if (nextNode) {
              animationTimeoutRef.current = setTimeout(() => {
                animateStep(nextNode.id, onDone);
              }, 800);
            } else {
              if (onDone) onDone();
            }
          }, 800);
        };

        const isHandleTransaction = node.data.nodeType === 'HandleTransaction';
        const hasNestedFlow = isHandleTransaction && nestedCanvasDataRef.current[nodeId];
        
        if (hasNestedFlow) {
          const nestedData = nestedCanvasDataRef.current[nodeId];
          executeNestedFlow(nestedData, nodeId, () => {
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
            setDebugLogs((prevLogs) => [
              ...prevLogs,
              {
                time: timestamp,
                message: '✅ Nested flow completed',
                type: 'info',
              },
            ]);
            
            proceedToNext();
          });
          
          return;
        }

        setCurrentAnimationNode(nodeId);
        
        if (setNodesRef.current) {
          setNodesRef.current((nds: Node[]) => nds.map((n) => ({ ...n, selected: n.id === nodeId })));
        }
        if (setEdgesRef.current) {
          setEdgesRef.current((eds: Edge[]) => eds.map((e) => ({ ...e, selected: false })));
        }

        if (!hasNestedFlow) {
          proceedToNext();
        }
      };

      animateStep(startNode.id, () => {
        setIsPlaying(false);
        setCurrentAnimationNode(undefined);
        
        if (setNodesRef.current) {
          setNodesRef.current((nds: Node[]) => nds.map((n) => ({ ...n, selected: false })));
        }
        if (setEdgesRef.current) {
          setEdgesRef.current((eds: Edge[]) => eds.map((e) => ({ ...e, selected: false })));
        }
      });
    },
    [setIsPlaying, setCurrentAnimationNode, setDebugVariables, setDebugLogs, executeNestedFlow]
  );

  const updateFlowState = useCallback(
    (
      nodes: Node[],
      edges: Edge[],
      setNodes: (nodes: Node[] | ((prevNodes: Node[]) => Node[])) => void,
      setEdges: (edges: Edge[] | ((prevEdges: Edge[]) => Edge[])) => void
    ) => {
      nodesRef.current = nodes;
      edgesRef.current = edges;
      setNodesRef.current = setNodes;
      setEdgesRef.current = setEdges;
    },
    []
  );

  return {
    playFlowAnimation,
    stopAnimation,
    updateFlowState,
    animationTimeoutRef,
  };
};

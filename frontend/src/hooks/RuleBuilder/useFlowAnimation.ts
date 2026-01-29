import { useCallback, useRef, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { simulateNodeExecution } from '../../utils/Flow/FlowExecutor';
import type { DebugLog } from '../../components/RuleBuilder/DebuggerPanel';

const TERMINAL_NODE_TYPES = ['End', 'Exit', 'ThrowError'];
const MAX_EXECUTION_STEPS = 500;

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
  const executionStepCountRef = useRef(0);
  const isPausedRef = useRef(false);
  const pendingResumeCallbackRef = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    nestedCanvasDataRef.current = nestedCanvasData;
  }, [nestedCanvasData]);

  const pauseAnimation = useCallback(() => {
    isPausedRef.current = true;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setDebugLogs((prevLogs) => [
      ...prevLogs,
      { time: timestamp, message: '⏸️ Execution paused', type: 'info' },
    ]);
  }, [setDebugLogs]);

  const resumeAnimation = useCallback(() => {
    isPausedRef.current = false;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setDebugLogs((prevLogs) => [
      ...prevLogs,
      { time: timestamp, message: '▶️ Execution resumed', type: 'info' },
    ]);
    
    // Execute pending callback if exists
    if (pendingResumeCallbackRef.current) {
      const callback = pendingResumeCallbackRef.current;
      pendingResumeCallbackRef.current = null;
      callback();
    }
  }, [setDebugLogs]);

  const stopAnimation = useCallback(() => {
    
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    
    isPausedRef.current = false;
    pendingResumeCallbackRef.current = null;
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
      const visitedNodes = new Set<string>();
      
      const scheduleWithPauseCheck = (callback: () => void, delay: number = 800) => {
        animationTimeoutRef.current = setTimeout(() => {
          if (isPausedRef.current) {
            // Store the callback and wait for resume
            pendingResumeCallbackRef.current = callback;
          } else {
            callback();
          }
        }, delay);
      };
      
      const executeNestedStep = (nodeId: string, onComplete: () => void, stoppedAtTerminalRef: { current: boolean }) => {
        executionStepCountRef.current++;
        if (executionStepCountRef.current > MAX_EXECUTION_STEPS) {
          console.error('Max execution steps reached in nested flow, stopping to prevent infinite loop');
          const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
          setDebugLogs((prevLogs) => [
            ...prevLogs,
            { time: timestamp, message: '❌ Max execution steps reached - stopping', type: 'error' },
          ]);
          onComplete();
          return;
        }

        const nestedNode = nestedData.nodes.find((n) => n.id === nodeId);
        if (!nestedNode) {
          onComplete();
          return;
        }

        const executionKey = `${nodeId}-${executionStepCountRef.current}`;
        if (visitedNodes.has(executionKey)) {
          console.warn('Cycle detected in nested flow at node:', nodeId);
          onComplete();
          return;
        }
        visitedNodes.add(executionKey);

        const nodeType = nestedNode.data.nodeType as string;
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

        if (TERMINAL_NODE_TYPES.includes(nodeType)) {
          stoppedAtTerminalRef.current = true;
          scheduleWithPauseCheck(() => onComplete());
          return;
        }

        if (nodeType === 'If' && nestedResult.branchHandle) {
          const branchEdge = nestedData.edges.find(
            (e) => e.source === nodeId && e.sourceHandle === nestedResult.branchHandle
          );
          
          if (branchEdge) {
            const branchTargetNode = nestedData.nodes.find((n) => n.id === branchEdge.target);
            if (branchTargetNode) {
              const branchTargetType = branchTargetNode.data.nodeType as string;
              
              scheduleWithPauseCheck(() => {
                if (TERMINAL_NODE_TYPES.includes(branchTargetType)) {
                  executeNestedStep(branchTargetNode.id, onComplete, stoppedAtTerminalRef);
                } else {
                  const branchTerminalRef = { current: false };
                  executeNestedStep(branchTargetNode.id, () => {
                    if (branchTerminalRef.current) {
                      stoppedAtTerminalRef.current = true;
                      onComplete();
                    } else {
                      const exitEdge = nestedData.edges.find(
                        (e) => e.source === nodeId && e.sourceHandle === 'exit'
                      );
                      if (exitEdge) {
                        const exitTargetNode = nestedData.nodes.find((n) => n.id === exitEdge.target);
                        if (exitTargetNode) {
                          scheduleWithPauseCheck(() => {
                            executeNestedStep(exitTargetNode.id, onComplete, stoppedAtTerminalRef);
                          });
                        } else {
                          onComplete();
                        }
                      } else {
                        onComplete();
                      }
                    }
                  }, branchTerminalRef);
                }
              });
              return;
            }
          }
          
          const exitEdge = nestedData.edges.find(
            (e) => e.source === nodeId && e.sourceHandle === 'exit'
          );
          if (exitEdge) {
            const exitTargetNode = nestedData.nodes.find((n) => n.id === exitEdge.target);
            if (exitTargetNode) {
              scheduleWithPauseCheck(() => {
                executeNestedStep(exitTargetNode.id, onComplete, stoppedAtTerminalRef);
              });
              return;
            }
          }
          
          onComplete();
          return;
        }

        const sourceEdge = nestedData.edges.find((e) => e.source === nodeId && e.sourceHandle === 'source');
        const exitEdge = nestedData.edges.find((e) => e.source === nodeId && e.sourceHandle === 'exit');
        const nestedOutgoingEdge = sourceEdge || exitEdge || nestedData.edges.find((e) => e.source === nodeId);
        
        if (nestedOutgoingEdge) {
          const nextNestedNode = nestedData.nodes.find((n) => n.id === nestedOutgoingEdge.target);
          if (nextNestedNode) {
            scheduleWithPauseCheck(() => {
              executeNestedStep(nextNestedNode.id, onComplete, stoppedAtTerminalRef);
            });
          } else {
            onComplete();
          }
        } else {
          onComplete();
        }
      };

      const nestedStartNode = nestedData.nodes.find((n) => n.data.nodeType === 'Start');
      if (nestedStartNode) {
        const mainTerminalRef = { current: false };
        executeNestedStep(nestedStartNode.id, onNestedComplete, mainTerminalRef);
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
      executionStepCountRef.current = 0;

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

      const scheduleWithPauseCheck = (callback: () => void, delay: number = 800) => {
        animationTimeoutRef.current = setTimeout(() => {
          if (isPausedRef.current) {
            // Store the callback and wait for resume
            pendingResumeCallbackRef.current = callback;
          } else {
            callback();
          }
        }, delay);
      };

      const animateStep = (nodeId: string, onDone?: () => void) => {
        executionStepCountRef.current++;
        if (executionStepCountRef.current > MAX_EXECUTION_STEPS) {
          console.error('Max execution steps reached, stopping to prevent infinite loop');
          const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
          setDebugLogs((prevLogs) => [
            ...prevLogs,
            { time: timestamp, message: '❌ Max execution steps reached - stopping', type: 'error' },
          ]);
          if (onDone) onDone();
          return;
        }

        const currentNodes = nodesRef.current;
        const currentEdges = edgesRef.current;
        const node = currentNodes.find((n) => n.id === nodeId);

        if (!node) {
          if (onDone) onDone();
          return;
        }

        const nodeType = node.data.nodeType as string;
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
          if (TERMINAL_NODE_TYPES.includes(nodeType)) {
            scheduleWithPauseCheck(() => {
              if (onDone) onDone();
            });
            return;
          }
          
          if (nodeType === 'If' && branchHandle) {
            const branchEdge = currentEdges.find((e) => e.source === nodeId && e.sourceHandle === branchHandle);
            
            if (branchEdge) {
              const branchTargetNode = currentNodes.find((n) => n.id === branchEdge.target);
              const branchTargetType = branchTargetNode?.data.nodeType as string;
              
              scheduleWithPauseCheck(() => {
                if (setEdgesRef.current) {
                  setEdgesRef.current((eds: Edge[]) =>
                    eds.map((e) => ({ ...e, selected: e.id === branchEdge.id }))
                  );
                }
                if (setNodesRef.current) {
                  setNodesRef.current((nds: Node[]) => nds.map((n) => ({ ...n, selected: false })));
                }

                if (branchTargetNode) {
                  scheduleWithPauseCheck(() => {
                    if (TERMINAL_NODE_TYPES.includes(branchTargetType)) {
                      animateStep(branchTargetNode.id, onDone);
                    } else {
                      animateStep(branchTargetNode.id, () => {
                        const exitEdge = currentEdges.find((e) => e.source === nodeId && e.sourceHandle === 'exit');
                        if (exitEdge) {
                          scheduleWithPauseCheck(() => {
                            if (setEdgesRef.current) {
                              setEdgesRef.current((eds: Edge[]) =>
                                eds.map((e) => ({ ...e, selected: e.id === exitEdge.id }))
                              );
                            }
                            
                            const exitTargetNode = currentNodes.find((n) => n.id === exitEdge.target);
                            if (exitTargetNode) {
                              scheduleWithPauseCheck(() => {
                                animateStep(exitTargetNode.id, onDone);
                              });
                            } else {
                              if (onDone) onDone();
                            }
                          });
                        } else {
                          if (onDone) onDone();
                        }
                      });
                    }
                  });
                } else {
                  if (onDone) onDone();
                }
              }, 800);
              return;
            }
            const exitEdge = currentEdges.find((e) => e.source === nodeId && e.sourceHandle === 'exit');
            if (exitEdge) {
              scheduleWithPauseCheck(() => {
                if (setEdgesRef.current) {
                  setEdgesRef.current((eds: Edge[]) =>
                    eds.map((e) => ({ ...e, selected: e.id === exitEdge.id }))
                  );
                }
                const exitTargetNode = currentNodes.find((n) => n.id === exitEdge.target);
                if (exitTargetNode) {
                  scheduleWithPauseCheck(() => {
                    animateStep(exitTargetNode.id, onDone);
                  });
                } else {
                  if (onDone) onDone();
                }
              });
              return;
            }
            
            if (onDone) onDone();
            return;
          }
          
          const sourceEdge = currentEdges.find((e) => e.source === nodeId && e.sourceHandle === 'source');
          const exitEdge = currentEdges.find((e) => e.source === nodeId && e.sourceHandle === 'exit');
          const outgoingEdge = sourceEdge || exitEdge || currentEdges.find((e) => e.source === nodeId);
          
          if (!outgoingEdge) {
            if (onDone) onDone();
            return;
          }

          scheduleWithPauseCheck(() => {
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
              scheduleWithPauseCheck(() => {
                animateStep(nextNode.id, onDone);
              });
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
    pauseAnimation,
    resumeAnimation,
    updateFlowState,
    animationTimeoutRef,
  };
};

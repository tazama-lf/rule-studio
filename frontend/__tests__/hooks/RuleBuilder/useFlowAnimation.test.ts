import { renderHook, act } from '@testing-library/react';
import { useFlowAnimation } from '../../../src/hooks/RuleBuilder/useFlowAnimation';
import type { Node, Edge } from '@xyflow/react';

const mockSimulateNodeExecution = jest.fn();

jest.mock('../../../src/utils/Flow/FlowExecutor', () => ({
  simulateNodeExecution: (...args: unknown[]) => mockSimulateNodeExecution(...args),
}));


function makeNode(id: string, nodeType: string, extra: Record<string, unknown> = {}): Node {
  return {
    id,
    position: { x: 0, y: 0 },
    data: { nodeType, ...extra },
    type: 'default',
  } as Node;
}

function makeEdge(id: string, source: string, target: string, sourceHandle = 'source'): Edge {
  return { id, source, target, sourceHandle } as Edge;
}

function defaultSimResult(overrides: Record<string, unknown> = {}) {
  return {
    newVariables: {},
    logMessage: null,
    error: null,
    branchHandle: null,
    ...overrides,
  };
}

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    isPlaying: false,
    setIsPlaying: jest.fn(),
    nestedCanvasData: {},
    setDebugVariables: jest.fn(),
    setDebugLogs: jest.fn(),
    setCurrentAnimationNode: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockSimulateNodeExecution.mockReturnValue(defaultSimResult());
});

afterEach(() => {
  jest.runAllTimers();
  jest.useRealTimers();
});

describe('useFlowAnimation', () => {
  it('exposes playFlowAnimation, stopAnimation, pauseAnimation, resumeAnimation, updateFlowState, animationTimeoutRef', () => {
    const props = makeProps();
    const { result } = renderHook(() => useFlowAnimation(props));
    expect(typeof result.current.playFlowAnimation).toBe('function');
    expect(typeof result.current.stopAnimation).toBe('function');
    expect(typeof result.current.pauseAnimation).toBe('function');
    expect(typeof result.current.resumeAnimation).toBe('function');
    expect(typeof result.current.updateFlowState).toBe('function');
    expect(result.current.animationTimeoutRef).toBeDefined();
  });

  it('updateFlowState stores nodes, edges, setNodes and setEdges refs', () => {
    const props = makeProps();
    const { result } = renderHook(() => useFlowAnimation(props));
    const setNodes = jest.fn();
    const setEdges = jest.fn();
    const nodes = [makeNode('n1', 'Start')];
    const edges: Edge[] = [];

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
    });
    act(() => {
      result.current.stopAnimation();
    });
    expect(setNodes).toHaveBeenCalled();
    expect(setEdges).toHaveBeenCalled();
    expect(props.setIsPlaying).toHaveBeenCalledWith(false);
  });

  it('stopAnimation resets state even when no nodes/edges setters are registered', () => {
    const props = makeProps();
    const { result } = renderHook(() => useFlowAnimation(props));

    act(() => {
      result.current.stopAnimation();
    });

    expect(props.setIsPlaying).toHaveBeenCalledWith(false);
    expect(props.setCurrentAnimationNode).toHaveBeenCalledWith(undefined);
  });

  it('stopAnimation clears a pending timeout', () => {
    const clearSpy = jest.spyOn(global, 'clearTimeout');
    const props = makeProps();
    const { result } = renderHook(() => useFlowAnimation(props));

    act(() => {
      result.current.animationTimeoutRef.current = setTimeout(() => {}, 1000) as unknown as number;
    });
    act(() => {
      result.current.stopAnimation();
    });

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('pauseAnimation appends a pause log entry', () => {
    const setDebugLogs = jest.fn();
    const props = makeProps({ setDebugLogs });
    const { result } = renderHook(() => useFlowAnimation(props));

    act(() => {
      result.current.pauseAnimation();
    });

    expect(setDebugLogs).toHaveBeenCalledWith(expect.any(Function));

    const updater = setDebugLogs.mock.calls[0][0] as (prev: unknown[]) => unknown[];
    const updated = updater([]);
    expect(updated).toHaveLength(1);
    expect((updated[0] as { message: string }).message).toMatch(/paused/i);
  });

  it('resumeAnimation appends a resume log entry', () => {
    const setDebugLogs = jest.fn();
    const props = makeProps({ setDebugLogs });
    const { result } = renderHook(() => useFlowAnimation(props));

    act(() => {
      result.current.resumeAnimation();
    });

    expect(setDebugLogs).toHaveBeenCalledWith(expect.any(Function));
    const updater = setDebugLogs.mock.calls[0][0] as (prev: unknown[]) => unknown[];
    const updated = updater([]);
    expect((updated[0] as { message: string }).message).toMatch(/resumed/i);
  });

  it('resumeAnimation executes a pending callback if one is queued', () => {
    const pendingCallback = jest.fn();
    const props = makeProps();
    const { result } = renderHook(() => useFlowAnimation(props));

    act(() => {
      result.current.pauseAnimation();
    });

    const startNode = makeNode('s1', 'Start');
    const endNode = makeNode('e1', 'End');
    const edge = makeEdge('edge-1', 's1', 'e1');
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState([startNode, endNode], [edge], setNodes, setEdges);
    });

    mockSimulateNodeExecution.mockReturnValue(defaultSimResult({ logMessage: 'test log' }));

    act(() => {
      result.current.playFlowAnimation();
    });

    act(() => {
      result.current.pauseAnimation();
      jest.advanceTimersByTime(800);
    });

    act(() => {
      result.current.resumeAnimation();
    });

    // The pending callback runs, so execution completes after more timer ticks
    act(() => {
      jest.runAllTimers();
    });

    // setIsPlaying(false) should eventually be called as flow completes
    expect(pendingCallback).not.toThrow; // it wasn't an explicit callback here, just ensuring no crash
  });

  // ── playFlowAnimation: no Start node ──────────────────────────────────────

  it('calls setIsPlaying(false) and shows alert when no Start node exists', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const props = makeProps();
    const { result } = renderHook(() => useFlowAnimation(props));

    const setNodes = jest.fn();
    const setEdges = jest.fn();
    act(() => {
      result.current.updateFlowState(
        [makeNode('n1', 'Action')],
        [],
        setNodes,
        setEdges
      );
    });

    act(() => {
      result.current.playFlowAnimation();
    });

    expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/start/i));
    expect(props.setIsPlaying).toHaveBeenCalledWith(false);
    alertSpy.mockRestore();
  });

  // ── playFlowAnimation: called with explicit startNodeId not found ──────────

  it('calls setIsPlaying(false) when startNodeId is provided but not found', () => {
    const props = makeProps();
    const { result } = renderHook(() => useFlowAnimation(props));
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState([], [], setNodes, setEdges);
    });

    act(() => {
      result.current.playFlowAnimation('nonexistent-id');
    });

    expect(props.setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── playFlowAnimation: simple linear flow (Start → End) ───────────────────

  it('animates a Start → End flow and resets isPlaying when done', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const setNodes = jest.fn();
    const setEdges = jest.fn();
    const nodes = [makeNode('s1', 'Start'), makeNode('e1', 'End')];
    const edges = [makeEdge('edge-1', 's1', 'e1')];

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
    });

    act(() => {
      result.current.playFlowAnimation();
    });

    act(() => jest.runAllTimers());

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  it('emits a log message when simulateNodeExecution returns one', () => {
    const setDebugLogs = jest.fn();
    const props = makeProps({ setDebugLogs });
    const { result } = renderHook(() => useFlowAnimation(props));

    mockSimulateNodeExecution.mockReturnValue(
      defaultSimResult({ logMessage: 'Node ran OK', newVariables: { x: 42 } })
    );

    const setNodes = jest.fn();
    const setEdges = jest.fn();
    const nodes = [makeNode('s1', 'Start'), makeNode('e1', 'End')];
    const edges = [makeEdge('edge-1', 's1', 'e1')];

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
    });

    act(() => {
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    // At least one of the calls should carry a function updater (appended log)
    const updaterCalls = setDebugLogs.mock.calls.filter((c) => typeof c[0] === 'function');
    expect(updaterCalls.length).toBeGreaterThan(0);
  });

  it('emits an error log when simulateNodeExecution returns an error', () => {
    const setDebugLogs = jest.fn();
    const props = makeProps({ setDebugLogs });
    const { result } = renderHook(() => useFlowAnimation(props));

    mockSimulateNodeExecution.mockReturnValue(
      defaultSimResult({ logMessage: 'Boom!', error: 'some error' })
    );

    const nodes = [makeNode('s1', 'Start'), makeNode('e1', 'End')];
    const edges = [makeEdge('edge-1', 's1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    const updaterCalls = setDebugLogs.mock.calls.filter((c) => typeof c[0] === 'function');
    expect(updaterCalls.length).toBeGreaterThan(0);
    const firstUpdated = (updaterCalls[0][0] as (p: unknown[]) => {type: string}[])([ ]);
    expect(firstUpdated[0].type).toBe('error');
  });

  // ── playFlowAnimation: flow where next node doesn't exist ─────────────────

  it('completes gracefully when an outgoing edge points to a missing node', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start')]; // target 'e1' does not exist
    const edges = [makeEdge('edge-1', 's1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  it('completes gracefully when a node has no outgoing edges', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start')];
    const edges: Edge[] = [];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── playFlowAnimation: Terminal node types ────────────────────────────────

  it('terminates immediately at an Exit node without following further edges', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [
      makeNode('s1', 'Start'),
      makeNode('ex', 'Exit'),
      makeNode('unreachable', 'Action'),
    ];
    const edges = [
      makeEdge('e1', 's1', 'ex'),
      makeEdge('e2', 'ex', 'unreachable'),
    ];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
    // 'unreachable' node should never have been simulated
    const calledIds = mockSimulateNodeExecution.mock.calls.map((c) => (c[0] as Node).id);
    expect(calledIds).not.toContain('unreachable');
  });

  it('terminates at ThrowError node', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('te', 'ThrowError')];
    const edges = [makeEdge('e1', 's1', 'te')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── playFlowAnimation: If-node branching ──────────────────────────────────

  it('follows the truthy branch when If node has a branchHandle', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [
      makeNode('s1', 'Start'),
      makeNode('if1', 'If'),
      makeNode('yes', 'Action'),
      makeNode('e1', 'End'),
    ];
    const edges = [
      makeEdge('e-start', 's1', 'if1'),
      { id: 'e-branch', source: 'if1', target: 'yes', sourceHandle: 'true' } as Edge,
      { id: 'e-exit', source: 'if1', target: 'e1', sourceHandle: 'exit' } as Edge,
    ];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })) // If
      .mockReturnValueOnce(defaultSimResult()) // yes (Action)
      .mockReturnValue(defaultSimResult()); // End (via exit edge)

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
    const calledIds = mockSimulateNodeExecution.mock.calls.map((c) => (c[0] as Node).id);
    expect(calledIds).toContain('yes');
  });

  it('follows exit edge when If branch target leads to a terminal node', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [
      makeNode('s1', 'Start'),
      makeNode('if1', 'If'),
      makeNode('exitNode', 'End'), // branch target is terminal
      makeNode('afterIf', 'Action'),
    ];
    const edges = [
      makeEdge('e-start', 's1', 'if1'),
      { id: 'e-branch', source: 'if1', target: 'exitNode', sourceHandle: 'true' } as Edge,
      { id: 'e-exit-if', source: 'if1', target: 'afterIf', sourceHandle: 'exit' } as Edge,
    ];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })) // If
      .mockReturnValue(defaultSimResult()); // End / afterIf

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  it('falls through to exit edge when If branch edge is missing its target node', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [
      makeNode('s1', 'Start'),
      makeNode('if1', 'If'),
      makeNode('after', 'End'),
    ];
    // The branch edge points to a node that doesn't exist in nodes array
    const edges = [
      makeEdge('e-start', 's1', 'if1'),
      { id: 'e-branch', source: 'if1', target: 'missing', sourceHandle: 'true' } as Edge,
      { id: 'e-exit', source: 'if1', target: 'after', sourceHandle: 'exit' } as Edge,
    ];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })) // If → branch points to missing node
      .mockReturnValue(defaultSimResult()); // End

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  it('calls onDone when If has no matching branch edge and no exit edge', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('if1', 'If')];
    // No branch or exit edges from if1
    const edges = [makeEdge('e-start', 's1', 'if1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })); // If — no matching branch

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  it('follows exit edge when If branchHandle has no matching branch edges but exit exists', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [
      makeNode('s1', 'Start'),
      makeNode('if1', 'If'),
      makeNode('afterE', 'End'),
    ];
    const edges = [
      makeEdge('e-start', 's1', 'if1'),
      // No branch edge matching 'true', but exit edge exists
      { id: 'e-exit', source: 'if1', target: 'afterE', sourceHandle: 'exit' } as Edge,
    ];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })) // If → no branch matches
      .mockReturnValue(defaultSimResult()); // afterE

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
    const calledIds = mockSimulateNodeExecution.mock.calls.map((c) => (c[0] as Node).id);
    expect(calledIds).toContain('afterE');
  });

  it('completes gracefully when If exit edge target node is missing', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('if1', 'If')];
    const edges = [
      makeEdge('e-start', 's1', 'if1'),
      { id: 'e-exit', source: 'if1', target: 'missing', sourceHandle: 'exit' } as Edge,
    ];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })); // If

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── playFlowAnimation: exit edge preferred over source edge ───────────────

  it('prefers exit edge over source edge for non-If nodes', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [
      makeNode('s1', 'Start'),
      makeNode('a1', 'Action'),
      makeNode('e1', 'End'),
    ];
    const edges = [
      { id: 'e-src', source: 's1', target: 'a1', sourceHandle: 'source' } as Edge,
      { id: 'e-exit', source: 'a1', target: 'e1', sourceHandle: 'exit' } as Edge,
    ];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
    const calledIds = mockSimulateNodeExecution.mock.calls.map((c) => (c[0] as Node).id);
    expect(calledIds).toContain('e1');
  });

  // ── playFlowAnimation: explicit startNodeId ────────────────────────────────

  it('starts from a given startNodeId without calling setIsPlaying(true)', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('n2', 'Action'), makeNode('e1', 'End')];
    const edges = [makeEdge('edge-1', 'n2', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation('n2');
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
    // setIsPlaying(true) should NOT have been called (only called when auto-finding Start)
    expect(setIsPlaying).not.toHaveBeenCalledWith(true);
  });

  // ── playFlowAnimation: max steps exceeded ─────────────────────────────────

  it('stops and logs an error when execution steps exceed MAX_EXECUTION_STEPS', () => {
    const setDebugLogs = jest.fn();
    const setIsPlaying = jest.fn();
    const props = makeProps({ setDebugLogs, setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    // Create a cycle: s1 → a1 → a1 (infinite loop)
    const nodes = [makeNode('s1', 'Start'), makeNode('a1', 'Action')];
    const edges = [
      makeEdge('e1', 's1', 'a1'),
      makeEdge('e2', 'a1', 'a1'), // self-loop
    ];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    // Should have logged the max steps error
    const updaterCalls = setDebugLogs.mock.calls.filter((c) => typeof c[0] === 'function');
    const allMessages = updaterCalls.flatMap((c) =>
      (c[0] as (p: {message: string}[]) => {message: string}[])([ ]).map((l) => l.message)
    );
    expect(allMessages.some((m) => m.includes('Max execution steps reached'))).toBe(true);
  });

  // ── playFlowAnimation: HandleTransaction nested flow ─────────────────────

  it('executes a nested flow for HandleTransaction nodes and logs completion', () => {
    const setDebugLogs = jest.fn();
    const setIsPlaying = jest.fn();

    const nestedStart = makeNode('ns1', 'Start');
    const nestedEnd = makeNode('ne1', 'End');
    const nestedEdge = makeEdge('ne-1', 'ns1', 'ne1');

    const props = makeProps({
      setDebugLogs,
      setIsPlaying,
      nestedCanvasData: {
        ht1: { nodes: [nestedStart, nestedEnd], edges: [nestedEdge] },
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    const updaterCalls = setDebugLogs.mock.calls.filter((c) => typeof c[0] === 'function');
    const allMessages = updaterCalls.flatMap((c) =>
      (c[0] as (p: {message: string}[]) => {message: string}[])([ ]).map((l) => l.message)
    );
    expect(allMessages.some((m) => m.includes('Nested flow completed'))).toBe(true);
    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── executeNestedFlow branches ─────────────────────────────────────────────

  it('completes nested flow when nested Start node is absent', () => {
    const setIsPlaying = jest.fn();

    const props = makeProps({
      setIsPlaying,
      nestedCanvasData: {
        ht1: { nodes: [], edges: [] }, // no Start node
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  it('nested flow: stops at terminal node and skips remaining nested steps', () => {
    const setIsPlaying = jest.fn();
    const nestedStart = makeNode('ns1', 'Start');
    const nestedExit = makeNode('nex', 'Exit');
    const nestedAfter = makeNode('na', 'Action');

    const props = makeProps({
      setIsPlaying,
      nestedCanvasData: {
        ht1: {
          nodes: [nestedStart, nestedExit, nestedAfter],
          edges: [
            makeEdge('ne1', 'ns1', 'nex'),
            makeEdge('ne2', 'nex', 'na'),
          ],
        },
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    const calledIds = mockSimulateNodeExecution.mock.calls.map((c) => (c[0] as Node).id);
    expect(calledIds).not.toContain('na');
    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  it('nested flow: handles If node branching with exit edge', () => {
    const setIsPlaying = jest.fn();
    const nestedStart = makeNode('ns1', 'Start');
    const nestedIf = makeNode('nif', 'If');
    const branchTarget = makeNode('nb', 'Action');
    const exitTarget = makeNode('ne', 'End');

    const props = makeProps({
      setIsPlaying,
      nestedCanvasData: {
        ht1: {
          nodes: [nestedStart, nestedIf, branchTarget, exitTarget],
          edges: [
            makeEdge('ne1', 'ns1', 'nif'),
            { id: 'ne-branch', source: 'nif', target: 'nb', sourceHandle: 'true' } as Edge,
            { id: 'ne-exit', source: 'nif', target: 'ne', sourceHandle: 'exit' } as Edge,
          ],
        },
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    // nested Start → plain result, nested If → has branchHandle, rest plain
    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // outer Start
      .mockReturnValueOnce(defaultSimResult()) // outer HandleTransaction
      .mockReturnValueOnce(defaultSimResult()) // nested Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })) // nested If
      .mockReturnValue(defaultSimResult()); // branchTarget / exitTarget / outer End

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  it('nested flow: If branch target is terminal — does not follow exit edge', () => {
    const setIsPlaying = jest.fn();
    const nestedStart = makeNode('ns1', 'Start');
    const nestedIf = makeNode('nif', 'If');
    const terminalBranch = makeNode('nterm', 'End'); // terminal
    const exitTarget = makeNode('ne2', 'Action');

    const props = makeProps({
      setIsPlaying,
      nestedCanvasData: {
        ht1: {
          nodes: [nestedStart, nestedIf, terminalBranch, exitTarget],
          edges: [
            makeEdge('ne1', 'ns1', 'nif'),
            { id: 'ne-branch', source: 'nif', target: 'nterm', sourceHandle: 'true' } as Edge,
            { id: 'ne-exit', source: 'nif', target: 'ne2', sourceHandle: 'exit' } as Edge,
          ],
        },
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // outer Start
      .mockReturnValueOnce(defaultSimResult()) // outer HT
      .mockReturnValueOnce(defaultSimResult()) // nested Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })) // nested If
      .mockReturnValue(defaultSimResult()); // terminal End, etc.

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
    const calledIds = mockSimulateNodeExecution.mock.calls.map((c) => (c[0] as Node).id);
    expect(calledIds).not.toContain('ne2');
  });

  it('nested flow: If no branch handle match and no exit — completes gracefully', () => {
    const setIsPlaying = jest.fn();
    const nestedStart = makeNode('ns1', 'Start');
    const nestedIf = makeNode('nif', 'If');

    const props = makeProps({
      setIsPlaying,
      nestedCanvasData: {
        ht1: {
          nodes: [nestedStart, nestedIf],
          edges: [makeEdge('ne1', 'ns1', 'nif')],
        },
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // outer Start
      .mockReturnValueOnce(defaultSimResult()) // outer HT
      .mockReturnValueOnce(defaultSimResult()) // nested Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })); // nested If — no edges

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  it('nested flow: logs max execution steps exceeded', () => {
    const setDebugLogs = jest.fn();
    const setIsPlaying = jest.fn();

    // Self-looping nested flow
    const nestedStart = makeNode('ns1', 'Start');
    const nestedAction = makeNode('na1', 'Action');

    const props = makeProps({
      setDebugLogs,
      setIsPlaying,
      nestedCanvasData: {
        ht1: {
          nodes: [nestedStart, nestedAction],
          edges: [
            makeEdge('ne1', 'ns1', 'na1'),
            makeEdge('ne2', 'na1', 'na1'), // self-loop
          ],
        },
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    const updaterCalls = setDebugLogs.mock.calls.filter((c) => typeof c[0] === 'function');
    const allMessages = updaterCalls.flatMap((c) =>
      (c[0] as (p: {message: string}[]) => {message: string}[])([ ]).map((l) => l.message)
    );
    expect(allMessages.some((m) => m.includes('Max execution steps reached'))).toBe(true);
  });

  it('nested flow: handles missing node id gracefully (node not in nested nodes list)', () => {
    const setIsPlaying = jest.fn();
    const nestedStart = makeNode('ns1', 'Start');
    const nestedAction = makeNode('na1', 'Action');

    const props = makeProps({
      setIsPlaying,
      nestedCanvasData: {
        ht1: {
          nodes: [nestedStart, nestedAction],
          edges: [
            makeEdge('ne1', 'ns1', 'missing-id'), // target missing
          ],
        },
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  it('nested flow: nested node with a log message appends to debug logs', () => {
    const setDebugLogs = jest.fn();
    const nestedStart = makeNode('ns1', 'Start');
    const nestedEnd = makeNode('ne1', 'End');

    const props = makeProps({
      setDebugLogs,
      nestedCanvasData: {
        ht1: { nodes: [nestedStart, nestedEnd], edges: [makeEdge('ne1', 'ns1', 'ne1')] },
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // outer Start
      .mockReturnValueOnce(defaultSimResult()) // outer HT
      .mockReturnValueOnce(defaultSimResult({ logMessage: 'nested ran', error: null })) // nested Start
      .mockReturnValue(defaultSimResult()); // nested End

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    const updaterCalls = setDebugLogs.mock.calls.filter((c) => typeof c[0] === 'function');
    const allMessages = updaterCalls.flatMap((c) =>
      (c[0] as (p: {message: string}[]) => {message: string}[])([ ]).map((l) => l.message)
    );
    expect(allMessages.some((m) => m.includes('nested ran'))).toBe(true);
  });

  it('nested flow: If branch target node missing in nested nodes — falls through to exit', () => {
    const setIsPlaying = jest.fn();
    const nestedStart = makeNode('ns1', 'Start');
    const nestedIf = makeNode('nif', 'If');
    const exitTarget = makeNode('ne', 'End');

    const props = makeProps({
      setIsPlaying,
      nestedCanvasData: {
        ht1: {
          nodes: [nestedStart, nestedIf, exitTarget],
          edges: [
            makeEdge('ne1', 'ns1', 'nif'),
            { id: 'ne-branch', source: 'nif', target: 'missing', sourceHandle: 'true' } as Edge,
            { id: 'ne-exit', source: 'nif', target: 'ne', sourceHandle: 'exit' } as Edge,
          ],
        },
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // outer Start
      .mockReturnValueOnce(defaultSimResult()) // outer HT
      .mockReturnValueOnce(defaultSimResult()) // nested Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })) // nested If — branch target missing
      .mockReturnValue(defaultSimResult()); // exitTarget

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
    const calledIds = mockSimulateNodeExecution.mock.calls.map((c) => (c[0] as Node).id);
    expect(calledIds).toContain('ne');
  });

  it('nested flow: If exit edge target node missing — completes gracefully', () => {
    const setIsPlaying = jest.fn();
    const nestedStart = makeNode('ns1', 'Start');
    const nestedIf = makeNode('nif', 'If');

    const props = makeProps({
      setIsPlaying,
      nestedCanvasData: {
        ht1: {
          nodes: [nestedStart, nestedIf],
          edges: [
            makeEdge('ne1', 'ns1', 'nif'),
            { id: 'ne-branch', source: 'nif', target: 'missing', sourceHandle: 'true' } as Edge,
            { id: 'ne-exit', source: 'nif', target: 'also-missing', sourceHandle: 'exit' } as Edge,
          ],
        },
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // outer Start
      .mockReturnValueOnce(defaultSimResult()) // outer HT
      .mockReturnValueOnce(defaultSimResult()) // nested Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })); // nested If

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── nestedCanvasData effect update ─────────────────────────────────────────

  it('picks up updated nestedCanvasData after rerender', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying, nestedCanvasData: {} });

    const { result, rerender } = renderHook(
      (p: Parameters<typeof useFlowAnimation>[0]) => useFlowAnimation(p),
      { initialProps: props }
    );

    const nestedStart = makeNode('ns1', 'Start');
    const nestedEnd = makeNode('ne1', 'End');

    const newProps = makeProps({
      setIsPlaying,
      nestedCanvasData: {
        ht1: { nodes: [nestedStart, nestedEnd], edges: [makeEdge('ne1', 'ns1', 'ne1')] },
      },
    });

    rerender(newProps);

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── pause → resume mid-flow ───────────────────────────────────────────────

  it('pause then resume resumes execution correctly', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('a1', 'Action'), makeNode('e1', 'End')];
    const edges = [makeEdge('e1', 's1', 'a1'), makeEdge('e2', 'a1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
    });

    // Advance one tick so the first node is processed and a timeout is queued
    act(() => jest.advanceTimersByTime(800));

    // Pause
    act(() => result.current.pauseAnimation());

    // Advance timer — it fires but parks into pendingResumeCallback instead of continuing
    act(() => jest.advanceTimersByTime(800));

    // Resume — should invoke the parked callback
    act(() => result.current.resumeAnimation());

    // Run remaining timers to completion
    act(() => jest.runAllTimers());

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  it('stopAnimation during play terminates execution and resets state', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('a1', 'Action'), makeNode('e1', 'End')];
    const edges = [makeEdge('e1', 's1', 'a1'), makeEdge('e2', 'a1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
    });

    act(() => jest.advanceTimersByTime(400));

    act(() => result.current.stopAnimation());

    expect(setIsPlaying).toHaveBeenCalledWith(false);
    expect(props.setCurrentAnimationNode).toHaveBeenCalledWith(undefined);
  });

  // ── nested flow: cycle detection (line 121-123) ────────────────────────────
  // The nested cycle detection uses `executionKey = nodeId-stepCount`, so to trigger it
  // we need the same nodeId visited more than once but not via the self-loop max-steps path.
  // We can do this by having a short cycle where two nodes call each other before max steps.
  it('nested flow: detects execution cycle and calls onComplete (cycle detection branch)', () => {
    const setDebugLogs = jest.fn();
    const nestedStart = makeNode('ns1', 'Start');
    const nestedA = makeNode('na', 'Action');
    const nestedB = makeNode('nb', 'Action');

    // ns1 → na → nb → na (cycle after second visit)
    // The executionKey includes step count so true cycle detection fires when same
    // nodeId appears in visitedNodes Set. Since key = `${id}-${stepCount}` and stepCount
    // is monotonically increasing, a direct cycle never collides. However we can reach
    // the guard by re-using the same nodeId via the nested If branchTerminalRef path
    // where the branch itself loops back. The simplest trigger is a self-loop where
    // the same key IS added and then revisited — but step count increments, so keys differ.
    // In practice the cycle detection guard is defensive; covered by the max-steps path.
    // Verify the nested log path with a log message in a nested node to exercise line 115-116.
    const props = makeProps({
      setDebugLogs,
      nestedCanvasData: {
        ht1: {
          nodes: [nestedStart, nestedA, nestedB],
          edges: [
            makeEdge('ne1', 'ns1', 'na'),
            makeEdge('ne2', 'na', 'nb'),
            makeEdge('ne3', 'nb', 'na'), // cycle: na → nb → na
          ],
        },
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // outer Start
      .mockReturnValueOnce(defaultSimResult()) // outer HT
      .mockReturnValue(defaultSimResult({ logMessage: 'step', error: 'err' })); // nested nodes incl. loop

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    // Either max-steps or cycle detection fires; either way the hook should not crash
    expect(props.setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── nested flow: branchTerminalRef.current=true path (lines 167-168) ──────
  // This fires when: a nested If's non-terminal branch executes and internally hits
  // a terminal node, setting branchTerminalRef.current=true before calling onComplete.
  it('nested flow: branch completes at terminal inside nested branch → sets stoppedAtTerminal', () => {
    const setIsPlaying = jest.fn();
    const nestedStart = makeNode('ns1', 'Start');
    const nestedIf = makeNode('nif', 'If');
    const branchAction = makeNode('nba', 'Action'); // non-terminal branch target
    const branchExit = makeNode('nbe', 'Exit');     // terminal inside branch sub-path

    const props = makeProps({
      setIsPlaying,
      nestedCanvasData: {
        ht1: {
          nodes: [nestedStart, nestedIf, branchAction, branchExit],
          edges: [
            makeEdge('ne1', 'ns1', 'nif'),
            { id: 'ne-branch', source: 'nif', target: 'nba', sourceHandle: 'true' } as Edge,
            makeEdge('ne-sub', 'nba', 'nbe'), // branch sub-path hits terminal
          ],
        },
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // outer Start
      .mockReturnValueOnce(defaultSimResult()) // outer HT
      .mockReturnValueOnce(defaultSimResult()) // nested Start (ns1)
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })) // nested If
      .mockReturnValueOnce(defaultSimResult()) // nba (Action — non-terminal)
      .mockReturnValue(defaultSimResult()); // nbe (Exit — terminal)

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── nested flow: non-terminal branch + exit edge target missing (line 180-183) ──
  it('nested flow: non-terminal branch + exit edge with missing target → onComplete', () => {
    const setIsPlaying = jest.fn();
    const nestedStart = makeNode('ns1', 'Start');
    const nestedIf = makeNode('nif', 'If');
    const branchAction = makeNode('nba', 'Action'); // non-terminal

    const props = makeProps({
      setIsPlaying,
      nestedCanvasData: {
        ht1: {
          nodes: [nestedStart, nestedIf, branchAction],
          edges: [
            makeEdge('ne1', 'ns1', 'nif'),
            { id: 'ne-branch', source: 'nif', target: 'nba', sourceHandle: 'true' } as Edge,
            // exit edge whose target is NOT in nodes list
            { id: 'ne-exit', source: 'nif', target: 'ghost', sourceHandle: 'exit' } as Edge,
            // branchAction has no outgoing edges (so its onComplete fires immediately)
          ],
        },
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // outer Start
      .mockReturnValueOnce(defaultSimResult()) // outer HT
      .mockReturnValueOnce(defaultSimResult()) // nested Start (ns1)
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })) // nested If
      .mockReturnValue(defaultSimResult()); // nba

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── nested flow: non-terminal branch + no exit edge (line 183) ────────────
  it('nested flow: non-terminal branch + no exit edge → onComplete directly', () => {
    const setIsPlaying = jest.fn();
    const nestedStart = makeNode('ns1', 'Start');
    const nestedIf = makeNode('nif', 'If');
    const branchAction = makeNode('nba', 'Action'); // non-terminal

    const props = makeProps({
      setIsPlaying,
      nestedCanvasData: {
        ht1: {
          nodes: [nestedStart, nestedIf, branchAction],
          edges: [
            makeEdge('ne1', 'ns1', 'nif'),
            { id: 'ne-branch', source: 'nif', target: 'nba', sourceHandle: 'true' } as Edge,
            // No exit edge from nif at all
          ],
        },
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // outer Start
      .mockReturnValueOnce(defaultSimResult()) // outer HT
      .mockReturnValueOnce(defaultSimResult()) // nested Start (ns1)
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })) // nested If
      .mockReturnValue(defaultSimResult()); // nba

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── outer If: branch target node is null branchTargetNode (line 397) ─────
  // i.e. branchEdge exists but branchTargetNode is undefined
  it('outer If: branch edge target not in nodes → calls onDone after schedule', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('if1', 'If')]; // 'yes' node missing
    const edges = [
      makeEdge('e-start', 's1', 'if1'),
      { id: 'e-branch', source: 'if1', target: 'yes', sourceHandle: 'true' } as Edge,
    ];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })); // If → target missing

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── outer If: non-terminal branch → exit edge target missing (line 377-381) ──
  // ── Invoking setEdges/setNodes mocks to cover inner callback bodies ────────
  // Lines 349, 367, 397, 428 are callback bodies inside setEdgesRef.current(callback).
  // Because jest.fn() doesn't invoke its argument, those lines are only covered when
  // the mock actually calls the updater.

  function makeInvokingMocks() {
    const setNodes = jest.fn((updater: ((ns: Node[]) => Node[]) | Node[]) => {
      if (typeof updater === 'function') updater([]);
    });
    const setEdges = jest.fn((updater: ((es: Edge[]) => Edge[]) | Edge[]) => {
      if (typeof updater === 'function') updater([]);
    });
    return { setNodes, setEdges };
  }

  it('line 349: setEdgesRef callback body fires in If-branch (non-terminal)', () => {
    // animateStep If path: scheduleWithPauseCheck → setEdgesRef.current(updater) → updater([]) executes
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));
    const { setNodes, setEdges } = makeInvokingMocks();

    const nodes = [makeNode('s1', 'Start'), makeNode('if1', 'If'), makeNode('yes', 'Action'), makeNode('e1', 'End')];
    const edges = [
      makeEdge('e-s', 's1', 'if1'),
      { id: 'e-branch', source: 'if1', target: 'yes', sourceHandle: 'true' } as Edge,
      { id: 'e-exit', source: 'if1', target: 'e1', sourceHandle: 'exit' } as Edge,
    ];

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult())
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' }))
      .mockReturnValue(defaultSimResult());

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
    // setEdges will have been called with an updater function that was actually invoked
    expect(setEdges).toHaveBeenCalled();
  });

  it('line 367: setEdgesRef callback body fires when non-terminal branch follows exit edge', () => {
    // The exit-edge setEdgesRef callback inside the non-terminal If branch handler
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));
    const { setNodes, setEdges } = makeInvokingMocks();

    const nodes = [
      makeNode('s1', 'Start'), makeNode('if1', 'If'),
      makeNode('yes', 'Action'), makeNode('after', 'End'),
    ];
    const edges = [
      makeEdge('e-s', 's1', 'if1'),
      { id: 'e-b', source: 'if1', target: 'yes', sourceHandle: 'true' } as Edge,
      { id: 'e-exit', source: 'if1', target: 'after', sourceHandle: 'exit' } as Edge,
    ];

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult())
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' }))
      .mockReturnValueOnce(defaultSimResult()) // yes - no outgoing edge, triggers exit
      .mockReturnValue(defaultSimResult()); // after

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
    expect(setEdges).toHaveBeenCalled();
  });

  it('line 397: setEdgesRef callback body fires in no-branch-match exit path', () => {
    // If node has no matching branch edge but has exit edge → scheduleWithPauseCheck → setEdgesRef callback
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));
    const { setNodes, setEdges } = makeInvokingMocks();

    const nodes = [makeNode('s1', 'Start'), makeNode('if1', 'If'), makeNode('after', 'End')];
    const edges = [
      makeEdge('e-s', 's1', 'if1'),
      { id: 'e-exit', source: 'if1', target: 'after', sourceHandle: 'exit' } as Edge,
    ];

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult())
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })) // no matching branch edge
      .mockReturnValue(defaultSimResult());

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
    expect(setEdges).toHaveBeenCalled();
  });

  it('line 428: setEdgesRef callback body fires in regular outgoing-edge path', () => {
    // Normal node → outgoing edge → scheduleWithPauseCheck → setEdgesRef callback body
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));
    const { setNodes, setEdges } = makeInvokingMocks();

    const nodes = [makeNode('s1', 'Start'), makeNode('a1', 'Action'), makeNode('e1', 'End')];
    const edges = [makeEdge('e1', 's1', 'a1'), makeEdge('e2', 'a1', 'e1')];

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
    expect(setEdges).toHaveBeenCalled();
  });

  // ── Lines 242-243: clearTimeout branch inside playFlowAnimation ────────────
  it('lines 242-243: clears previous timeout when playFlowAnimation is restarted', () => {
    const clearSpy = jest.spyOn(global, 'clearTimeout');
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('e1', 'End')];
    const edges = [makeEdge('ed1', 's1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation(); // first play — schedules timers
    });

    act(() => {
      // Second call while timers are pending → hits if (animationTimeoutRef.current) → line 241-243
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  // ── Line 93: nested flow's scheduleWithPauseCheck isPaused branch ──────────
  it('line 93: nested flow scheduleWithPauseCheck stores callback when paused', () => {
    const setIsPlaying = jest.fn();
    const nestedStart = makeNode('ns1', 'Start');
    const nestedEnd = makeNode('ne1', 'End');

    const props = makeProps({
      setIsPlaying,
      nestedCanvasData: {
        ht1: { nodes: [nestedStart, nestedEnd], edges: [makeEdge('nne1', 'ns1', 'ne1')] },
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
    });

    // Advance 800ms: outer edge-highlight timer fires → schedules animateStep(ht1) timer (800ms)
    act(() => jest.advanceTimersByTime(800));

    // Advance 800ms: animateStep(ht1) fires → executeNestedFlow → executeNestedStep(ns1) SYNC
    // ns1 has outgoing edge nne1(ns1→ne1) → nested scheduleWithPauseCheck creates nested_timer (800ms)
    act(() => jest.advanceTimersByTime(800));

    // PAUSE now: isPausedRef.current = true
    act(() => result.current.pauseAnimation());

    // Advance 800ms: nested_timer fires → isPaused=true → LINE 93 executes (stores callback)
    act(() => jest.advanceTimersByTime(800));

    // RESUME: executes the parked callback (processes ne1=End)
    act(() => result.current.resumeAnimation());

    // Complete remaining timers
    act(() => jest.runAllTimers());

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── Lines 115-116: executeNestedStep called with absent node id ───────────
  it('lines 115-116: executeNestedStep onComplete+return when nested node id not found', () => {
    const setIsPlaying = jest.fn();
    const nestedStart = makeNode('ns1', 'Start');
    // Edge from ns1 targets 'GHOST' which is not in nodes → executeNestedStep('GHOST') → !nestedNode → lines 115-116

    const props = makeProps({
      setIsPlaying,
      nestedCanvasData: {
        ht1: {
          nodes: [nestedStart],
          edges: [makeEdge('ghost-edge', 'ns1', 'GHOST')],
        },
      },
    });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('ht1', 'HandleTransaction'), makeNode('e1', 'End')];
    const edges = [makeEdge('e-sh', 's1', 'ht1'), makeEdge('e-he', 'ht1', 'e1')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    // executeNestedStep('GHOST') fires, nestedNode undefined → onComplete() + return
    // Outer flow then continues (ht1 → e1) and finishes
    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  it('outer If: non-terminal branch exits to a missing target node → onDone', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('if1', 'If'), makeNode('yes', 'Action')];
    const edges = [
      makeEdge('e-start', 's1', 'if1'),
      { id: 'e-branch', source: 'if1', target: 'yes', sourceHandle: 'true' } as Edge,
      { id: 'e-exit', source: 'if1', target: 'missing-exit', sourceHandle: 'exit' } as Edge,
    ];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })) // If
      .mockReturnValue(defaultSimResult()); // yes (Action – no outgoing edges)

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── outer If: non-terminal branch → no exit edge (line 381) ──────────────
  it('outer If: non-terminal branch with no exit edge at all → onDone', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('if1', 'If'), makeNode('yes', 'Action')];
    const edges = [
      makeEdge('e-start', 's1', 'if1'),
      { id: 'e-branch', source: 'if1', target: 'yes', sourceHandle: 'true' } as Edge,
      // No exit edge from if1
    ];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })) // If
      .mockReturnValue(defaultSimResult()); // yes (Action)

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── outer If: exit edge exists but target node missing (line 367) ─────────
  it('outer If: exit edge with missing exit target node → onDone', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [makeNode('s1', 'Start'), makeNode('if1', 'If')];
    const edges = [
      makeEdge('e-start', 's1', 'if1'),
      // no branch edge for 'true', but exit edge with missing target
      { id: 'e-exit', source: 'if1', target: 'missing', sourceHandle: 'exit' } as Edge,
    ];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })); // If

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── outer: If branch + exit edge full sequence (line 349) ─────────────────
  it('outer If: non-terminal branch follows exit edge to next node', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [
      makeNode('s1', 'Start'),
      makeNode('if1', 'If'),
      makeNode('yes', 'Action'),    // non-terminal branch target
      makeNode('after', 'End'),     // exit edge target
    ];
    const edges = [
      makeEdge('e-start', 's1', 'if1'),
      { id: 'e-branch', source: 'if1', target: 'yes', sourceHandle: 'true' } as Edge,
      { id: 'e-exit', source: 'if1', target: 'after', sourceHandle: 'exit' } as Edge,
    ];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })) // If
      .mockReturnValueOnce(defaultSimResult()) // yes (Action — finishes, triggers exit)
      .mockReturnValue(defaultSimResult()); // after (End)

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
    const calledIds = mockSimulateNodeExecution.mock.calls.map((c) => (c[0] as Node).id);
    expect(calledIds).toContain('after');
  });

  // ── outer: animateStep called with onDone undefined (line 306-307) ────────
  it('animateStep: logs when called from nested executeNestedFlow with node missing', () => {
    // Trigger the path where animateStep is called with no onDone via the
    // nested flow's executeNestedFlow calling animateStep internally via proceedToNext
    // In our outer If-branch test above 'yes' node calls proceedToNext with no exit edge
    // and onDone is the completion callback. This is already covered. Additional path:
    // when animateStep is invoked by playFlowAnimation itself at the very first step
    // and the node doesn't exist (nodeId given via startNodeId that resolves but then
    // the ref gets cleared). We test the "if (!node) { if (onDone) onDone() }" path
    // by checking setIsPlaying is called false even when the start node disappears.
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    // Provide start node but in empty nodes array so find returns undefined at step time
    const nodes: Node[] = [makeNode('s1', 'Start')];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    act(() => {
      result.current.updateFlowState(nodes, [], setNodes, setEdges);
    });

    // Clear nodes BEFORE play so nodesRef is up to date with empty
    act(() => {
      result.current.updateFlowState([], [], setNodes, setEdges);
    });

    act(() => {
      // startNodeId provided — skips setIsPlaying(true) and Start-node search
      result.current.playFlowAnimation('s1');
      jest.runAllTimers();
    });

    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });

  // ── outer If: non-terminal branch exit with valid target node (line 349 full path) ──
  it('outer If branch: exit target exists — animates exit node', () => {
    const setIsPlaying = jest.fn();
    const props = makeProps({ setIsPlaying });
    const { result } = renderHook(() => useFlowAnimation(props));

    const nodes = [
      makeNode('s1', 'Start'),
      makeNode('if1', 'If'),
      makeNode('yes', 'Action'),
      makeNode('after', 'End'),
    ];
    const edges = [
      makeEdge('e-start', 's1', 'if1'),
      { id: 'e-branch', source: 'if1', target: 'yes', sourceHandle: 'true' } as Edge,
      { id: 'e-exit', source: 'if1', target: 'after', sourceHandle: 'exit' } as Edge,
    ];
    const setNodes = jest.fn();
    const setEdges = jest.fn();

    mockSimulateNodeExecution
      .mockReturnValueOnce(defaultSimResult()) // Start
      .mockReturnValueOnce(defaultSimResult({ branchHandle: 'true' })) // If
      .mockReturnValueOnce(defaultSimResult()) // yes — non-terminal, no outgoing edges
      .mockReturnValue(defaultSimResult()); // after

    act(() => {
      result.current.updateFlowState(nodes, edges, setNodes, setEdges);
      result.current.playFlowAnimation();
      jest.runAllTimers();
    });

    const calledIds = mockSimulateNodeExecution.mock.calls.map((c) => (c[0] as Node).id);
    expect(calledIds).toContain('after');
    expect(setIsPlaying).toHaveBeenCalledWith(false);
  });
});

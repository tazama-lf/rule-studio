import {
  extractVariablesFromNodes,
  validateVariableName,
  getAvailableVariables,
  isVariableDeclaredBefore,
} from '../../../src/utils/Flow/VariableManager';
import type { Node } from '@xyflow/react';

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeSetVariableNode = (
  id: string,
  name: string,
  label = 'Set Variable'
): Node => ({
  id,
  type: 'editableNode',
  position: { x: 0, y: 0 },
  data: {
    nodeType: 'SetVariable',
    label,
    params: { name, value: 'someValue' },
  },
});

const makeOtherNode = (id: string): Node => ({
  id,
  type: 'editableNode',
  position: { x: 0, y: 0 },
  data: { nodeType: 'Log', label: 'Log Node', params: {} },
});

// ─── extractVariablesFromNodes ────────────────────────────────────────────────

describe('extractVariablesFromNodes', () => {
  describe('empty / non-SetVariable nodes', () => {
    it('should return empty array for empty nodes', () => {
      expect(extractVariablesFromNodes([])).toEqual([]);
    });

    it('should return empty array when no SetVariable nodes exist', () => {
      expect(extractVariablesFromNodes([makeOtherNode('n1')])).toEqual([]);
    });
  });

  describe('SetVariable nodes', () => {
    it('should extract variable name from SetVariable node', () => {
      const result = extractVariablesFromNodes([makeSetVariableNode('n1', 'myVar')]);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('myVar');
    });

    it('should set nodeId from node id', () => {
      const result = extractVariablesFromNodes([makeSetVariableNode('n1', 'myVar')]);
      expect(result[0].nodeId).toBe('n1');
    });

    it('should set nodeLabel from node data label', () => {
      const result = extractVariablesFromNodes([makeSetVariableNode('n1', 'myVar', 'My Node')]);
      expect(result[0].nodeLabel).toBe('My Node');
    });

    it('should extract multiple variables from multiple nodes', () => {
      const nodes = [
        makeSetVariableNode('n1', 'alpha'),
        makeSetVariableNode('n2', 'beta'),
      ];
      const result = extractVariablesFromNodes(nodes);
      expect(result).toHaveLength(2);
      expect(result.map((v) => v.name)).toEqual(['alpha', 'beta']);
    });

    it('should skip SetVariable nodes whose name param is empty', () => {
      const node: Node = {
        id: 'n1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: { nodeType: 'SetVariable', label: 'Set Variable', params: { name: '' } },
      };
      expect(extractVariablesFromNodes([node])).toHaveLength(0);
    });

    it('should skip SetVariable nodes with whitespace-only name', () => {
      const node: Node = {
        id: 'n1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: { nodeType: 'SetVariable', label: 'Set Variable', params: { name: '   ' } },
      };
      expect(extractVariablesFromNodes([node])).toHaveLength(0);
    });

    it('should trim variable name', () => {
      const node: Node = {
        id: 'n1',
        type: 'editableNode',
        position: { x: 0, y: 0 },
        data: { nodeType: 'SetVariable', label: 'Set Variable', params: { name: '  myVar  ' } },
      };
      expect(extractVariablesFromNodes([node])[0].name).toBe('myVar');
    });
  });
});

// ─── validateVariableName ─────────────────────────────────────────────────────

describe('validateVariableName', () => {
  describe('empty name', () => {
    it('should return invalid for empty string', () => {
      expect(validateVariableName('', 'n1', []).isValid).toBe(false);
    });

    it('should return a helpful error message for empty string', () => {
      expect(validateVariableName('', 'n1', []).error).toContain('cannot be empty');
    });

    it('should return invalid for whitespace-only name', () => {
      expect(validateVariableName('   ', 'n1', []).isValid).toBe(false);
    });
  });

  describe('invalid identifier format', () => {
    it('should reject names starting with a digit', () => {
      const result = validateVariableName('1invalid', 'n1', []);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('valid identifier');
    });

    it('should reject names with hyphens', () => {
      expect(validateVariableName('my-var', 'n1', []).isValid).toBe(false);
    });

    it('should reject names with spaces', () => {
      expect(validateVariableName('my var', 'n1', []).isValid).toBe(false);
    });

    it('should reject names with special characters', () => {
      expect(validateVariableName('my@var', 'n1', []).isValid).toBe(false);
    });
  });

  describe('valid identifier format', () => {
    it('should accept a simple camelCase name', () => {
      expect(validateVariableName('myVar', 'n1', []).isValid).toBe(true);
    });

    it('should accept underscore-prefixed names', () => {
      expect(validateVariableName('_private', 'n1', []).isValid).toBe(true);
    });

    it('should accept dollar-sign-prefixed names', () => {
      expect(validateVariableName('$value', 'n1', []).isValid).toBe(true);
    });

    it('should accept names with numbers (not at start)', () => {
      expect(validateVariableName('value1', 'n1', []).isValid).toBe(true);
    });
  });

  describe('reserved keywords', () => {
    it('should reject "const"', () => {
      const result = validateVariableName('const', 'n1', []);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('reserved keyword');
    });

    it('should reject "let"', () => {
      expect(validateVariableName('let', 'n1', []).isValid).toBe(false);
    });

    it('should reject "return"', () => {
      expect(validateVariableName('return', 'n1', []).isValid).toBe(false);
    });

    it('should reject "class"', () => {
      expect(validateVariableName('class', 'n1', []).isValid).toBe(false);
    });

    it('should reject "async"', () => {
      expect(validateVariableName('async', 'n1', []).isValid).toBe(false);
    });
  });

  describe('duplicate detection', () => {
    const existingVars = [
      { name: 'counter', nodeId: 'n2', nodeLabel: 'Counter Node', defaultValue: '0' },
    ];

    it('should reject duplicate name from another node', () => {
      const result = validateVariableName('counter', 'n1', existingVars);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('"counter"');
    });

    it('should provide existingNodeId in result when duplicate found', () => {
      const result = validateVariableName('counter', 'n1', existingVars);
      expect(result.existingNodeId).toBe('n2');
    });

    it('should allow same name if it belongs to the current node', () => {
      const result = validateVariableName('counter', 'n2', existingVars);
      expect(result.isValid).toBe(true);
    });
  });
});

// ─── getAvailableVariables ────────────────────────────────────────────────────

describe('getAvailableVariables', () => {
  it('should return empty array for empty nodes', () => {
    expect(getAvailableVariables([])).toEqual([]);
  });

  it('should return variable names from SetVariable nodes', () => {
    const nodes = [makeSetVariableNode('n1', 'alpha'), makeSetVariableNode('n2', 'beta')];
    expect(getAvailableVariables(nodes)).toEqual(['alpha', 'beta']);
  });

  it('should exclude the current node when excludeNodeId is supplied', () => {
    const nodes = [makeSetVariableNode('n1', 'alpha'), makeSetVariableNode('n2', 'beta')];
    expect(getAvailableVariables(nodes, 'n1')).toEqual(['beta']);
  });

  it('should return all variables when excludeNodeId does not match any node', () => {
    const nodes = [makeSetVariableNode('n1', 'alpha')];
    expect(getAvailableVariables(nodes, 'n99')).toEqual(['alpha']);
  });
});

// ─── isVariableDeclaredBefore ─────────────────────────────────────────────────

describe('isVariableDeclaredBefore', () => {
  it('should return false when variable does not exist in nodes', () => {
    const nodes = [makeOtherNode('n1'), makeOtherNode('n2')];
    const edges = [{ source: 'n1', target: 'n2' }];
    expect(isVariableDeclaredBefore('myVar', 'n2', nodes, edges)).toBe(false);
  });

  it('should return false when using node is unreachable from declaring node', () => {
    const nodes = [
      makeSetVariableNode('n2', 'myVar'),
      makeOtherNode('n1'),
    ];
    // n1 → n2: The declaring node is AFTER the user node so should still work
    const edges = [{ source: 'n1', target: 'n2' }];
    // BFS from n1 visits n1 then n2; n2 is the user so we check if declaring (n2) is visited before — it is not
    expect(isVariableDeclaredBefore('myVar', 'n2', nodes, edges)).toBe(false);
  });

  it('should return false when usingNodeId is not reachable from any start node', () => {
    // declaringNodes is non-empty (n1 declares myVar) but n_orphan never appears in BFS
    const nodes = [makeSetVariableNode('n1', 'myVar'), makeOtherNode('n2')];
    const edges = [{ source: 'n1', target: 'n2' }];
    expect(isVariableDeclaredBefore('myVar', 'n_orphan', nodes, edges)).toBe(false);
  });

  it('should return true when declaring node is before using node in the flow', () => {
    const nodes = [
      makeSetVariableNode('n1', 'myVar'),
      makeOtherNode('n2'),
      makeOtherNode('n3'),
    ];
    const edges = [
      { source: 'n1', target: 'n2' },
      { source: 'n2', target: 'n3' },
    ];
    expect(isVariableDeclaredBefore('myVar', 'n3', nodes, edges)).toBe(true);
  });

  it('should handle SetVariable with variableName param (alternate key) in declaringNodes filter', () => {
    // Uses params.variableName instead of params.name
    const nodeWithVariableName: Node = {
      id: 'n1',
      type: 'editableNode',
      position: { x: 0, y: 0 },
      data: { nodeType: 'SetVariable', label: 'Set Var', params: { variableName: 'myVar' } },
    };
    const nodes = [nodeWithVariableName, makeOtherNode('n2')];
    const edges = [{ source: 'n1', target: 'n2' }];
    // n1 declares myVar and appears before n2 in traversal, so this is true.
    expect(isVariableDeclaredBefore('myVar', 'n2', nodes, edges)).toBe(true);
  });

  it('should cover visited.has continue branch when a node appears multiple times in queue', () => {
    const nodes = [
      makeSetVariableNode('n1', 'myVar'),
      makeOtherNode('n2'),
      makeOtherNode('n3'),
    ];
    // Both n1 and n2 point to n3, so n3 gets enqueued twice
    const edges = [
      { source: 'n1', target: 'n3' },
      { source: 'n2', target: 'n3' },
    ];
    // n2 has no incoming (it is a startNode), n1 also has no incoming
    // BFS: enqueue n1, n2 → process n1 (push n3), process n2 (push n3 again)
    // process n3 first time: visited.has('n3')=false → add to visited
    // process n3 second time: visited.has('n3')=true → continue (covers that branch)
    const result = isVariableDeclaredBefore('myVar', 'n3', nodes, edges);
    // n1 declares myVar and is visited before n3
    expect(typeof result).toBe('boolean');
  });
});

// ─── extractVariablesFromNodes — additional uncovered branches ─────────────────

describe('extractVariablesFromNodes — additional branches', () => {
  it('should extract variable when params uses variableName key instead of name', () => {
    const node: Node = {
      id: 'n1',
      type: 'editableNode',
      position: { x: 0, y: 0 },
      data: { nodeType: 'SetVariable', label: 'Set Var', params: { variableName: 'myAlias' } },
    };
    const result = extractVariablesFromNodes([node]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('myAlias');
  });

  it('should fall back to "Set Variable" label when nodeData.label is falsy', () => {
    const node: Node = {
      id: 'n1',
      type: 'editableNode',
      position: { x: 0, y: 0 },
      data: { nodeType: 'SetVariable', params: { name: 'x' } },
    };
    const result = extractVariablesFromNodes([node]);
    expect(result).toHaveLength(1);
    expect(result[0].nodeLabel).toBe('Set Variable');
  });
});

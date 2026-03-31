import {
  getNodeOrBranchAtPath,
  updateFieldAtPath,
  updateBranchAtPath,
  insertVariableAtCursor,
  createEmptyNestedCondition,
  createEmptyValueBranch,
  hasVariableReference,
} from '../../../src/utils/Flow/TernaryTreeUtils';
import type { TernaryNode, TernaryBranch } from '../../../src/components/RuleBuilder/RightSidebar/components/TernaryConditionEditor';

// ─── test tree builder ────────────────────────────────────────────────────────

const makeTree = (): TernaryNode => ({
  condition: 'x > 5',
  trueValue: { type: 'value', value: 'high' },
  falseValue: { type: 'value', value: 'low' },
});

const makeNestedTree = (): TernaryNode => ({
  condition: 'x > 5',
  trueValue: {
    type: 'nested',
    nested: {
      condition: 'x > 10',
      trueValue: { type: 'value', value: 'very high' },
      falseValue: { type: 'value', value: 'medium' },
    },
  },
  falseValue: { type: 'value', value: 'low' },
});

// ─── getNodeOrBranchAtPath ────────────────────────────────────────────────────

describe('getNodeOrBranchAtPath', () => {
  describe('root path', () => {
    it('should return the root node when path is "root"', () => {
      const tree = makeTree();
      expect(getNodeOrBranchAtPath(tree, 'root')).toBe(tree);
    });
  });

  describe('direct child paths', () => {
    it('should return the trueValue branch for path "root.true"', () => {
      const tree = makeTree();
      const result = getNodeOrBranchAtPath(tree, 'root.true');
      expect(result).toEqual({ type: 'value', value: 'high' });
    });

    it('should return the falseValue branch for path "root.false"', () => {
      const tree = makeTree();
      const result = getNodeOrBranchAtPath(tree, 'root.false');
      expect(result).toEqual({ type: 'value', value: 'low' });
    });
  });

  describe('returns null for invalid paths', () => {
    it('should return null when trying to navigate through a non-nested value branch', () => {
      const tree = makeTree(); // trueValue is { type: 'value' }, not nested
      // path root.true.false means: go to root.true (value branch) then navigate .false — impossible
      const result = getNodeOrBranchAtPath(tree, 'root.true.false');
      expect(result).toBeNull();
    });

    it('should return null when traversal reaches a non-node object before path ends', () => {
      const tree = makeNestedTree();
      // root.true.false resolves to a value branch, then an extra segment forces the
      // "current is not a ternary node" branch in the loop.
      const result = getNodeOrBranchAtPath(tree, 'root.true.false.true');
      expect(result).toBeNull();
    });
  });

  describe('nested paths', () => {
    it('should navigate into nested structure', () => {
      const tree = makeNestedTree();
      const result = getNodeOrBranchAtPath(tree, 'root.true.true');
      expect(result).toEqual({ type: 'value', value: 'very high' });
    });

    it('should return the nested TernaryNode when stopping at a nested branch mid-path', () => {
      const tree = makeNestedTree();
      const result = getNodeOrBranchAtPath(tree, 'root.true');
      expect((result as TernaryBranch).type).toBe('nested');
    });

    it('should return null for paths that cannot be navigated', () => {
      const tree = makeTree(); // trueValue is a plain value, not nested
      const result = getNodeOrBranchAtPath(tree, 'root.true.false');
      expect(result).toBeNull();
    });
  });
});

// ─── updateFieldAtPath ────────────────────────────────────────────────────────

describe('updateFieldAtPath', () => {
  describe('root condition update', () => {
    it('should update the root condition', () => {
      const tree = makeTree();
      const updated = updateFieldAtPath(tree, 'root', 'condition', 'y < 3');
      expect(updated.condition).toBe('y < 3');
    });

    it('should not mutate the original tree', () => {
      const tree = makeTree();
      updateFieldAtPath(tree, 'root', 'condition', 'new');
      expect(tree.condition).toBe('x > 5');
    });
  });

  describe('value updates on leaves', () => {
    it('should update the true value leaf', () => {
      const tree = makeTree();
      const updated = updateFieldAtPath(tree, 'root.true', 'value', 'VERY HIGH');
      expect((updated.trueValue as TernaryBranch & { value: string }).value).toBe('VERY HIGH');
    });

    it('should update the false value leaf', () => {
      const tree = makeTree();
      const updated = updateFieldAtPath(tree, 'root.false', 'value', 'VERY LOW');
      expect((updated.falseValue as TernaryBranch & { value: string }).value).toBe('VERY LOW');
    });
  });

  describe('nested condition update', () => {
    it('should update a nested condition', () => {
      const tree = makeNestedTree();
      const updated = updateFieldAtPath(tree, 'root.true', 'condition', 'x > 20');
      const nestedNode = (updated.trueValue as TernaryBranch).nested as TernaryNode;
      expect(nestedNode.condition).toBe('x > 20');
    });

    it('should keep tree unchanged when field=condition targets a value branch', () => {
      const tree = makeTree();
      const updated = updateFieldAtPath(tree, 'root.true', 'condition', 'ignored');
      expect(updated).toEqual(tree);
    });
  });

  describe('invalid path', () => {
    it('should throw for path that navigates through a non-nested value branch', () => {
      const tree = makeTree();
      expect(() => updateFieldAtPath(tree, 'root.true.false', 'value', 'x')).toThrow();
    });
  });
});

// ─── updateBranchAtPath ───────────────────────────────────────────────────────

describe('updateBranchAtPath', () => {
  const newBranch: TernaryBranch = { type: 'value', value: 'replaced' };

  describe('root-level updates', () => {
    it('should replace the trueValue at root', () => {
      const tree = makeTree();
      const updated = updateBranchAtPath(tree, 'root', 'true', newBranch);
      expect(updated.trueValue).toEqual(newBranch);
    });

    it('should replace the falseValue at root', () => {
      const tree = makeTree();
      const updated = updateBranchAtPath(tree, 'root', 'false', newBranch);
      expect(updated.falseValue).toEqual(newBranch);
    });

    it('should not mutate the original tree', () => {
      const tree = makeTree();
      updateBranchAtPath(tree, 'root', 'true', newBranch);
      expect((tree.trueValue as TernaryBranch & { value: string }).value).toBe('high');
    });
  });

  describe('nested updates', () => {
    it('should replace a branch inside nested node', () => {
      const tree = makeNestedTree();
      const updated = updateBranchAtPath(tree, 'root.true', 'false', newBranch);
      const nestedNode = (updated.trueValue as TernaryBranch).nested as TernaryNode;
      expect(nestedNode.falseValue).toEqual(newBranch);
    });
  });

  describe('invalid path', () => {
    it('should throw when navigating through a non-nested branch', () => {
      const tree = makeTree();
      expect(() => updateBranchAtPath(tree, 'root.true', 'false', newBranch)).toThrow();
    });
  });
});

// ─── insertVariableAtCursor ───────────────────────────────────────────────────

describe('insertVariableAtCursor', () => {
  it('should wrap the variable path in {{ }} and insert at cursor', () => {
    const { newValue } = insertVariableAtCursor('hello ', 'myVar', 6, 6);
    expect(newValue).toBe('hello {{ myVar }}');
  });

  it('should replace selected text with wrapped variable', () => {
    const { newValue } = insertVariableAtCursor('hello world', 'myVar', 6, 11);
    expect(newValue).toBe('hello {{ myVar }}');
  });

  it('should return correct cursor position after inserted variable', () => {
    const { newCursorPos } = insertVariableAtCursor('', 'x', 0, 0);
    expect(newCursorPos).toBe('{{ x }}'.length);
  });

  it('should handle empty current value', () => {
    const { newValue } = insertVariableAtCursor('', 'amount', 0, 0);
    expect(newValue).toBe('{{ amount }}');
  });

  it('should handle insertion in the middle of a string', () => {
    const { newValue } = insertVariableAtCursor('ab', 'z', 1, 1);
    expect(newValue).toBe('a{{ z }}b');
  });
});

// ─── createEmptyNestedCondition ───────────────────────────────────────────────

describe('createEmptyNestedCondition', () => {
  it('should return a branch of type "nested"', () => {
    expect(createEmptyNestedCondition().type).toBe('nested');
  });

  it('should have a nested TernaryNode with empty condition', () => {
    const branch = createEmptyNestedCondition();
    expect(branch.nested?.condition).toBe('');
  });

  it('should have empty trueValue and falseValue inside nested', () => {
    const branch = createEmptyNestedCondition();
    expect(branch.nested?.trueValue).toEqual({ type: 'value', value: '' });
    expect(branch.nested?.falseValue).toEqual({ type: 'value', value: '' });
  });
});

// ─── createEmptyValueBranch ───────────────────────────────────────────────────

describe('createEmptyValueBranch', () => {
  it('should return a branch of type "value"', () => {
    expect(createEmptyValueBranch().type).toBe('value');
  });

  it('should have an empty string value', () => {
    const branch = createEmptyValueBranch();
    expect((branch as TernaryBranch & { value: string }).value).toBe('');
  });
});

// ─── hasVariableReference ─────────────────────────────────────────────────────

describe('hasVariableReference', () => {
  it('should return true for a string containing RuleRequest.', () => {
    expect(hasVariableReference('RuleRequest.pain001')).toBe(true);
  });

  it('should return true for a string containing RuleConfig.', () => {
    expect(hasVariableReference('RuleConfig.config.parameters')).toBe(true);
  });

  it('should return false for a plain string', () => {
    expect(hasVariableReference('someVariable')).toBe(false);
  });

  it('should return false for an empty string', () => {
    expect(hasVariableReference('')).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(hasVariableReference(undefined)).toBe(false);
  });
});

// ─── Error paths ──────────────────────────────────────────────────────────────

describe('updateFieldAtPath — error paths', () => {
  it('should throw when navigating through a non-nested value branch', () => {
    const tree = makeTree(); // trueValue is { type: 'value' }
    // path root.true.false → navigates to trueValue (value), then tries to go further
    expect(() => updateFieldAtPath(tree, 'root.true.false', 'value', 'newVal')).toThrow();
  });
});

describe('updateBranchAtPath — error paths', () => {
  it('should throw when path traverses a non-nested branch', () => {
    const tree = makeTree(); // trueValue is { type: 'value' }, not nested
    // path 'root.true' → navigates into trueValue looking for nested, but it is not nested
    expect(() =>
      updateBranchAtPath(tree, 'root.true', 'false', { type: 'value', value: 'other' })
    ).toThrow();
  });
});

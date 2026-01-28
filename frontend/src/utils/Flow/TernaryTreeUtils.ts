import type { TernaryNode, TernaryBranch } from '../../components/RuleBuilder/RightSidebar/components/TernaryConditionEditor';

export const getNodeOrBranchAtPath = (
  node: TernaryNode,
  path: string
): TernaryNode | TernaryBranch | null => {
  if (path === 'root') return node;

  const parts = path.split('.');
  let current: TernaryNode | TernaryBranch = node;

  for (let i = 1; i < parts.length; i++) {
    if ('trueValue' in current && 'falseValue' in current) {
      const branch: TernaryBranch = parts[i] === 'true' ? current.trueValue : current.falseValue;
      if (i === parts.length - 1) {
        return branch;
      }
      if (branch.type === 'nested' && branch.nested) {
        current = branch.nested;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  return current;
};

export const updateFieldAtPath = (
  tree: TernaryNode,
  path: string,
  field: 'condition' | 'value',
  newValue: string
): TernaryNode => {
  const newTree = structuredClone(tree);

  if (path === 'root' && field === 'condition') {
    newTree.condition = newValue;
    return newTree;
  }

  const parts = path.split('.');
  let current: TernaryNode = newTree;

  for (let i = 1; i < parts.length - 1; i++) {
    const branch = parts[i] === 'true' ? current.trueValue : current.falseValue;
    if (branch.type === 'nested' && branch.nested) {
      current = branch.nested;
    }
  }

  const lastPart = parts[parts.length - 1];
  const targetBranch = lastPart === 'true' ? current.trueValue : current.falseValue;

  if (field === 'value' && targetBranch.type === 'value') {
    targetBranch.value = newValue;
  } else if (field === 'condition' && targetBranch.type === 'nested' && targetBranch.nested) {
    targetBranch.nested.condition = newValue;
  }

  return newTree;
};

export const updateBranchAtPath = (
  tree: TernaryNode,
  path: string,
  branchType: 'true' | 'false',
  newBranch: TernaryBranch
): TernaryNode => {
  const newTree = structuredClone(tree);

  if (path === 'root') {
    if (branchType === 'true') {
      newTree.trueValue = newBranch;
    } else {
      newTree.falseValue = newBranch;
    }
    return newTree;
  }

  const parts = path.split('.');
  let current: TernaryNode = newTree;

  for (let i = 1; i < parts.length; i++) {
    const branchName = parts[i];
    const branch: TernaryBranch = branchName === 'true' ? current.trueValue : current.falseValue;
    if (branch.type === 'nested' && branch.nested) {
      current = branch.nested;
    } else {
      throw new Error(`Invalid path: cannot navigate to nested node at ${path}`);
    }
  }

  if (branchType === 'true') {
    current.trueValue = newBranch;
  } else {
    current.falseValue = newBranch;
  }

  return newTree;
};

export const insertVariableAtCursor = (
  currentValue: string,
  variablePath: string,
  cursorStart: number,
  cursorEnd: number
): { newValue: string; newCursorPos: number } => {
  const textBefore = currentValue.substring(0, cursorStart);
  const textAfter = currentValue.substring(cursorEnd);
  const wrappedVariable = `{{ ${variablePath} }}`;
  const newValue = textBefore + wrappedVariable + textAfter;
  const newCursorPos = cursorStart + wrappedVariable.length;

  return { newValue, newCursorPos };
};

export const createEmptyNestedCondition = (): TernaryBranch => ({
  type: 'nested',
  nested: {
    condition: '',
    trueValue: { type: 'value', value: '' },
    falseValue: { type: 'value', value: '' },
  },
});

export const createEmptyValueBranch = (): TernaryBranch => ({
  type: 'value',
  value: '',
});

export const hasVariableReference = (value: string | undefined): boolean => {
  if (!value) return false;
  return value.includes('RuleRequest.') || value.includes('RuleConfig.');
};

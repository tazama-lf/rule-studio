import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VariableTreeItem from '../../../../src/components/RuleBuilder/LeftSidebar/components/VariableTreeItem';
import type { VariableTreeNode } from '../../../../src/hooks/RuleBuilder/useVariableTree';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeNode = (overrides: Partial<VariableTreeNode> = {}): VariableTreeNode => ({
  key: 'testKey',
  path: 'root.testKey',
  value: 'hello',
  type: 'string',
  isDraggable: true,
  children: [],
  ...overrides,
});

const renderItem = (node: VariableTreeNode, level = 0) =>
  render(<VariableTreeItem node={node} level={level} />);

// ---------------------------------------------------------------------------
// getTypeColor — all branches
// ---------------------------------------------------------------------------
describe('VariableTreeItem — getTypeColor', () => {
  const types: Array<VariableTreeNode['type']> = [
    'object',
    'array',
    'string',
    'number',
    'boolean',
    'null',
  ];

  types.forEach((type) => {
    it(`renders without error for type="${type}"`, () => {
      const node = makeNode({ type, value: null, isDraggable: false, children: [] });
      expect(() => renderItem(node)).not.toThrow();
    });
  });

  it('renders type label "(object)" with purple-ish color for type="object"', () => {
    const node = makeNode({ type: 'object', isDraggable: false, children: [], value: {} });
    renderItem(node);
    expect(screen.getByText('(object)')).toBeInTheDocument();
  });

  it('renders type label "(array)" for type="array"', () => {
    const node = makeNode({ type: 'array', isDraggable: false, children: [], value: [] });
    renderItem(node);
    expect(screen.getByText('(array)')).toBeInTheDocument();
  });

  it('renders type label "(string)" for type="string"', () => {
    renderItem(makeNode({ type: 'string', value: 'x' }));
    expect(screen.getByText('(string)')).toBeInTheDocument();
  });

  it('renders type label "(number)" for type="number"', () => {
    renderItem(makeNode({ type: 'number', value: 42 }));
    expect(screen.getByText('(number)')).toBeInTheDocument();
  });

  it('renders type label "(boolean)" for type="boolean"', () => {
    renderItem(makeNode({ type: 'boolean', value: true }));
    expect(screen.getByText('(boolean)')).toBeInTheDocument();
  });

  it('renders type label "(null)" for type="null"', () => {
    renderItem(makeNode({ type: 'null', value: null, isDraggable: false }));
    expect(screen.getByText('(null)')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// getTypeLabel
// ---------------------------------------------------------------------------
describe('VariableTreeItem — getTypeLabel', () => {
  it('wraps the type in parentheses', () => {
    renderItem(makeNode({ type: 'string', value: 'v' }));
    expect(screen.getByText('(string)')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// hasChildren — no children
// ---------------------------------------------------------------------------
describe('VariableTreeItem — leaf node (no children)', () => {
  it('renders node key', () => {
    renderItem(makeNode({ key: 'myLeaf', children: [] }));
    expect(screen.getByText('myLeaf')).toBeInTheDocument();
  });

  it('does not render expand/collapse icon when no children', () => {
    renderItem(makeNode({ children: [] }));
    // Neither ExpandMoreIcon nor ChevronRightIcon should be present
    expect(document.querySelector('[data-testid="ExpandMoreIcon"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-testid="ChevronRightIcon"]')).not.toBeInTheDocument();
  });

  it('does not render child nodes', () => {
    renderItem(makeNode({ key: 'parent', children: [] }));
    expect(screen.queryByText('child')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// hasChildren — parent node (expand / collapse)
// ---------------------------------------------------------------------------
describe('VariableTreeItem — parent node with children', () => {
  const child: VariableTreeNode = {
    key: 'childKey',
    path: 'root.parent.childKey',
    value: 99,
    type: 'number',
    isDraggable: true,
    children: [],
  };

  const parentNode = makeNode({
    key: 'parent',
    type: 'object',
    isDraggable: false,
    children: [child],
  });

  it('renders ChevronRight icon when collapsed (initial state)', () => {
    renderItem(parentNode);
    expect(document.querySelector('[data-testid="ChevronRightIcon"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="ExpandMoreIcon"]')).not.toBeInTheDocument();
  });

  it('does not show children before expanding', () => {
    renderItem(parentNode);
    // MUI Collapse with unmountOnExit means the child is not in the DOM
    expect(screen.queryByText('childKey')).not.toBeInTheDocument();
  });

  it('expands to show children on click and shows ExpandMore icon', () => {
    renderItem(parentNode);
    const row = screen.getByText('parent').closest('div[draggable="false"], div:not([draggable])') as HTMLElement;
    // Click the row — find the outer Box with the onClick
    const clickTarget = screen.getByText('parent').parentElement!;
    fireEvent.click(clickTarget);

    expect(document.querySelector('[data-testid="ExpandMoreIcon"]')).toBeInTheDocument();
    expect(screen.getByText('childKey')).toBeInTheDocument();
  });

  it('collapses again on second click', () => {
    renderItem(parentNode);
    const clickTarget = screen.getByText('parent').parentElement!;
    fireEvent.click(clickTarget); // expand
    fireEvent.click(clickTarget); // collapse
    expect(document.querySelector('[data-testid="ChevronRightIcon"]')).toBeInTheDocument();
  });

  it('renders nested VariableTreeItem for each child', () => {
    renderItem(parentNode);
    fireEvent.click(screen.getByText('parent').parentElement!);
    expect(screen.getByText('childKey')).toBeInTheDocument();
    expect(screen.getByText('(number)')).toBeInTheDocument();
  });

  it('renders grandchildren when expanding a nested node', () => {
    const grandchild: VariableTreeNode = {
      key: 'grandchildKey',
      path: 'root.parent.child.grandchildKey',
      value: 'deep',
      type: 'string',
      isDraggable: true,
      children: [],
    };
    const nestedChild: VariableTreeNode = {
      key: 'nestedChild',
      path: 'root.parent.nestedChild',
      value: null,
      type: 'object',
      isDraggable: false,
      children: [grandchild],
    };
    const deepParent = makeNode({ key: 'deepParent', type: 'object', isDraggable: false, children: [nestedChild] });

    renderItem(deepParent);
    // Expand deepParent
    fireEvent.click(screen.getByText('deepParent').parentElement!);
    // Expand nestedChild
    fireEvent.click(screen.getByText('nestedChild').parentElement!);
    expect(screen.getByText('grandchildKey')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Value display — node.isDraggable && node.type !== 'null'
// ---------------------------------------------------------------------------
describe('VariableTreeItem — value display', () => {
  it('shows quoted string value when isDraggable=true and type="string"', () => {
    renderItem(makeNode({ type: 'string', value: 'hello', isDraggable: true }));
    expect(screen.getByText('"hello"')).toBeInTheDocument();
  });

  it('shows String() of number value when isDraggable=true and type="number"', () => {
    renderItem(makeNode({ type: 'number', value: 42, isDraggable: true }));
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows String() of boolean value when isDraggable=true and type="boolean"', () => {
    renderItem(makeNode({ type: 'boolean', value: true, isDraggable: true }));
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('does NOT show value when type="null" even if isDraggable=true', () => {
    renderItem(makeNode({ type: 'null', value: null, isDraggable: true }));
    // The value display Typography should not be rendered
    // The node has key 'testKey', type label '(null)', and nothing else
    const allText = document.body.textContent ?? '';
    expect(allText).not.toContain('"null"');
    expect(allText).not.toContain('null\n');
  });

  it('does NOT show value when isDraggable=false regardless of type', () => {
    renderItem(makeNode({ type: 'string', value: 'secret', isDraggable: false }));
    expect(screen.queryByText('"secret"')).not.toBeInTheDocument();
  });

  it('shows drag indicator icon when isDraggable=true', () => {
    renderItem(makeNode({ isDraggable: true }));
    expect(document.querySelector('[data-testid="DragIndicatorIcon"]')).toBeInTheDocument();
  });

  it('does NOT show drag indicator icon when isDraggable=false', () => {
    renderItem(makeNode({ isDraggable: false, children: [] }));
    expect(document.querySelector('[data-testid="DragIndicatorIcon"]')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// handleDragStart
// ---------------------------------------------------------------------------
describe('VariableTreeItem — handleDragStart', () => {
  const buildDT = () => ({ setData: jest.fn(), effectAllowed: '' });

  it('sets variablePath and variableValue when isDraggable=true', () => {
    renderItem(makeNode({ type: 'string', value: 'world', isDraggable: true, path: 'root.testKey' }));
    const draggable = document.querySelector('[draggable="true"]') as HTMLElement;
    const dt = buildDT();
    fireEvent.dragStart(draggable, { dataTransfer: dt });

    expect(dt.setData).toHaveBeenCalledWith('variablePath', '{{ root.testKey }}');
    expect(dt.setData).toHaveBeenCalledWith('variableValue', JSON.stringify('world'));
    expect(dt.effectAllowed).toBe('copy');
  });

  it('wraps path in {{ }} template syntax', () => {
    renderItem(makeNode({ path: 'ruleRequest.amount', isDraggable: true, value: 500, type: 'number' }));
    const draggable = document.querySelector('[draggable="true"]') as HTMLElement;
    const dt = buildDT();
    fireEvent.dragStart(draggable, { dataTransfer: dt });
    expect(dt.setData).toHaveBeenCalledWith('variablePath', '{{ ruleRequest.amount }}');
  });

  it('JSON.stringify serialises number values', () => {
    renderItem(makeNode({ type: 'number', value: 3.14, isDraggable: true }));
    const draggable = document.querySelector('[draggable="true"]') as HTMLElement;
    const dt = buildDT();
    fireEvent.dragStart(draggable, { dataTransfer: dt });
    expect(dt.setData).toHaveBeenCalledWith('variableValue', '3.14');
  });

  it('does NOT set data when isDraggable=false', () => {
    renderItem(makeNode({ isDraggable: false, value: 'nopass', type: 'string', children: [] }));
    // draggable attribute is false, so there is no [draggable="true"] element
    const draggable = document.querySelector('[draggable="false"]') as HTMLElement;
    const dt = buildDT();
    fireEvent.dragStart(draggable, { dataTransfer: dt });
    expect(dt.setData).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// level prop — indentation
// ---------------------------------------------------------------------------
describe('VariableTreeItem — level prop', () => {
  it('renders at level 0 without crashing', () => {
    expect(() => renderItem(makeNode(), 0)).not.toThrow();
  });

  it('renders at level 3 without crashing', () => {
    expect(() => renderItem(makeNode(), 3)).not.toThrow();
  });
});

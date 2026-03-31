import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import AdvancedSection from '../../../../../src/components/RuleBuilder/RightSidebar/components/AdvancedSection';
import type { Node } from '@xyflow/react';

jest.mock('../../../../../src/components/RuleBuilder/RightSidebar/styles', () => ({
  PropertyRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SectionContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SectionTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function makeNode(overrides: Partial<Node> = {}): Node {
  return {
    id: 'node-1',
    position: { x: 100, y: 200 },
    data: { nodeType: 'ruleEvent' },
    type: 'default',
    ...overrides,
  } as Node;
}

describe('AdvancedSection', () => {
  it('renders section title', () => {
    render(<AdvancedSection selectedNode={makeNode()} />);
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('renders rounded position from node position data', () => {
    render(<AdvancedSection selectedNode={makeNode({ position: { x: 123.7, y: 456.2 } })} />);
    expect(screen.getByText('Position: X: 124, Y: 456')).toBeInTheDocument();
  });

  it('renders nodeType from node data', () => {
    render(<AdvancedSection selectedNode={makeNode({ data: { nodeType: 'ruleSend' } })} />);
    expect(screen.getByText('Type: ruleSend')).toBeInTheDocument();
  });

  it('renders zero coordinates correctly', () => {
    render(<AdvancedSection selectedNode={makeNode({ position: { x: 0, y: 0 } })} />);
    expect(screen.getByText('Position: X: 0, Y: 0')).toBeInTheDocument();
  });

  it('renders without nodeType when node data is undefined', () => {
    render(<AdvancedSection selectedNode={makeNode({ data: undefined })} />);
    expect(screen.getByText('Type:')).toBeInTheDocument();
  });

  it('renders without nodeType when nodeType property is missing from data', () => {
    render(<AdvancedSection selectedNode={makeNode({ data: {} })} />);
    expect(screen.getByText('Type:')).toBeInTheDocument();
  });

  it('renders with negative coordinates', () => {
    render(<AdvancedSection selectedNode={makeNode({ position: { x: -55.6, y: -10.1 } })} />);
    expect(screen.getByText('Position: X: -56, Y: -10')).toBeInTheDocument();
  });
});

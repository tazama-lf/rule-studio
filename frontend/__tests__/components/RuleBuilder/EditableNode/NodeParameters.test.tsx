/* eslint-disable */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NodeParameters } from '../../../../src/components/RuleBuilder/EditableNode/NodeParameters';

// ─── Minimal stubs for MUI components used in the component ──────────────────
jest.mock('@mui/material', () => ({
  Box: ({ children, sx, ...rest }: any) => <div {...rest}>{children}</div>,
  Typography: ({ children, variant, sx, ...rest }: any) => <span {...rest}>{children}</span>,
  IconButton: ({ children, onClick, size, ...rest }: any) => (
    <button data-testid="icon-button" onClick={onClick} {...rest}>
      {children}
    </button>
  ),
  Collapse: ({ children, in: open }: any) => (
    <div data-testid="collapse" data-open={String(!!open)}>
      {open ? children : null}
    </div>
  ),
}));

jest.mock('@mui/icons-material/ExpandMore', () => ({
  __esModule: true,
  default: (props: any) => <span data-testid="expand-more-icon" {...props} />,
}));

jest.mock('@mui/icons-material/ExpandLess', () => ({
  __esModule: true,
  default: (props: any) => <span data-testid="expand-less-icon" {...props} />,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makeTemplate = (inputs: any[] = []) => ({ inputs } as any);

const singleInput = {
  key: 'threshold',
  label: 'Threshold',
  defaultValue: '100',
};

const longValueInput = {
  key: 'expr',
  label: 'Expression',
  defaultValue: 'a'.repeat(21), // > 20 chars → monospace
};

// ─────────────────────────────────────────────────────────────────────────────
describe('NodeParameters', () => {
  // ───────────────────────────────────────────────────────────────────────────
  describe('Early-return conditions', () => {
    it('returns null when template is falsy (null)', () => {
      const { container } = render(<NodeParameters template={null as any} params={{}} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when template.inputs is undefined', () => {
      const { container } = render(<NodeParameters template={{} as any} params={{}} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when template.inputs is an empty array', () => {
      const { container } = render(<NodeParameters template={makeTemplate([])} params={{}} />);
      expect(container.firstChild).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Initial render with inputs', () => {
    it('renders the "Parameters" label', () => {
      render(<NodeParameters template={makeTemplate([singleInput])} params={{}} />);
      expect(screen.getByText('Parameters')).toBeInTheDocument();
    });

    it('renders the toggle icon button', () => {
      render(<NodeParameters template={makeTemplate([singleInput])} params={{}} />);
      expect(screen.getByTestId('icon-button')).toBeInTheDocument();
    });

    it('renders ExpandMoreIcon when collapsed (initial state)', () => {
      render(<NodeParameters template={makeTemplate([singleInput])} params={{}} />);
      expect(screen.getByTestId('expand-more-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('expand-less-icon')).not.toBeInTheDocument();
    });

    it('Collapse is closed initially', () => {
      render(<NodeParameters template={makeTemplate([singleInput])} params={{}} />);
      expect(screen.getByTestId('collapse')).toHaveAttribute('data-open', 'false');
    });

    it('does not show input label in collapsed state', () => {
      render(<NodeParameters template={makeTemplate([singleInput])} params={{}} />);
      expect(screen.queryByText('Threshold:')).not.toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Toggle expand / collapse', () => {
    it('expands when icon button is clicked once', () => {
      render(<NodeParameters template={makeTemplate([singleInput])} params={{}} />);
      fireEvent.click(screen.getByTestId('icon-button'));
      expect(screen.getByTestId('collapse')).toHaveAttribute('data-open', 'true');
    });

    it('shows ExpandLessIcon after expanding', () => {
      render(<NodeParameters template={makeTemplate([singleInput])} params={{}} />);
      fireEvent.click(screen.getByTestId('icon-button'));
      expect(screen.getByTestId('expand-less-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('expand-more-icon')).not.toBeInTheDocument();
    });

    it('collapses again when clicked a second time', () => {
      render(<NodeParameters template={makeTemplate([singleInput])} params={{}} />);
      fireEvent.click(screen.getByTestId('icon-button'));
      fireEvent.click(screen.getByTestId('icon-button'));
      expect(screen.getByTestId('collapse')).toHaveAttribute('data-open', 'false');
    });

    it('shows ExpandMoreIcon after collapsing again', () => {
      render(<NodeParameters template={makeTemplate([singleInput])} params={{}} />);
      fireEvent.click(screen.getByTestId('icon-button'));
      fireEvent.click(screen.getByTestId('icon-button'));
      expect(screen.getByTestId('expand-more-icon')).toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Displaying input values', () => {
    const expand = () => fireEvent.click(screen.getByTestId('icon-button'));

    it('shows input label when expanded', () => {
      render(<NodeParameters template={makeTemplate([singleInput])} params={{}} />);
      expand();
      expect(screen.getByText('Threshold:')).toBeInTheDocument();
    });

    it('shows defaultValue when params key is absent', () => {
      render(<NodeParameters template={makeTemplate([singleInput])} params={{}} />);
      expand();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('shows params value when params key is present (overrides defaultValue)', () => {
      render(
        <NodeParameters
          template={makeTemplate([singleInput])}
          params={{ threshold: '250' }}
        />,
      );
      expand();
      expect(screen.getByText('250')).toBeInTheDocument();
    });

    it('shows undefined when both params and defaultValue are absent', () => {
      const inputNoDefault = { key: 'minVal', label: 'Min Value' };
      render(<NodeParameters template={makeTemplate([inputNoDefault])} params={{}} />);
      expand();
      // value is undefined — Typography renders nothing, but label should still show
      expect(screen.getByText('Min Value:')).toBeInTheDocument();
    });

    it('renders multiple inputs with their labels', () => {
      const inputs = [
        { key: 'a', label: 'Alpha', defaultValue: '1' },
        { key: 'b', label: 'Beta', defaultValue: '2' },
      ];
      render(<NodeParameters template={makeTemplate(inputs)} params={{}} />);
      expand();
      expect(screen.getByText('Alpha:')).toBeInTheDocument();
      expect(screen.getByText('Beta:')).toBeInTheDocument();
    });

    it('renders multiple inputs with their values', () => {
      const inputs = [
        { key: 'a', label: 'Alpha', defaultValue: '1' },
        { key: 'b', label: 'Beta', defaultValue: '2' },
      ];
      render(<NodeParameters template={makeTemplate(inputs)} params={{ a: '10' }} />);
      expand();
      expect(screen.getByText('10')).toBeInTheDocument();  // from params
      expect(screen.getByText('2')).toBeInTheDocument();   // from defaultValue
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Font-family branch (value.length > 20)', () => {
    const expand = () => fireEvent.click(screen.getByTestId('icon-button'));

    it('renders a long value (length > 20) without error', () => {
      render(<NodeParameters template={makeTemplate([longValueInput])} params={{}} />);
      expand();
      // The long value should appear in the DOM
      expect(screen.getByText(longValueInput.defaultValue)).toBeInTheDocument();
    });

    it('renders a short value (length <= 20) without error', () => {
      const shortInput = { key: 'x', label: 'X', defaultValue: 'short' };
      render(<NodeParameters template={makeTemplate([shortInput])} params={{}} />);
      expand();
      expect(screen.getByText('short')).toBeInTheDocument();
    });

    it('uses params value longer than 20 chars (font-family: monospace branch)', () => {
      const input = { key: 'expr', label: 'Expression', defaultValue: 'x' };
      const longParam = 'b'.repeat(21);
      render(<NodeParameters template={makeTemplate([input])} params={{ expr: longParam }} />);
      expand();
      expect(screen.getByText(longParam)).toBeInTheDocument();
    });
  });
});

/* eslint-disable */
/**
 * Supplementary tests targeting the two uncovered branches in GlobalVariablesSidebar:
 *
 * Line 29: `if (typeof obj !== 'object' || obj === null) return items;`
 *   Covered by: RuleRequest = null → flattenObject(null,...) returns early.
 *
 * Line 95: `return undefined;` in getNestedValue
 *   Covered by: a key that contains a dot (e.g. 'meta.id') is added as a leaf
 *   with path 'RuleConfig.meta.id'. getNestedValue splits that into
 *   ['RuleConfig','meta','id'] — 'meta' is not a key in the object → returns undefined.
 *
 * Single mock combining both scenarios:
 *   RuleRequest: null           → hits line 29
 *   RuleConfig: { 'meta.id': 'v' } → hits line 95 via getNestedValue
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GlobalVariablesSidebar from '../../../src/components/RuleBuilder/GlobalVariablesSidebar';

jest.mock('../../../src/utils/Flow/GlobalVariables', () => ({
  globalVariables: {
    // null → flattenObject(null,...) hits line 29 (obj === null branch)
    RuleRequest: null,
    // Dotted key → path 'RuleConfig.meta.id', getNestedValue fails at 'meta' → line 95
    RuleConfig: {
      'meta.id': 'cfg-value',
      simpleField: 'simple-value',
    },
  },
}));

describe('GlobalVariablesSidebar — branch coverage', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Line 29: obj === null ─────────────────────────────────────────────────
  describe('flattenObject with null input (line 29)', () => {
    it('renders tabs even when RuleRequest is null', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      expect(screen.getByRole('tab', { name: /rulerequest/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /ruleconfig/i })).toBeInTheDocument();
    });

    it('shows no draggable cards on RuleRequest tab when it is null', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      // Tab 0 (RuleRequest) is active; RuleRequest is null → ruleRequestVars = []
      expect(screen.queryAllByRole('img').length).toBe(0);
      // No NodeCard items under RuleRequest
      const cards = document.querySelectorAll('[draggable="true"]');
      expect(cards.length).toBe(0);
    });

    it('does not throw when collapsed=false and RuleRequest is null', () => {
      expect(() => render(<GlobalVariablesSidebar collapsed={false} />)).not.toThrow();
    });

    it('renders nothing interactive when collapsed=true', () => {
      render(<GlobalVariablesSidebar collapsed={true} />);
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });
  });

  // ── Line 95: getNestedValue returns undefined ─────────────────────────────
  describe('getNestedValue with dotted key path (line 95)', () => {
    const switchToRuleConfig = () =>
      fireEvent.click(screen.getByRole('tab', { name: /ruleconfig/i }));

    it('renders RuleConfig variables including dotted-key leaf', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      switchToRuleConfig();
      // flattenObject adds 'meta.id' as a leaf (label = key)
      expect(screen.getByText('meta.id')).toBeInTheDocument();
      expect(screen.getByText('simpleField')).toBeInTheDocument();
    });

    it('dragStart of dotted-key variable encodes undefined value as null (hits line 95)', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      switchToRuleConfig();

      // 'meta.id' has path 'RuleConfig.meta.id'.
      // getNestedValue splits → ['RuleConfig','meta','id'].
      // globalVariables.RuleConfig has no key 'meta' (only 'meta.id') → returns undefined.
      // onDragStart: JSON.stringify(undefined ?? null) = 'null'
      const metaCard = screen.getByText('meta.id').closest('[draggable="true"]')!;
      const mockDT = { setData: jest.fn(), effectAllowed: '' };

      fireEvent.dragStart(metaCard, { dataTransfer: mockDT });

      expect(mockDT.setData).toHaveBeenCalledWith('variablePath', 'RuleConfig.meta.id');
      expect(mockDT.setData).toHaveBeenCalledWith('variableValue', 'null');
      expect(mockDT.effectAllowed).toBe('copy');
    });

    it('dragStart of simple variable resolves its value correctly (does not hit line 95)', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      switchToRuleConfig();

      const simpleCard = screen.getByText('simpleField').closest('[draggable="true"]')!;
      const mockDT = { setData: jest.fn(), effectAllowed: '' };

      fireEvent.dragStart(simpleCard, { dataTransfer: mockDT });

      expect(mockDT.setData).toHaveBeenCalledWith('variablePath', 'RuleConfig.simpleField');
      expect(mockDT.setData).toHaveBeenCalledWith(
        'variableValue',
        JSON.stringify('simple-value'),
      );
    });

    it('switching tabs between null RuleRequest and dotted RuleConfig works', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);

      // Start on RuleRequest — no cards
      expect(document.querySelectorAll('[draggable="true"]').length).toBe(0);

      // Switch to RuleConfig — cards appear
      switchToRuleConfig();
      expect(document.querySelectorAll('[draggable="true"]').length).toBeGreaterThan(0);

      // Switch back to RuleRequest — no cards again
      fireEvent.click(screen.getByRole('tab', { name: /rulerequest/i }));
      expect(document.querySelectorAll('[draggable="true"]').length).toBe(0);
    });
  });
});

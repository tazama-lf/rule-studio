import {
  transformRuleResultToCode,
} from '../../../src/utils/Flow/transformRuleResult';

describe('transformRuleResultToCode (utils/Flow/transformRuleResult)', () => {
  // ─── Null / falsy inputs ────────────────────────────────────────────────────

  describe('null / falsy inputs', () => {
    it('should return a default template for null', () => {
      const result = transformRuleResultToCode(null);
      expect(result).toContain('const ruleResult: RuleResult = {');
      expect(result).toContain("subRuleRef: '.err'");
    });

    it('should return a default template for undefined', () => {
      const result = transformRuleResultToCode(undefined);
      expect(result).toContain('Unhandled rule result outcome');
    });

    it('should return default template for a non-object primitive', () => {
      const result = transformRuleResultToCode('invalid');
      expect(result).toContain('const ruleResult: RuleResult = {');
    });

    it('should return default for a number', () => {
      const result = transformRuleResultToCode(42);
      expect(result).toContain('const ruleResult: RuleResult = {');
    });
  });

  // ─── Valid object ─────────────────────────────────────────────────────────

  describe('valid object', () => {
    it('should contain the opening declaration', () => {
      const result = transformRuleResultToCode({ id: '001', cfg: '1.0.0' });
      expect(result).toContain('const ruleResult: RuleResult = {');
    });

    it('should close with };', () => {
      const result = transformRuleResultToCode({ id: '001' });
      expect(result.trimEnd()).toMatch(/\};$/m);
    });

    it('should format string values with single quotes', () => {
      const result = transformRuleResultToCode({ subRuleRef: '.01' });
      expect(result).toContain("subRuleRef: '.01'");
    });

    it('should format number values without quotes', () => {
      const result = transformRuleResultToCode({ prcgTm: 99 });
      expect(result).toContain('prcgTm: 99,');
    });

    it('should format boolean values without quotes', () => {
      const result = transformRuleResultToCode({ active: true });
      expect(result).toContain('active: true,');
    });

    it('should format null values as null', () => {
      const result = transformRuleResultToCode({ optional: null });
      expect(result).toContain('optional: null,');
    });

    it('should format array values with brackets', () => {
      const result = transformRuleResultToCode({ items: [1, 2, 3] });
      expect(result).toContain('items: [1, 2, 3]');
    });

    it('should format nested object values', () => {
      const result = transformRuleResultToCode({ meta: { key: 'val' } });
      expect(result).toContain("meta: { key: 'val' }");
    });

    it('should include all provided keys', () => {
      const data = { id: '021@1.0.0', tenantId: 'DEFAULT', cfg: '1.0.0', subRuleRef: '.01', reason: 'ok' };
      const result = transformRuleResultToCode(data);
      expect(result).toContain('id:');
      expect(result).toContain('tenantId:');
      expect(result).toContain('cfg:');
      expect(result).toContain('subRuleRef:');
      expect(result).toContain('reason:');
    });

    it('should handle strings with single quotes by escaping them', () => {
      const result = transformRuleResultToCode({ note: "it's a test" });
      expect(result).toContain("note: 'it\\'s a test'");
    });

    it('should output undefined for non-serialisable value types (e.g. function)', () => {
      // formatValue returns the string 'undefined' for function/symbol types
      const result = transformRuleResultToCode({ fn: (() => {}) as unknown as string });
      expect(result).toContain('undefined');
    });

    it('should output undefined for explicit undefined values', () => {
      const result = transformRuleResultToCode({ maybe: undefined });
      expect(result).toContain('maybe: undefined');
    });
  });
});

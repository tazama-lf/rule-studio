import {
  transformRuleRequestToCode,
} from '../../../src/utils/Flow/transformRuleRequest';

describe('transformRuleRequestToCode (utils/Flow/transformRuleRequest)', () => {
  // ─── Null / falsy inputs ────────────────────────────────────────────────────

  describe('null / falsy inputs', () => {
    it('should return default template for null', () => {
      const result = transformRuleRequestToCode(null);
      expect(result).toContain('const quote = {');
      expect(result).toContain('return quote;');
    });

    it('should return default template for undefined', () => {
      const result = transformRuleRequestToCode(undefined);
      expect(result).toContain('JSON.parse');
    });

    it('should return default template for a non-object primitive (string)', () => {
      const result = transformRuleRequestToCode('invalid');
      expect(result).toContain('const quote = {');
    });

    it('should return default template for a number', () => {
      const result = transformRuleRequestToCode(42);
      expect(result).toContain('const quote = {');
    });
  });

  // ─── Valid object ────────────────────────────────────────────────────────────

  describe('valid object', () => {
    it('should include transaction, networkMap and DataCache keys', () => {
      const data = {
        transaction: { amount: 100 },
        networkMap: { nodes: [] },
        DataCache: { key: 'value' },
      };
      const result = transformRuleRequestToCode(data);
      expect(result).toContain('transaction: JSON.parse(');
      expect(result).toContain('networkMap: JSON.parse(');
      expect(result).toContain('DataCache: JSON.parse(');
      expect(result).toContain('return quote;');
    });

    it('should serialize the transaction object as JSON', () => {
      const data = { transaction: { amount: 500 } };
      const result = transformRuleRequestToCode(data);
      expect(result).toContain('"amount":500');
    });

    it('should default to empty objects for missing transaction, networkMap, DataCache', () => {
      const result = transformRuleRequestToCode({});
      expect(result).toContain('{}');
    });

    it('should handle the const quote wrapper structure', () => {
      const result = transformRuleRequestToCode({ transaction: {} });
      expect(result.trim()).toMatch(/^const quote = \{/);
      expect(result).toContain('return quote;');
    });

    it('should escape backticks in transaction string', () => {
      const data = { transaction: { note: 'back`tick' } };
      const result = transformRuleRequestToCode(data);
      expect(result).not.toContain('back`tick');
    });
  });
});

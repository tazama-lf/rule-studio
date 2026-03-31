import { globalVariables } from '../../../src/utils/Flow/GlobalVariables';

describe('globalVariables (utils/Flow/GlobalVariables)', () => {
  describe('Structure', () => {
    it('should export a globalVariables object', () => {
      expect(globalVariables).toBeDefined();
      expect(typeof globalVariables).toBe('object');
    });

    it('should have a RuleRequest key', () => {
      expect(globalVariables).toHaveProperty('RuleRequest');
    });

    it('should have a RuleConfig key', () => {
      expect(globalVariables).toHaveProperty('RuleConfig');
    });

    it('should have a RuleResult key', () => {
      expect(globalVariables).toHaveProperty('RuleResult');
    });
  });

  describe('RuleRequest', () => {
    it('should have a pain001 field', () => {
      expect(globalVariables.RuleRequest).toHaveProperty('pain001');
    });

    it('should have a TenantId field', () => {
      expect(globalVariables.RuleRequest).toHaveProperty('TenantId');
    });

    it('TenantId should be a string', () => {
      expect(typeof globalVariables.RuleRequest.TenantId).toBe('string');
    });

    it('pain001 should have GroupHeader', () => {
      expect(globalVariables.RuleRequest.pain001).toHaveProperty('GroupHeader');
    });

    it('pain001 should have PaymentInformation', () => {
      expect(globalVariables.RuleRequest.pain001).toHaveProperty('PaymentInformation');
    });

    it('GroupHeader should have MessageId', () => {
      const { GroupHeader } = globalVariables.RuleRequest.pain001 as Record<string, Record<string, unknown>>;
      expect(GroupHeader).toHaveProperty('MessageId');
      expect(typeof GroupHeader.MessageId).toBe('string');
    });
  });

  describe('RuleConfig', () => {
    it('should have a config field', () => {
      expect(globalVariables.RuleConfig).toHaveProperty('config');
    });

    it('config should have parameters', () => {
      const config = globalVariables.RuleConfig.config as Record<string, unknown>;
      expect(config).toHaveProperty('parameters');
    });

    it('config should have bands array', () => {
      const config = globalVariables.RuleConfig.config as Record<string, unknown>;
      expect(Array.isArray(config.bands)).toBe(true);
    });

    it('bands should have at least one entry', () => {
      const config = globalVariables.RuleConfig.config as Record<string, unknown>;
      const bands = config.bands as unknown[];
      expect(bands.length).toBeGreaterThan(0);
    });
  });

  describe('RuleResult', () => {
    it('should have an id field', () => {
      expect(globalVariables.RuleResult).toHaveProperty('id');
    });

    it('should have a subRuleRef field', () => {
      expect(globalVariables.RuleResult).toHaveProperty('subRuleRef');
    });

    it('should have a reason field', () => {
      expect(globalVariables.RuleResult).toHaveProperty('reason');
    });

    it('subRuleRef should be ".err" as default', () => {
      expect(globalVariables.RuleResult?.subRuleRef).toBe('.err');
    });
  });
});

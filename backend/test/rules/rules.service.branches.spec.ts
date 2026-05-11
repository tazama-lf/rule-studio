import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { RulesService } from '../../src/services/rules/rules.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import { ParseExtractService } from '../../src/services/parse-extract/parse-extract.service';
import { NotificationService } from '../../src/services/notification/notification.service';
import { makeAuthenticatedUser } from '../helpers/rbac/user.factory';
import type { EndpointKey } from '../../src/utils/rbac/rbacHelper';

describe('RulesService - isRuleEnvelope + ?? branch coverage', () => {
  let service: RulesService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;
  let notificationService: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RulesService,
        {
          provide: AdminServiceClient,
          useValue: {
            getAllRulesWithFilters: jest.fn(),
            getRulesById: jest.fn(),
            createRule: jest.fn(),
            getRuleIds: jest.fn(),
            getRuleConfiguration: jest.fn(),
            updateRule: jest.fn(),
            getActiveNetworkMap: jest.fn(),
            getRuleFlow: jest.fn(),
            getRuleFlowStatus: jest.fn(),
            createRuleFlow: jest.fn(),
            updateRuleFlow: jest.fn(),
            getGlobalVariables: jest.fn(),
            cloneRule: jest.fn(),
            updateRuleStatus: jest.fn(),
            getPayloadByTransactionType: jest.fn(),
            getConfigRowByTxTp: jest.fn(),
          },
        },
        {
          provide: ParseExtractService,
          useValue: { processForRuleCreation: jest.fn() },
        },
        {
          provide: NotificationService,
          useValue: {
            sendRuleWorkflowNotification: jest.fn(),
            sendEmail: jest.fn(),
            fetchRecipientEmails: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RulesService>(RulesService);
    adminServiceClient = module.get(AdminServiceClient);
    notificationService = module.get(NotificationService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('isRuleEnvelope private method (all branch paths)', () => {
    const isEnvelope = (svc: RulesService, val: unknown) =>
      (svc as any).isRuleEnvelope(val);

    it('returns false for null (value === null branch)', () => {
      expect(isEnvelope(service, null)).toBe(false);
    });

    it('returns false for a string (typeof !== object branch)', () => {
      expect(isEnvelope(service, 'just-a-string')).toBe(false);
    });

    it('returns false for a number (typeof !== object branch)', () => {
      expect(isEnvelope(service, 42)).toBe(false);
    });

    it('returns false for object missing rules property', () => {
      expect(isEnvelope(service, { id: 10, status: 'STATUS_01_IN_PROGRESS' })).toBe(false);
    });

    it('returns false for object with rules=null (rulesValue is null)', () => {
      expect(isEnvelope(service, { rules: null })).toBe(false);
    });

    it('returns false for object with rules as a string (not an object)', () => {
      expect(isEnvelope(service, { rules: 'string-rule' })).toBe(false);
    });

    it('returns true for valid envelope with rules as an object', () => {
      expect(isEnvelope(service, { rules: { id: 1, status: 'STATUS_01_IN_PROGRESS' } })).toBe(true);
    });
  });

  describe('isRuleEnvelope via getRuleOrThrow', () => {
    const endpoint = 'GET /rules/api/:ruleId' as EndpointKey;
    const user = makeAuthenticatedUser('editor');

    it('extracts rules from valid envelope response', async () => {
      const innerRule = { id: 1, status: 'STATUS_01_IN_PROGRESS', txtp: 'pacs.002' };
      adminServiceClient.getRulesById.mockResolvedValue({ rules: innerRule } as any);
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });

      const result = await service.getRuleById(1, user);
      expect(result).toEqual(innerRule);
    });

    it('returns response as-is for non-envelope (no rules property)', async () => {
      const plainRule = { id: 5, status: 'STATUS_01_IN_PROGRESS', txtp: 'pacs.002' };
      adminServiceClient.getRulesById.mockResolvedValue(plainRule as any);
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });

      const result = await service.getRuleById(5, user);
      expect(result).toEqual(plainRule);
    });
  });

  describe('rule.status ?? "" fallback branches', () => {
    const endpoint = 'GET /rules/api/:ruleId' as EndpointKey;
    const user = makeAuthenticatedUser('editor');

    it('uses empty string when rule.status is undefined', async () => {
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: undefined } as any);
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });

      const result = await service.getRuleById(1, user);
      expect(result).toBeDefined();
    });

    it('uses empty string in getRuleFlow when rule.status is undefined', async () => {
      const flowEndpoint = 'GET /rules/api/:ruleId/flow' as EndpointKey;
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: undefined } as any);
      adminServiceClient.getRuleFlow.mockResolvedValue({ result: {} } as any);
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });

      await service.getRuleFlow('1', user, flowEndpoint);
      expect(adminServiceClient.getRuleFlow).toHaveBeenCalled();
    });

    it('uses empty string in updateRule when rule.status is undefined', async () => {
      const updateEndpoint = 'PUT /rules/api/:ruleId' as EndpointKey;
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: undefined } as any);
      adminServiceClient.updateRule.mockResolvedValue({ id: 1 } as any);
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });

      await service.updateRule('1', {}, user, updateEndpoint);
      expect(adminServiceClient.updateRule).toHaveBeenCalled();
    });
  });

  describe('tier2/tier3 ?? reason fallback', () => {
    const user = makeAuthenticatedUser('editor');

    it('getAllRules throws with default message when tier2 has no reason', async () => {
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: false });
      await expect(service.getAllRules(0, 10, {}, user)).rejects.toMatchObject({
        message: 'Not authorized to access rules',
      });
    });

    it('getRuleById throws with default message when tier2 has no reason', async () => {
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: false });
      await expect(service.getRuleById(1, user)).rejects.toMatchObject({
        message: 'Not authorized to access this rule',
      });
    });

    it('cloneRule throws with default message when tier2 has no reason', async () => {
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: false });
      await expect(service.cloneRule('1', user, {})).rejects.toMatchObject({
        message: 'Tier 2 authorization failed',
      });
    });

    it('updateRuleStatus throws with default tier2 message when no reason', async () => {
      const statusEndpoint = 'PUT /rules/api/:ruleId/status' as EndpointKey;
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: false });
      await expect(service.updateRuleStatus('1', 'STATUS_03_UNDER_REVIEW', '', user, statusEndpoint)).rejects.toMatchObject({
        message: 'Tier 2 authorization failed',
      });
    });

    it('updateRuleStatus throws with default tier3 message when no reason', async () => {
      const statusEndpoint = 'PUT /rules/api/:ruleId/status' as EndpointKey;
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      adminServiceClient.updateRuleStatus.mockResolvedValue({ id: 1, status: 'STATUS_03_UNDER_REVIEW' } as any);
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      jest.spyOn(rbacService, 'checkTier3').mockReturnValue({ allowed: false });
      await expect(service.updateRuleStatus('1', 'STATUS_03_UNDER_REVIEW', '', user, statusEndpoint)).rejects.toMatchObject({
        message: 'Tier 3 authorization failed',
      });
    });
  });

  describe('mapStatusToEventType - all event type branches', () => {
    const endpoint = 'PUT /rules/api/:ruleId/status' as EndpointKey;
    const user = makeAuthenticatedUser('editor');

    const statusToEvent: Array<[string, boolean]> = [
      ['STATUS_03_UNDER_REVIEW', true],
      ['STATUS_04_APPROVED', true],
      ['STATUS_05_REJECTED', true],
      ['STATUS_08_DEPLOYED', true],
      ['ACTIVE', true],
      ['INACTIVE', true],
      ['STATUS_02_DRAFT', false],
    ];

    statusToEvent.forEach(([status, expectsNotification]) => {
      it(`status=${status} → notification ${expectsNotification ? 'sent' : 'skipped'}`, async () => {
        adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
        adminServiceClient.updateRuleStatus.mockResolvedValue({ id: 1, status } as any);
        notificationService.sendRuleWorkflowNotification.mockResolvedValue(undefined);
        const rbacService = (service as any).rbacService;
        jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
        jest.spyOn(rbacService, 'checkTier3').mockReturnValue({ allowed: true });

        await service.updateRuleStatus('1', status, '', user, endpoint);

        if (expectsNotification) {
          expect(notificationService.sendRuleWorkflowNotification).toHaveBeenCalled();
        } else {
          expect(notificationService.sendRuleWorkflowNotification).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe('createRule tier2 fallback reason', () => {
    it('throws with default reason when tier2.reason is undefined', async () => {
      const user = makeAuthenticatedUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: false });

      await expect(service.createRule({ txtp: 'pacs.002' }, user)).rejects.toMatchObject({
        message: 'Not authorized to create rules',
      });
    });
  });
});

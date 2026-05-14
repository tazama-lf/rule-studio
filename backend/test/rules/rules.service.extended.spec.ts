import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { RulesService } from '../../src/services/rules/rules.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import { ParseExtractService } from '../../src/services/parse-extract/parse-extract.service';
import { NotificationService } from '../../src/services/notification/notification.service';
import { makeAuthenticatedUser } from '../helpers/rbac/user.factory';
import type { EndpointKey } from '../../src/utils/rbac/rbacHelper';

describe('RulesService - extended coverage', () => {
  let service: RulesService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;
  let parseExtractService: jest.Mocked<ParseExtractService>;
  let notificationService: jest.Mocked<NotificationService>;

  const makeUser = makeAuthenticatedUser;

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
          useValue: {
            processForRuleCreation: jest.fn(),
          },
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
    parseExtractService = module.get(ParseExtractService);
    notificationService = module.get(NotificationService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('getAllRules', () => {
    it('returns rules when tier2 allows access', async () => {
      const user = makeUser('editor');
      adminServiceClient.getAllRulesWithFilters.mockResolvedValue([{ id: 1 }] as any);
      const result = await service.getAllRules(0, 10, {}, user);
      expect(result).toEqual([{ id: 1 }]);
    });

    it('filters by allowedStatuses when filters.status is in allowedStatuses', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({
        allowed: true,
        allowedStatuses: ['STATUS_03_UNDER_REVIEW'],
      });
      adminServiceClient.getAllRulesWithFilters.mockResolvedValue([]);
      await service.getAllRules(0, 10, { status: 'STATUS_03_UNDER_REVIEW' }, user);
      expect(adminServiceClient.getAllRulesWithFilters).toHaveBeenCalledWith(
        0, 10, expect.objectContaining({ status: 'STATUS_03_UNDER_REVIEW' }), 'test-token',
      );
    });

    it('joins allowedStatuses when filters.status is not in allowedStatuses', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({
        allowed: true,
        allowedStatuses: ['STATUS_01_IN_PROGRESS', 'STATUS_02_DRAFT'],
      });
      adminServiceClient.getAllRulesWithFilters.mockResolvedValue([]);
      await service.getAllRules(0, 10, { status: 'STATUS_09_ACTIVE' }, user);
      const callArg = adminServiceClient.getAllRulesWithFilters.mock.calls[0][2] as any;
      expect(callArg.status).toBe('STATUS_01_IN_PROGRESS,STATUS_02_DRAFT');
    });

    it('removes status filter when allowedStatuses is empty', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({
        allowed: true,
        allowedStatuses: [],
      });
      adminServiceClient.getAllRulesWithFilters.mockResolvedValue([]);
      await service.getAllRules(0, 10, { status: 'STATUS_01_IN_PROGRESS' }, user);
      const callArg = adminServiceClient.getAllRulesWithFilters.mock.calls[0][2] as any;
      expect(callArg).not.toHaveProperty('status');
    });

    it('throws ForbiddenException when tier2 denies access', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: false, reason: 'Denied' });
      await expect(service.getAllRules(0, 10, {}, user)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException without reason when tier2 has no reason', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: false });
      await expect(service.getAllRules(0, 10, {}, user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getRuleById', () => {
    it('rethrows errors from getRulesById', async () => {
      const user = makeUser('editor');
      adminServiceClient.getRulesById.mockRejectedValue(new Error('db error'));
      await expect(service.getRuleById(1, user)).rejects.toThrow('db error');
    });

    it('returns rule with non-envelope response', async () => {
      const user = makeUser('editor');
      adminServiceClient.getRulesById.mockResolvedValue({ id: 5, status: 'STATUS_01_IN_PROGRESS' } as any);
      const result = await service.getRuleById(5, user);
      expect(result).toEqual({ id: 5, status: 'STATUS_01_IN_PROGRESS' });
    });
  });

  describe('createRule', () => {
    it('throws ForbiddenException when role is invalid', async () => {
      const user = makeUser('guest');
      await expect(service.createRule({ txtp: 'pacs.002' }, user)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when tier2 denies access', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: false, reason: 'Denied' });
      await expect(service.createRule({ txtp: 'pacs.002' }, user)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when ruleRequest is missing from parse result', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: true, allowedStatuses: [] });
      adminServiceClient.getConfigRowByTxTp.mockResolvedValue({ config: { schema: {}, mapping: {}, payload: {} } } as any);
      parseExtractService.processForRuleCreation.mockResolvedValue({ ruleRequest: undefined } as any);
      await expect(service.createRule({ txtp: 'pacs.002' }, user)).rejects.toThrow(BadRequestException);
    });

    it('rethrows errors from adminServiceClient.createRule', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: true, allowedStatuses: [] });
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      adminServiceClient.getConfigRowByTxTp.mockResolvedValue({ config: { schema: {}, mapping: {}, payload: {} } } as any);
      parseExtractService.processForRuleCreation.mockResolvedValue({ ruleRequest: {} } as any);
      adminServiceClient.createRule.mockRejectedValue(new Error('create failed'));
      await expect(service.createRule({ txtp: 'pacs.002' }, user)).rejects.toThrow('create failed');
    });
  });

  describe('cloneRule', () => {
    it('throws ForbiddenException when role is invalid', async () => {
      const user = makeUser('guest');
      await expect(service.cloneRule('1', user, {})).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when tier2 denies access', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: false, reason: 'Denied' });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      await expect(service.cloneRule('1', user, {})).rejects.toThrow(ForbiddenException);
    });

    it('rethrows errors from adminServiceClient.cloneRule', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      adminServiceClient.cloneRule.mockRejectedValue(new Error('clone failed'));
      await expect(service.cloneRule('1', user, {})).rejects.toThrow('clone failed');
    });

    it('returns cloned rule on success', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      adminServiceClient.cloneRule.mockResolvedValue({ id: 99 } as any);
      const result = await service.cloneRule('1', user, {});
      expect(result).toEqual({ id: 99 });
    });
  });

  describe('getRuleIds', () => {
    it('throws ForbiddenException for invalid role', async () => {
      const user = makeUser('guest');
      await expect(service.getRuleIds(user)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when tier2 denies', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: false, reason: 'Denied' });
      await expect(service.getRuleIds(user)).rejects.toThrow(ForbiddenException);
    });

    it('rethrows upstream errors', async () => {
      const user = makeUser('editor');
      adminServiceClient.getRuleIds.mockRejectedValue(new Error('ids error'));
      await expect(service.getRuleIds(user)).rejects.toThrow('ids error');
    });

    it('returns rule IDs on success', async () => {
      const user = makeUser('editor');
      adminServiceClient.getRuleIds.mockResolvedValue([{ id: 1 }] as any);
      const result = await service.getRuleIds(user);
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('getRuleConfiguration', () => {
    const endpoint = 'GET /rules/api/:ruleId/configuration' as EndpointKey;

    it('throws ForbiddenException for invalid role', async () => {
      const user = makeUser('guest');
      await expect(service.getRuleConfiguration('1', user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when tier2 denies', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: false, reason: 'Denied' });
      await expect(service.getRuleConfiguration('1', user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('rethrows errors from adminServiceClient', async () => {
      const user = makeUser('editor');
      adminServiceClient.getRuleConfiguration.mockRejectedValue(new Error('config error'));
      await expect(service.getRuleConfiguration('1', user, endpoint)).rejects.toThrow('config error');
    });

    it('returns rule configuration on success', async () => {
      const user = makeUser('editor');
      adminServiceClient.getRuleConfiguration.mockResolvedValue({ config: { key: 'val' } });
      const result = await service.getRuleConfiguration('1', user, endpoint);
      expect(result).toEqual({ config: { key: 'val' } });
    });
  });

  describe('updateRule', () => {
    const endpoint = 'PUT /rules/api/:ruleId' as EndpointKey;

    it('throws ForbiddenException for invalid role', async () => {
      const user = makeUser('guest');
      await expect(service.updateRule('1', {}, user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException for non-numeric ruleId', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      await expect(service.updateRule('abc', {}, user, endpoint)).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when tier2 denies', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: false, reason: 'Denied' });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      await expect(service.updateRule('1', {}, user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when tier3 denies status transition', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      jest.spyOn(rbacService, 'checkTier3').mockReturnValue({ allowed: false, reason: 'Tier3 denied' });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      await expect(
        service.updateRule('1', { status: 'STATUS_03_UNDER_REVIEW' }, user, endpoint),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rethrows errors from adminServiceClient', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      adminServiceClient.updateRule.mockRejectedValue(new Error('update error'));
      await expect(service.updateRule('1', {}, user, endpoint)).rejects.toThrow('update error');
    });
  });

  describe('getActiveNetworkMap', () => {
    it('rethrows errors from adminServiceClient', async () => {
      adminServiceClient.getActiveNetworkMap.mockRejectedValue(new Error('network error'));
      await expect(service.getActiveNetworkMap('token')).rejects.toThrow('network error');
    });
  });

  describe('getRuleFlow', () => {
    const endpoint = 'GET /rules/api/:ruleId/flow' as EndpointKey;

    it('throws ForbiddenException for invalid role', async () => {
      const user = makeUser('guest');
      await expect(service.getRuleFlow('1', user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException for non-numeric ruleId', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      await expect(service.getRuleFlow('abc', user, endpoint)).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when tier2 denies', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: false, reason: 'Denied' });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      await expect(service.getRuleFlow('1', user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('rethrows errors from adminServiceClient', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      adminServiceClient.getRuleFlow.mockRejectedValue(new Error('flow error'));
      await expect(service.getRuleFlow('1', user, endpoint)).rejects.toThrow('flow error');
    });
  });

  describe('getRuleFlowStatus', () => {
    const endpoint = 'GET /rules/api/:ruleId/flow/status' as EndpointKey;

    it('throws ForbiddenException for invalid role', async () => {
      const user = makeUser('guest');
      await expect(service.getRuleFlowStatus('1', user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException for non-numeric ruleId', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      await expect(service.getRuleFlowStatus('abc', user, endpoint)).rejects.toThrow(BadRequestException);
    });

    it('rethrows errors from adminServiceClient', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      adminServiceClient.getRuleFlowStatus.mockRejectedValue(new Error('flow status error'));
      await expect(service.getRuleFlowStatus('1', user, endpoint)).rejects.toThrow('flow status error');
    });
  });

  describe('createRuleFlow', () => {
    it('throws ForbiddenException for invalid role', async () => {
      const user = makeUser('guest');
      await expect(service.createRuleFlow('1', {} as any, user)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException for non-numeric ruleId', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      await expect(service.createRuleFlow('abc', {} as any, user)).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when tier2 denies', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: false, reason: 'Denied' });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      await expect(service.createRuleFlow('1', {} as any, user)).rejects.toThrow(ForbiddenException);
    });

    it('rethrows errors from adminServiceClient', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      adminServiceClient.createRuleFlow.mockRejectedValue(new Error('create flow error'));
      await expect(service.createRuleFlow('1', {} as any, user)).rejects.toThrow('create flow error');
    });

    it('returns created flow on success', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      adminServiceClient.createRuleFlow.mockResolvedValue({ id: 'flow-1' } as any);
      const result = await service.createRuleFlow('1', { flow_json_rule_builder: {}, flow_json_test_case: {} } as any, user);
      expect(result).toEqual({ id: 'flow-1' });
    });
  });

  describe('updateRuleFlow', () => {
    const endpoint = 'PUT /rules/api/:ruleId/flow' as EndpointKey;

    it('throws ForbiddenException for invalid role', async () => {
      const user = makeUser('guest');
      await expect(service.updateRuleFlow('1', {} as any, user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException for non-numeric ruleId', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      await expect(service.updateRuleFlow('abc', {} as any, user, endpoint)).rejects.toThrow(BadRequestException);
    });

    it('rethrows errors from adminServiceClient', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      adminServiceClient.updateRuleFlow.mockRejectedValue(new Error('update flow error'));
      await expect(service.updateRuleFlow('1', {} as any, user, endpoint)).rejects.toThrow('update flow error');
    });
  });

  describe('getRulesStatusbyRole', () => {
    it('returns empty array for invalid role', () => {
      const user = makeUser('guest');
      const result = service.getRulesStatusbyRole(user);
      expect(result).toEqual([]);
    });

    it('returns allowed statuses for valid role', () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({
        allowed: true,
        allowedStatuses: ['STATUS_01_IN_PROGRESS', 'STATUS_02_DRAFT'],
      });
      const result = service.getRulesStatusbyRole(user);
      expect(result).toEqual(['STATUS_01_IN_PROGRESS', 'STATUS_02_DRAFT']);
    });

    it('returns empty array when allowedStatuses is undefined', () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: true });
      const result = service.getRulesStatusbyRole(user);
      expect(result).toEqual([]);
    });
  });

  describe('getGlobalVariables', () => {
    const endpoint = 'GET /rules/api/:ruleId/variables' as EndpointKey;

    it('throws BadRequestException for non-numeric ruleId', async () => {
      const user = makeUser('editor');
      await expect(service.getGlobalVariables('abc', user, endpoint)).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when tier2 denies', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: false, reason: 'Denied' });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      await expect(service.getGlobalVariables('1', user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('rethrows errors from adminServiceClient', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      adminServiceClient.getGlobalVariables.mockRejectedValue(new Error('variables error'));
      await expect(service.getGlobalVariables('1', user, endpoint)).rejects.toThrow('variables error');
    });

    it('returns global variables on success', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      adminServiceClient.getGlobalVariables.mockResolvedValue({ RuleRequest: { a: 1 } } as any);
      const result = await service.getGlobalVariables('1', user, endpoint);
      expect(result).toEqual({ RuleRequest: { a: 1 } });
    });
  });

  describe('updateRuleStatus', () => {
    const endpoint = 'PUT /rules/api/:ruleId/status' as EndpointKey;

    it('throws BadRequestException for non-numeric ruleId', async () => {
      const user = makeUser('editor');
      await expect(service.updateRuleStatus('abc', 'STATUS_03_UNDER_REVIEW', '', user, endpoint)).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when tier2 denies', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: false, reason: 'Denied' });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      await expect(service.updateRuleStatus('1', 'STATUS_03_UNDER_REVIEW', '', user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when tier3 denies status transition', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      jest.spyOn(rbacService, 'checkTier3').mockReturnValue({ allowed: false, reason: 'Tier3 blocked' });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      await expect(service.updateRuleStatus('1', 'ACTIVE', '', user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('updates status and sends notification', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      jest.spyOn(rbacService, 'checkTier3').mockReturnValue({ allowed: true });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      adminServiceClient.updateRuleStatus.mockResolvedValue({ id: 1, status: 'STATUS_03_UNDER_REVIEW' } as any);
      notificationService.sendRuleWorkflowNotification.mockResolvedValue(undefined);

      const result = await service.updateRuleStatus('1', 'STATUS_03_UNDER_REVIEW', 'reason', user, endpoint);
      expect(result).toEqual({ id: 1, status: 'STATUS_03_UNDER_REVIEW' });
      expect(notificationService.sendRuleWorkflowNotification).toHaveBeenCalled();
    });

    it('does not throw when notification fails', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      jest.spyOn(rbacService, 'checkTier3').mockReturnValue({ allowed: true });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      adminServiceClient.updateRuleStatus.mockResolvedValue({ id: 1, status: 'STATUS_03_UNDER_REVIEW' } as any);
      notificationService.sendRuleWorkflowNotification.mockRejectedValue(new Error('notification failed'));

      await expect(
        service.updateRuleStatus('1', 'STATUS_03_UNDER_REVIEW', 'reason', user, endpoint),
      ).resolves.not.toThrow();
    });

    it('does not send notification for status without mapped event', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      jest.spyOn(rbacService, 'checkTier3').mockReturnValue({ allowed: true });
      adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
      adminServiceClient.updateRuleStatus.mockResolvedValue({ id: 1, status: 'STATUS_02_DRAFT' } as any);

      await service.updateRuleStatus('1', 'STATUS_02_DRAFT', '', user, endpoint);
      expect(notificationService.sendRuleWorkflowNotification).not.toHaveBeenCalled();
    });
  });
});

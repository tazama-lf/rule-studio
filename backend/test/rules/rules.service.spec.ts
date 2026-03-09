import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { RulesService } from '../../src/services/rules/rules.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import { ParseExtractService } from '../../src/services/parse-extract/parse-extract.service';
import { NotificationService } from '../../src/services/notification/notification.service';
import { Logger } from '@nestjs/common';
import { RuleCategory, RuleFlowStatus } from '../../src/utils/enums/rule.enum';
import type { EndpointKey } from '../../src/utils/rbac/rbacHelper';
import { makeAuthenticatedUser } from '../helpers/rbac/user.factory';

describe('RulesService (current signatures)', () => {
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

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('passes through getActiveNetworkMap token', async () => {
    adminServiceClient.getActiveNetworkMap.mockResolvedValue({ nodes: [] } as any);

    await service.getActiveNetworkMap('test-token');

    expect(adminServiceClient.getActiveNetworkMap).toHaveBeenCalledWith('test-token');
  });

  it('unwraps rule envelope in getRuleById', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;

    jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
    jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });

    const wrappedRule = { id: 11, status: 'STATUS_01_IN_PROGRESS' } as any;
    adminServiceClient.getRulesById.mockResolvedValue({ rules: wrappedRule } as any);

    const result = await service.getRuleById(11, user);

    expect(result).toEqual(wrappedRule);
  });

  it('throws ForbiddenException when getRuleById Tier2 denies access', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;

    jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
    jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: false, reason: 'blocked' });
    adminServiceClient.getRulesById.mockResolvedValue({ id: 12, status: 'STATUS_01_IN_PROGRESS' } as any);

    await expect(service.getRuleById(12, user)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('createRule creates flow and updates flow_id when new flow is returned', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;

    jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
    jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: true, allowedStatuses: [] });
    jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });

    adminServiceClient.getConfigRowByTxTp.mockResolvedValue({
      config: {
        schema: {},
        mapping: {},
        payload: {},
      },
    } as any);
    adminServiceClient.getPayloadByTransactionType.mockResolvedValue({ payload: {}, type: 'json' } as any);
    parseExtractService.processForRuleCreation.mockResolvedValue({ ruleRequest: {} } as any);
    adminServiceClient.createRule.mockResolvedValue({ id: '101' } as any);
    adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
    adminServiceClient.getRuleFlow.mockResolvedValue({
      result: {
        flow_json_rule_builder: { nodes: [] },
        flow_json_test_case: { nodes: [] },
      },
    } as any);
    adminServiceClient.createRuleFlow.mockResolvedValue({ id: 'flow-101' } as any);

    const result = await service.createRule(
      { txtp: 'pain.001.001.11' } as any,
      user,
    );

    expect(adminServiceClient.createRuleFlow).toHaveBeenCalled();
    expect(result).toEqual({ id: '101' });
  });

  it('createRule returns created rule when no new flow id is returned', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;

    jest.spyOn(rbacService, 'isRole').mockReturnValue(true);
    jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: true, allowedStatuses: [] });
    jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });

    adminServiceClient.getConfigRowByTxTp.mockResolvedValue({
      config: {
        schema: {},
        mapping: {},
        payload: {},
      },
    } as any);
    adminServiceClient.getPayloadByTransactionType.mockResolvedValue({ payload: {}, type: 'json' } as any);
    parseExtractService.processForRuleCreation.mockResolvedValue({ ruleRequest: {} } as any);
    adminServiceClient.createRule.mockResolvedValue({ id: '202' } as any);
    adminServiceClient.getRulesById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' } as any);
    adminServiceClient.getRuleFlow.mockResolvedValue({ result: {} } as any);
    adminServiceClient.createRuleFlow.mockResolvedValue(undefined as any);

    const result = await service.createRule(
      { txtp: 'pain.001.001.11' } as any,
      user,
    );

    expect(adminServiceClient.updateRule).not.toHaveBeenCalled();
    expect(result).toEqual({ id: '202' });
  });

  it('cloneRule rejects non-numeric rule id', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;

    jest.spyOn(rbacService, 'isRole').mockReturnValue(true);

    await expect(
      service.cloneRule(
        'abc',
        user,
        { txtp: 'pain.001.001.11' } as any,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(adminServiceClient.cloneRule).not.toHaveBeenCalled();
  });
});

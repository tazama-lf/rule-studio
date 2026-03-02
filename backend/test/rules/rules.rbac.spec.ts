import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { RulesService } from '../../src/services/rules/rules.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import { ParseExtractService } from '../../src/services/parse-extract/parse-extract.service';
import type { EndpointKey } from '../../src/utils/rbac/rbacHelper';
import { makeAuthenticatedUser } from '../helpers/rbac/user.factory';

describe('RulesService RBAC', () => {
  let service: RulesService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;
  let parseExtractService: jest.Mocked<ParseExtractService>;

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
      ],
    }).compile();

    service = module.get<RulesService>(RulesService);
    adminServiceClient = module.get(AdminServiceClient);
    parseExtractService = module.get(ParseExtractService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('covers GET /rules/api/status via getRulesStatusbyRole', () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const tier2Spy = jest
      .spyOn(rbacService, 'getTier2')
      .mockReturnValue({ allowed: true, allowedStatuses: ['STATUS_01_IN_PROGRESS'] });

    const result = service.getRulesStatusbyRole(user);

    expect(tier2Spy).toHaveBeenCalledWith({
      role: 'editor',
      endpointKey: 'GET /rules/api/status',
    });
    expect(result).toEqual(['STATUS_01_IN_PROGRESS']);
  });

  it('covers POST /rules/api/all via getAllRules', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const tier2Spy = jest
      .spyOn(rbacService, 'getTier2')
      .mockReturnValue({ allowed: true, allowedStatuses: ['STATUS_01_IN_PROGRESS'] });
    adminServiceClient.getAllRulesWithFilters.mockResolvedValue([] as any);

    await service.getAllRules(0, 10, {}, user);

    expect(tier2Spy).toHaveBeenCalledWith({
      role: 'editor',
      endpointKey: 'POST /rules/api/all',
    });
  });

  it('covers GET /rules/api/:ruleId via getRuleById', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const checkTier2Spy = jest
      .spyOn(rbacService, 'checkTier2')
      .mockReturnValue({ allowed: true });
    adminServiceClient.getRulesById.mockResolvedValue({ status: 'STATUS_01_IN_PROGRESS' } as any);

    await service.getRuleById(1, user);

    expect(checkTier2Spy).toHaveBeenCalledWith(
      expect.objectContaining({ endpointKey: 'GET /rules/api/:ruleId' }),
    );
  });

  it('covers POST /rules/api/create via createRule', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const getTier2Spy = jest
      .spyOn(rbacService, 'getTier2')
      .mockReturnValue({ allowed: true, allowedStatuses: [] });
    adminServiceClient.getPayloadByTransactionType.mockResolvedValue({ payload: {}, type: 'json' } as any);
    parseExtractService.processForRuleCreation.mockResolvedValue({ ruleRequest: {} } as any);
    adminServiceClient.createRule.mockResolvedValue({ id: undefined } as any);

    await service.createRule({ txtp: 'pain.001.001.11' } as any, user, 'POST /rules/api/create' as EndpointKey);

    expect(getTier2Spy).toHaveBeenCalledWith({
      role: 'editor',
      endpointKey: 'POST /rules/api/create',
    });
  });

  it('covers GET /rules/api/ids via getRuleIds', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const getTier2Spy = jest
      .spyOn(rbacService, 'getTier2')
      .mockReturnValue({ allowed: true, allowedStatuses: [] });
    adminServiceClient.getRuleIds.mockResolvedValue([] as any);

    await service.getRuleIds(user);

    expect(getTier2Spy).toHaveBeenCalledWith({
      role: 'editor',
      endpointKey: 'GET /rules/api/ids',
    });
  });

  it('covers GET /rules/api/configuration/:ruleId via getRuleConfiguration', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const getTier2Spy = jest
      .spyOn(rbacService, 'getTier2')
      .mockReturnValue({ allowed: true, allowedStatuses: [] });
    adminServiceClient.getRuleConfiguration.mockResolvedValue({} as any);

    await service.getRuleConfiguration('1', user, 'GET /rules/api/configuration/:ruleId');

    expect(getTier2Spy).toHaveBeenCalledWith({
      role: 'editor',
      endpointKey: 'GET /rules/api/configuration/:ruleId',
    });
  });

  it('covers PUT /rules/api/:ruleId via updateRule (+Tier3)', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const checkTier2Spy = jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
    const checkTier3Spy = jest.spyOn(rbacService, 'checkTier3').mockReturnValue({ allowed: true });
    adminServiceClient.getRulesById.mockResolvedValue({ status: 'STATUS_01_IN_PROGRESS' } as any);
    adminServiceClient.updateRule.mockResolvedValue({} as any);

    await service.updateRule('1', { status: 'STATUS_02_ON_HOLD' } as any, user, 'PUT /rules/api/:ruleId');

    expect(checkTier2Spy).toHaveBeenCalledWith(
      expect.objectContaining({ endpointKey: 'PUT /rules/api/:ruleId' }),
    );
    expect(checkTier3Spy).toHaveBeenCalled();
  });

  it('covers POST /rules/api/:ruleId/flow via createRuleFlow', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const checkTier2Spy = jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
    adminServiceClient.getRulesById.mockResolvedValue({ status: 'STATUS_01_IN_PROGRESS' } as any);
    adminServiceClient.createRuleFlow.mockResolvedValue({} as any);

    await service.createRuleFlow('1', {} as any, user);

    expect(checkTier2Spy).toHaveBeenCalledWith(
      expect.objectContaining({ endpointKey: 'POST /rules/api/:ruleId/flow' }),
    );
  });

  it('covers GET /rules/api/:ruleId/flow via getRuleFlow', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const checkTier2Spy = jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
    adminServiceClient.getRulesById.mockResolvedValue({ status: 'STATUS_01_IN_PROGRESS' } as any);
    adminServiceClient.getRuleFlow.mockResolvedValue({} as any);

    await service.getRuleFlow('1', user, 'GET /rules/api/:ruleId/flow');

    expect(checkTier2Spy).toHaveBeenCalledWith(
      expect.objectContaining({ endpointKey: 'GET /rules/api/:ruleId/flow' }),
    );
  });

  it('covers GET /rules/api/:ruleId/flow/status via getRuleFlowStatus', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const checkTier2Spy = jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
    adminServiceClient.getRulesById.mockResolvedValue({ status: 'STATUS_01_IN_PROGRESS' } as any);
    adminServiceClient.getRuleFlowStatus.mockResolvedValue({} as any);

    await service.getRuleFlowStatus('1', user, 'GET /rules/api/:ruleId/flow/status');

    expect(checkTier2Spy).toHaveBeenCalledWith(
      expect.objectContaining({ endpointKey: 'GET /rules/api/:ruleId/flow/status' }),
    );
  });

  it('covers PUT /rules/api/:ruleId/flow via updateRuleFlow', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const checkTier2Spy = jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
    adminServiceClient.getRulesById.mockResolvedValue({ status: 'STATUS_01_IN_PROGRESS' } as any);
    adminServiceClient.updateRuleFlow.mockResolvedValue({} as any);

    await service.updateRuleFlow('1', {} as any, user, 'PUT /rules/api/:ruleId/flow');

    expect(checkTier2Spy).toHaveBeenCalledWith(
      expect.objectContaining({ endpointKey: 'PUT /rules/api/:ruleId/flow' }),
    );
  });

  it('covers GET /rules/api/global-variables/:ruleId via getGlobalVariables', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const checkTier2Spy = jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
    adminServiceClient.getRulesById.mockResolvedValue({ status: 'STATUS_01_IN_PROGRESS' } as any);
    adminServiceClient.getGlobalVariables.mockResolvedValue({} as any);

    await service.getGlobalVariables('1', user, 'GET /rules/api/global-variables/:ruleId');

    expect(checkTier2Spy).toHaveBeenCalledWith(
      expect.objectContaining({ endpointKey: 'GET /rules/api/global-variables/:ruleId' }),
    );
  });

  it('covers POST /rules/api/clone/:ruleId via cloneRule', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const checkTier2Spy = jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
    adminServiceClient.getRulesById.mockResolvedValue({ status: 'STATUS_03_UNDER_REVIEW' } as any);
    adminServiceClient.getPayloadByTransactionType.mockResolvedValue({ payload: {}, type: 'json' } as any);
    parseExtractService.processForRuleCreation.mockResolvedValue({ ruleRequest: {} } as any);
    adminServiceClient.cloneRule.mockResolvedValue({} as any);

    await service.cloneRule('1', user, { txtp: 'pain.001.001.11' } as any, 'POST /rules/api/clone/:ruleId');

    expect(checkTier2Spy).toHaveBeenCalledWith(
      expect.objectContaining({ endpointKey: 'POST /rules/api/clone/:ruleId' }),
    );
  });

  it('covers PUT /rules/api/:ruleId/status via updateRuleStatus (+Tier3)', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const checkTier2Spy = jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
    const checkTier3Spy = jest.spyOn(rbacService, 'checkTier3').mockReturnValue({ allowed: true });
    adminServiceClient.getRulesById.mockResolvedValue({ status: 'STATUS_01_IN_PROGRESS' } as any);
    adminServiceClient.updateRuleStatus.mockResolvedValue({} as any);

    await service.updateRuleStatus('1', 'STATUS_02_ON_HOLD', 'reason', user, 'PUT /rules/api/:ruleId/status');

    expect(checkTier2Spy).toHaveBeenCalledWith(
      expect.objectContaining({ endpointKey: 'PUT /rules/api/:ruleId/status' }),
    );
    expect(checkTier3Spy).toHaveBeenCalled();
  });

  it('denies invalid role on RBAC-protected endpoint', async () => {
    const user = makeUser('guest');

    await expect(service.getRuleIds(user)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

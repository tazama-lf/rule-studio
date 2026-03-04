jest.mock('../../src/services/rules/dto/rules.dto', () => ({
  Rules: class Rules {},
  ResponseRuleFlowDto: class ResponseRuleFlowDto {},
  GlobalVariableDto: class GlobalVariableDto {},
  RuleIdResponseDto: class RuleIdResponseDto {},
  RuleFiltersDto: class RuleFiltersDto {},
  UpdateRuleDto: class UpdateRuleDto {},
  UpdateRuleStatusDto: class UpdateRuleStatusDto {},
  RequestSaveFlow: class RequestSaveFlow {},
  CreateRuleDto: class CreateRuleDto {},
  RequestFlow: class RequestFlow {},
  RuleFlowFilterDto: class RuleFlowFilterDto {},
  ResponseRuleFlow: class ResponseRuleFlow {},
  ResponseUpdatedRuleFlowDto: class ResponseUpdatedRuleFlowDto {},
  ResponseRuleFlowStatusDto: class ResponseRuleFlowStatusDto {},
}));

import { RulesController } from '../../src/services/rules/rules.controller';
import { RulesService } from '../../src/services/rules/rules.service';
import type { AuthenticatedUser } from '../../src/services/auth/auth.types';

describe('RulesController wiring', () => {
  const mockRulesService = {
    createRule: jest.fn(),
    getRuleConfiguration: jest.fn(),
    updateRule: jest.fn(),
    getRuleFlow: jest.fn(),
    getRuleFlowStatus: jest.fn(),
    updateRuleFlow: jest.fn(),
    getGlobalVariables: jest.fn(),
    cloneRule: jest.fn(),
    updateRuleStatus: jest.fn(),
  } as unknown as jest.Mocked<RulesService>;

  const controller = new RulesController(mockRulesService);

  const user = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    actorRole: 'editor',
    token: { tokenString: 'test-token', tenantId: 'tenant-1' },
  } as unknown as AuthenticatedUser;

  beforeEach(() => jest.clearAllMocks());

  it('createRule passes user-enriched payload and dynamic endpointKey', async () => {
    (mockRulesService.createRule as jest.Mock).mockResolvedValue({ id: '1' });

    await controller.createRule(
      { txtp: 'pain.001.001.11' } as any,
      user,
      { method: 'POST', originalUrl: '/rules/api/create' },
    );

    expect(mockRulesService.createRule).toHaveBeenCalledWith(
      expect.objectContaining({ txtp: 'pain.001.001.11', userID: 'user-1' }),
      user,
    );
  });

  it('getRuleConfiguration passes endpointKey', async () => {
    (mockRulesService.getRuleConfiguration as jest.Mock).mockResolvedValue({});

    await controller.getRuleConfiguration('1', user, {} as any);

    expect(mockRulesService.getRuleConfiguration).toHaveBeenCalledWith(
      '1',
      user,
      'GET /rules/api/configuration/:ruleId',
    );
  });

  it('updateRule passes endpointKey', async () => {
    (mockRulesService.updateRule as jest.Mock).mockResolvedValue({});

    await controller.updateRule('1', { status: 'STATUS_02_ON_HOLD' } as any, user);

    expect(mockRulesService.updateRule).toHaveBeenCalledWith(
      '1',
      { status: 'STATUS_02_ON_HOLD' },
      user,
      'PUT /rules/api/:ruleId',
    );
  });

  it('getRuleFlow passes endpointKey and query', async () => {
    (mockRulesService.getRuleFlow as jest.Mock).mockResolvedValue({});

    await controller.getRuleFlow('1', { category: 'RULE_BUILDER' } as any, user);

    expect(mockRulesService.getRuleFlow).toHaveBeenCalledWith(
      '1',
      user,
      'GET /rules/api/:ruleId/flow',
      { category: 'RULE_BUILDER' },
    );
  });

  it('getRuleFlowStatus passes endpointKey and query', async () => {
    (mockRulesService.getRuleFlowStatus as jest.Mock).mockResolvedValue({});

    await controller.getRuleFlowStatus('1', { category: 'RULE_BUILDER' } as any, user);

    expect(mockRulesService.getRuleFlowStatus).toHaveBeenCalledWith(
      '1',
      user,
      'GET /rules/api/:ruleId/flow/status',
      { category: 'RULE_BUILDER' },
    );
  });

  it('updateRuleFlow passes endpointKey', async () => {
    (mockRulesService.updateRuleFlow as jest.Mock).mockResolvedValue({});

    await controller.updateRuleFlow('1', { category: 'RULE_BUILDER' } as any, user);

    expect(mockRulesService.updateRuleFlow).toHaveBeenCalledWith(
      '1',
      { category: 'RULE_BUILDER' },
      user,
      'PUT /rules/api/:ruleId/flow',
    );
  });

  it('getGlobalVariables passes endpointKey', async () => {
    (mockRulesService.getGlobalVariables as jest.Mock).mockResolvedValue({});

    await controller.getGlobalVariables('1', user);

    expect(mockRulesService.getGlobalVariables).toHaveBeenCalledWith(
      '1',
      user,
      'GET /rules/api/global-variables/:ruleId',
    );
  });

  it('cloneRule passes endpointKey', async () => {
    (mockRulesService.cloneRule as jest.Mock).mockResolvedValue({});

    await controller.cloneRule('1', { txtp: 'pain.001.001.11' } as any, user);

    expect(mockRulesService.cloneRule).toHaveBeenCalledWith(
      '1',
      user,
      { txtp: 'pain.001.001.11' },
    );
  });

  it('updateRuleStatus passes endpointKey and default reason fallback', async () => {
    (mockRulesService.updateRuleStatus as jest.Mock).mockResolvedValue({});

    await controller.updateRuleStatus('1', { status: 'STATUS_02_ON_HOLD' } as any, user);

    expect(mockRulesService.updateRuleStatus).toHaveBeenCalledWith(
      '1',
      'STATUS_02_ON_HOLD',
      '',
      user,
      'PUT /rules/api/:ruleId/status',
    );
  });

  it('updateRuleMetadata passes metadata endpointKey', async () => {
    (mockRulesService.updateRule as jest.Mock).mockResolvedValue({});

    await controller.updateRuleMetadata('1', { name: 'Updated' } as any, user);

    expect(mockRulesService.updateRule).toHaveBeenCalledWith(
      '1',
      { name: 'Updated' },
      user,
      'PUT /rules/api/:ruleId/metadata',
    );
  });
});

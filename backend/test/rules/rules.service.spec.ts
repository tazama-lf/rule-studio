import { Test, TestingModule } from '@nestjs/testing';
import { RulesService } from '../../src/services/rules/rules.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import { Logger } from '@nestjs/common';

describe('RulesService', () => {
  let service: RulesService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

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
            createRuleFlow: jest.fn(),
            updateRuleFlow: jest.fn(),
            getGlobalVariables: jest.fn(),
            cloneRule: jest.fn(),
            updateRuleStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RulesService>(RulesService);
    adminServiceClient = module.get(AdminServiceClient);

    jest.spyOn(Logger.prototype, 'log').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'error').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRules', () => {
    it('should return rules from admin service', async () => {
      const mockRules = [{ id: 1, name: 'Rule 1' }, { id: 2, name: 'Rule 2' }] as any;
      const mockFilters = { status: 'active' };
      
      adminServiceClient.getAllRulesWithFilters.mockResolvedValue(mockRules);

      const result = await service.getAllRules(0, 10, mockFilters, 'test-token');

      expect(adminServiceClient.getAllRulesWithFilters).toHaveBeenCalledWith(0, 10, mockFilters, 'test-token');
      expect(result).toEqual(mockRules);
    });
  });

  describe('getRulesById', () => {
    it('should return a rule by ID', async () => {
      const mockRule = { id: 1, name: 'Test Rule', status: 'active' } as any;
      
      adminServiceClient.getRulesById.mockResolvedValue(mockRule);

      const result = await service.getRulesById(1, 'tenant-123', 'test-token');

      expect(adminServiceClient.getRulesById).toHaveBeenCalledWith(1, 'test-token');
      expect(result).toEqual(mockRule);
    });

    it('should throw error when rule not found', async () => {
      const mockError = new Error('Rule not found');
      
      adminServiceClient.getRulesById.mockRejectedValue(mockError);

      await expect(service.getRulesById(999, 'tenant-123', 'test-token')).rejects.toThrow('Rule not found');
      expect(Logger.prototype.error).toHaveBeenCalledWith('Error finding rules by ID 999: Rule not found');
    });
  });

  describe('createRule', () => {
    it('should create a new rule', async () => {
      const mockRuleData = { name: 'New Rule', description: 'Test rule' };
      const mockCreatedRule = { id: 1, ...mockRuleData } as any;
      const mockBaseFlow = { flow: [{ id: 'base-flow-1' }] };
      const mockNewRuleFlow = { flow: [{ id: 'new-flow-1' }] };
      const mockUpdatedRule = { id: 1, ...mockRuleData, flow_id: 'new-flow-1' } as any;
      
      adminServiceClient.createRule.mockResolvedValue(mockCreatedRule);
      adminServiceClient.getRuleFlow.mockResolvedValue(mockBaseFlow);
      adminServiceClient.createRuleFlow.mockResolvedValue(mockNewRuleFlow);
      adminServiceClient.updateRule.mockResolvedValue(mockUpdatedRule);

      const result = await service.createRule(mockRuleData, 'test-token');

      expect(adminServiceClient.createRule).toHaveBeenCalledWith(mockRuleData, 'test-token');
      expect(adminServiceClient.getRuleFlow).toHaveBeenCalledWith('21', 'test-token');
      expect(adminServiceClient.createRuleFlow).toHaveBeenCalledWith(1, [{ id: 'base-flow-1' }], 'test-token');
      expect(adminServiceClient.updateRule).toHaveBeenCalledWith(1, { flow_id: 'new-flow-1' }, 'test-token');
      expect(result).toEqual(mockUpdatedRule);
    });

    it('should handle creation error', async () => {
      const mockError = new Error('Creation failed');
      
      adminServiceClient.createRule.mockRejectedValue(mockError);

      await expect(service.createRule({}, 'test-token')).rejects.toThrow('Creation failed');
      expect(Logger.prototype.error).toHaveBeenCalledWith('Error creating rule: Creation failed');
    });

    it('should create rule without flow when base flow has no flow property', async () => {
      const mockRuleData = { name: 'New Rule', description: 'Test rule' };
      const mockCreatedRule = { id: 1, ...mockRuleData } as any;
      const mockBaseFlow = {}; // No flow property
      
      adminServiceClient.createRule.mockResolvedValue(mockCreatedRule);
      adminServiceClient.getRuleFlow.mockResolvedValue(mockBaseFlow);

      const result = await service.createRule(mockRuleData, 'test-token');

      expect(adminServiceClient.createRule).toHaveBeenCalledWith(mockRuleData, 'test-token');
      expect(result).toEqual(mockCreatedRule);
    });
  });

  describe('getRuleIds', () => {
    it('should return rule IDs', async () => {
      const mockRuleIds = [1, 2, 3, 4, 5];
      
      adminServiceClient.getRuleIds.mockResolvedValue(mockRuleIds);

      const result = await service.getRuleIds('test-token');

      expect(adminServiceClient.getRuleIds).toHaveBeenCalledWith('test-token');
      expect(result).toEqual(mockRuleIds);
    });

    it('should handle fetch error', async () => {
      const mockError = new Error('Fetch failed');
      
      adminServiceClient.getRuleIds.mockRejectedValue(mockError);

      await expect(service.getRuleIds('test-token')).rejects.toThrow('Fetch failed');
      expect(Logger.prototype.error).toHaveBeenCalledWith('Error fetching rule IDs: Fetch failed');
    });
  });

  describe('getRuleConfiguration', () => {
    it('should return rule configuration', async () => {
      const mockConfiguration = { settings: { threshold: 100 }, enabled: true };
      
      adminServiceClient.getRuleConfiguration.mockResolvedValue(mockConfiguration);

      const result = await service.getRuleConfiguration('rule-123', 'test-token');

      expect(adminServiceClient.getRuleConfiguration).toHaveBeenCalledWith('rule-123', 'test-token');
      expect(result).toEqual(mockConfiguration);
    });

    it('should handle configuration fetch error', async () => {
      const mockError = new Error('Configuration not found');
      
      adminServiceClient.getRuleConfiguration.mockRejectedValue(mockError);

      await expect(service.getRuleConfiguration('rule-123', 'test-token')).rejects.toThrow('Configuration not found');
      expect(Logger.prototype.error).toHaveBeenCalledWith('Error fetching configuration for rule rule-123: Configuration not found');
    });
  });

  describe('updateRule', () => {
    it('should update a rule', async () => {
      const mockUpdateData = { name: 'Updated Rule', status: 'inactive' };
      const mockUpdatedRule = { id: 1, ...mockUpdateData } as any;
      
      adminServiceClient.updateRule.mockResolvedValue(mockUpdatedRule);

      const result = await service.updateRule('rule-123', mockUpdateData, 'test-token');

      expect(adminServiceClient.updateRule).toHaveBeenCalledWith('rule-123', mockUpdateData, 'test-token');
      expect(result).toEqual(mockUpdatedRule);
    });

    it('should handle update error', async () => {
      const mockError = new Error('Update failed');
      
      adminServiceClient.updateRule.mockRejectedValue(mockError);

      await expect(service.updateRule('rule-123', {}, 'test-token')).rejects.toThrow('Update failed');
      expect(Logger.prototype.error).toHaveBeenCalledWith('Error updating rule rule-123: Update failed');
    });
  });

  describe('getActiveNetworkMap', () => {
    it('should return active network map', async () => {
      const mockNetworkMap = { nodes: ['node1', 'node2'], connections: [] };
      
      adminServiceClient.getActiveNetworkMap.mockResolvedValue(mockNetworkMap);

      const result = await service.getActiveNetworkMap('test-token');

      expect(adminServiceClient.getActiveNetworkMap).toHaveBeenCalledWith('test-token');
      expect(result).toEqual(mockNetworkMap);
    });

    it('should handle network map fetch error', async () => {
      const mockError = new Error('Network map not found');
      
      adminServiceClient.getActiveNetworkMap.mockRejectedValue(mockError);

      await expect(service.getActiveNetworkMap('test-token')).rejects.toThrow('Network map not found');
      expect(Logger.prototype.error).toHaveBeenCalledWith('Error fetching active network map: Network map not found');
    });
  });

  describe('getRuleFlow', () => {
    it('should return rule flow', async () => {
      const mockRuleFlow = { flowId: 'flow-123', steps: [], connections: [] };
      
      adminServiceClient.getRuleFlow.mockResolvedValue(mockRuleFlow);

      const result = await service.getRuleFlow('rule-123', 'test-token');

      expect(adminServiceClient.getRuleFlow).toHaveBeenCalledWith('rule-123', 'test-token');
      expect(result).toEqual(mockRuleFlow);
    });

    it('should handle rule flow fetch error', async () => {
      const mockError = new Error('Flow not found');
      
      adminServiceClient.getRuleFlow.mockRejectedValue(mockError);

      await expect(service.getRuleFlow('rule-123', 'test-token')).rejects.toThrow('Flow not found');
      expect(Logger.prototype.error).toHaveBeenCalledWith('Error fetching configuration for rule rule-123: Flow not found');
    });
  });

  describe('createRuleFlow', () => {
    it('should create rule flow', async () => {
      const mockFlowData = { steps: ['step1', 'step2'], connections: [] };
      const mockRequestBody = { flowData: mockFlowData };
      const mockCreatedFlow = { flowId: 'flow-123', ...mockFlowData };
      
      adminServiceClient.createRuleFlow.mockResolvedValue(mockCreatedFlow);

      const result = await service.createRuleFlow('rule-123', mockRequestBody, 'test-token');

      expect(adminServiceClient.createRuleFlow).toHaveBeenCalledWith('rule-123', mockFlowData, 'test-token');
      expect(result).toEqual(mockCreatedFlow);
    });

    it('should handle flow creation error', async () => {
      const mockError = new Error('Flow creation failed');
      
      adminServiceClient.createRuleFlow.mockRejectedValue(mockError);

      await expect(service.createRuleFlow('rule-123', { flowData: {} }, 'test-token')).rejects.toThrow('Flow creation failed');
      expect(Logger.prototype.error).toHaveBeenCalledWith('Error creating flow for rule rule-123: Flow creation failed');
    });
  });

  describe('updateRuleFlow', () => {
    it('should update rule flow', async () => {
      const mockPayload = { flowId: 'flow-123', steps: ['updated-step'], connections: [] };
      const mockUpdatedFlow = { ...mockPayload };
      
      adminServiceClient.updateRuleFlow.mockResolvedValue(mockUpdatedFlow);

      const result = await service.updateRuleFlow('rule-123', mockPayload, 'test-token');

      expect(adminServiceClient.updateRuleFlow).toHaveBeenCalledWith('rule-123', mockPayload, 'test-token');
      expect(result).toEqual(mockUpdatedFlow);
    });

    it('should handle flow update error', async () => {
      const mockError = new Error('Flow update failed');
      
      adminServiceClient.updateRuleFlow.mockRejectedValue(mockError);

      await expect(service.updateRuleFlow('rule-123', {}, 'test-token')).rejects.toThrow('Flow update failed');
      expect(Logger.prototype.error).toHaveBeenCalledWith('Error updating flow for rule rule-123: Flow update failed');
    });
  });

  describe('getRulesStatusbyRole', () => {
    it('should return allowed statuses from user', async () => {
      const mockUser = { allowedStatuses: ['active', 'pending', 'draft'] };

      const result = await service.getRulesStatusbyRole(mockUser);

      expect(result).toEqual(['active', 'pending', 'draft']);
    });

    it('should return empty array when user has no allowed statuses', async () => {
      const mockUser = {};

      const result = await service.getRulesStatusbyRole(mockUser);

      expect(result).toEqual([]);
    });

    it('should return empty array when allowedStatuses is null', async () => {
      const mockUser = { allowedStatuses: null };

      const result = await service.getRulesStatusbyRole(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('getGlobalVariables', () => {
    it('should return global variables', async () => {
      const mockVariables = { variables: { maxAmount: 1000, currency: 'USD' } };
      
      adminServiceClient.getGlobalVariables.mockResolvedValue(mockVariables);

      const result = await service.getGlobalVariables('rule-123', 'tenant-123', 'test-token');

      expect(adminServiceClient.getGlobalVariables).toHaveBeenCalledWith('rule-123', 'tenant-123', 'test-token');
      expect(result).toEqual(mockVariables);
    });

    it('should handle global variables fetch error', async () => {
      const mockError = new Error('Variables not found');
      
      adminServiceClient.getGlobalVariables.mockRejectedValue(mockError);

      await expect(service.getGlobalVariables('rule-123', 'tenant-123', 'test-token')).rejects.toThrow('Variables not found');
      expect(Logger.prototype.error).toHaveBeenCalledWith('Error fetching global variables for rule rule-123: Variables not found');
    });
  });

  describe('cloneRule', () => {
    it('should clone a rule', async () => {
      const mockClonedRule = { id: 2, name: 'Cloned Rule', originalId: 1 } as any;
      
      adminServiceClient.cloneRule.mockResolvedValue(mockClonedRule);

      const result = await service.cloneRule('rule-123', 'test-token');

      expect(adminServiceClient.cloneRule).toHaveBeenCalledWith('rule-123', 'test-token');
      expect(result).toEqual(mockClonedRule);
    });

    it('should handle clone error', async () => {
      const mockError = new Error('Clone failed');
      
      adminServiceClient.cloneRule.mockRejectedValue(mockError);

      await expect(service.cloneRule('rule-123', 'test-token')).rejects.toThrow('Clone failed');
      expect(Logger.prototype.error).toHaveBeenCalledWith('Error cloning rule rule-123: Clone failed');
    });
  });

  describe('updateRuleStatus', () => {
    it('should update rule status', async () => {
      const mockUpdatedRule = { id: 1, status: 'active', statusReason: 'Approved' } as any;
      
      adminServiceClient.updateRuleStatus.mockResolvedValue(mockUpdatedRule);

      const result = await service.updateRuleStatus('rule-123', 'active', 'Approved', 'test-token');

      expect(adminServiceClient.updateRuleStatus).toHaveBeenCalledWith('rule-123', 'active', 'Approved', 'test-token');
      expect(result).toEqual(mockUpdatedRule);
    });

    it('should handle status update error', async () => {
      const mockError = new Error('Status update failed');
      
      adminServiceClient.updateRuleStatus.mockRejectedValue(mockError);

      await expect(service.updateRuleStatus('rule-123', 'active', 'Approved', 'test-token')).rejects.toThrow('Status update failed');
      expect(Logger.prototype.error).toHaveBeenCalledWith('Error updating status for rule rule-123: Status update failed');
    });
  });
});


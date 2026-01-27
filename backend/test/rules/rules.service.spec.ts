import { Test, TestingModule } from '@nestjs/testing';
import { RulesService } from '../../src/services/rules/rules.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import * as jwt from 'jsonwebtoken';
import { Logger } from '@nestjs/common';

jest.mock('jsonwebtoken');

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
            getRuleFlow: jest.fn(),
            createRuleFlow: jest.fn(),
            updateRuleFlow: jest.fn(),
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
      const rules = [{ id: 1 }, { id: 2 }] as any;

      adminServiceClient.getAllRulesWithFilters.mockResolvedValue(rules);

      const result = await service.getAllRules(0, 10, {}, 'token');

      expect(result).toEqual(rules);
      expect(adminServiceClient.getAllRulesWithFilters).toHaveBeenCalledWith(
        0,
        10,
        {},
        'token',
      );
    });
  });

  describe('getRulesById', () => {
    it('should return rule by id', async () => {
      const rule = { id: 1 } as any;

      adminServiceClient.getRulesById.mockResolvedValue(rule);

      const result = await service.getRulesById(1, 'tenant', 'token');

      expect(result).toEqual(rule);
      expect(adminServiceClient.getRulesById).toHaveBeenCalledWith(1, 'token');
    });

    it('should rethrow error when admin service fails', async () => {
      const error = new Error('Fetch failed');

      adminServiceClient.getRulesById.mockRejectedValue(error);

      await expect(service.getRulesById(1, 'tenant', 'token')).rejects.toThrow(
        error,
      );
    });
  });

  describe('getRuleFlow', () => {
    it('should return rule flow', async () => {
      const flow = { nodes: [] } as any;

      adminServiceClient.getRuleFlow.mockResolvedValue(flow);

      const result = await service.getRuleFlow('rule1', 'token');

      expect(result).toEqual(flow);
      expect(adminServiceClient.getRuleFlow).toHaveBeenCalledWith(
        'rule1',
        'token',
      );
    });

    it('should rethrow error on failure', async () => {
      const error = new Error('Flow error');

      adminServiceClient.getRuleFlow.mockRejectedValue(error);

      await expect(service.getRuleFlow('rule1', 'token')).rejects.toThrow(
        error,
      );
    });
  });

  describe('createRuleFlow', () => {
    it('should create rule flow', async () => {
      const flow = { id: 'flow1' } as any;

      adminServiceClient.createRuleFlow.mockResolvedValue(flow);

      const result = await service.createRuleFlow(
        'rule1',
        { nodes: [] } as any,
        'token',
      );

      expect(result).toEqual(flow);
      expect(adminServiceClient.createRuleFlow).toHaveBeenCalledWith(
        'rule1',
        { nodes: [] },
        'token',
      );
    });

    it('should rethrow error on failure', async () => {
      const error = new Error('Create flow error');

      adminServiceClient.createRuleFlow.mockRejectedValue(error);

      await expect(
        service.createRuleFlow('rule1', {} as any, 'token'),
      ).rejects.toThrow(error);
    });
  });

  describe('updateRuleFlow', () => {
    it('should update rule flow', async () => {
      const flow = { id: 'flow1-updated' } as any;

      adminServiceClient.updateRuleFlow.mockResolvedValue(flow);

      const result = await service.updateRuleFlow(
        'rule1',
        { nodes: [] } as any,
        'token',
      );

      expect(result).toEqual(flow);
      expect(adminServiceClient.updateRuleFlow).toHaveBeenCalledWith(
        'rule1',
        { nodes: [] },
        'token',
      );
    });

    it('should rethrow error on failure', async () => {
      const error = new Error('Update error');

      adminServiceClient.updateRuleFlow.mockRejectedValue(error);

      await expect(
        service.updateRuleFlow('rule1', {} as any, 'token'),
      ).rejects.toThrow(error);
    });
  });

  describe('getRulesStatusbyRole', () => {
    it('should extract statuses from nested JWT token', async () => {
      (jwt.decode as jest.Mock)
        .mockReturnValueOnce({ tokenString: 'inner-token' })
        .mockReturnValueOnce({ status: 'DRAFT, ACTIVE , PUBLISHED' });

      const result = await service.getRulesStatusbyRole('outer-token');

      expect(result).toEqual(['DRAFT', 'ACTIVE', 'PUBLISHED']);
    });

    it('should return empty array if outer token decode fails', async () => {
      (jwt.decode as jest.Mock).mockReturnValueOnce(null);

      const result = await service.getRulesStatusbyRole('bad-token');

      expect(result).toEqual([]);
    });

    it('should return empty array if inner token decode fails', async () => {
      (jwt.decode as jest.Mock)
        .mockReturnValueOnce({ tokenString: 'inner-token' })
        .mockReturnValueOnce(null);

      const result = await service.getRulesStatusbyRole('outer-token');

      expect(result).toEqual([]);
    });

    it('should return empty array if status field is missing', async () => {
      (jwt.decode as jest.Mock)
        .mockReturnValueOnce({ tokenString: 'inner-token' })
        .mockReturnValueOnce({});

      const result = await service.getRulesStatusbyRole('outer-token');

      expect(result).toEqual([]);
    });

    it('should handle decode exception safely', async () => {
      (jwt.decode as jest.Mock).mockImplementation(() => {
        throw new Error('decode failed');
      });

      const result = await service.getRulesStatusbyRole('token');

      expect(result).toEqual([]);
    });
  });
});

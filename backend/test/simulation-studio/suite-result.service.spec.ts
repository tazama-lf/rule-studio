import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SuiteResultService } from '../../src/services/simulation-studio/suite-result/suite-result.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import type {
  SaveRunResultResponseDto,
  SuiteResultResponseDto,
} from '../../src/services/simulation-studio/suite-result/dto/suite-result.dto';

describe('SuiteResultService', () => {
  let service: SuiteResultService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

  const mockTriggerEntry = {
    id: 10,
    trigger_id: 1,
    rule_result: { score: 0.5 },
    independent_variable: '500',
    sub_rule_ref: '.02',
  };

  const mockRunResult = {
    run_id: 1,
    generation_id: 13,
    rule_name: 'rule01',
    rule_version: 'v1.0.1',
    trigger_count: 12,
    outcome: 'success',
    triggers: [mockTriggerEntry],
  };

  const mockGetResponse: SuiteResultResponseDto = {
    success: true,
    message: 'Suite result retrieved successfully',
    data: {
      suite_id: 1,
      results: [mockRunResult],
    },
  };

  const mockSaveResponse: SaveRunResultResponseDto = {
    success: true,
    message: 'Run result saved successfully',
    data: { run_id: 10, result_id: 100 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuiteResultService,
        {
          provide: AdminServiceClient,
          useValue: {
            getSuiteResult: jest.fn(),
            saveRunResult: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SuiteResultService>(SuiteResultService);
    adminServiceClient = module.get(AdminServiceClient);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  describe('getSuiteResult', () => {
    it('forwards token and suiteId to admin-service and returns response', async () => {
      adminServiceClient.getSuiteResult.mockResolvedValue(mockGetResponse);

      const result = await service.getSuiteResult('test-token', 1);

      expect(result).toEqual(mockGetResponse);
      expect(adminServiceClient.getSuiteResult).toHaveBeenCalledWith('test-token', 1);
    });

    it('returns success flag and message', async () => {
      adminServiceClient.getSuiteResult.mockResolvedValue(mockGetResponse);

      const result = await service.getSuiteResult('test-token', 1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Suite result retrieved successfully');
    });

    it('returns correct suite_id', async () => {
      adminServiceClient.getSuiteResult.mockResolvedValue(mockGetResponse);

      const result = await service.getSuiteResult('test-token', 1);

      expect(result.data.suite_id).toBe(1);
    });

    it('returns results with correct run fields', async () => {
      adminServiceClient.getSuiteResult.mockResolvedValue(mockGetResponse);

      const result = await service.getSuiteResult('test-token', 1);

      const run = result.data.results[0];
      expect(run.run_id).toBe(1);
      expect(run.generation_id).toBe(13);
      expect(run.rule_name).toBe('rule01');
      expect(run.rule_version).toBe('v1.0.1');
      expect(run.trigger_count).toBe(12);
      expect(run.outcome).toBe('success');
    });

    it('returns trigger entries with correct fields', async () => {
      adminServiceClient.getSuiteResult.mockResolvedValue(mockGetResponse);

      const result = await service.getSuiteResult('test-token', 1);

      const trigger = result.data.results[0].triggers[0];
      expect(trigger.id).toBe(10);
      expect(trigger.rule_result).toEqual({ score: 0.5 });
      expect(trigger.independent_variable).toBe('500');
      expect(trigger.sub_rule_ref).toBe('.02');
    });

    it('returns empty results array when suite has no runs', async () => {
      adminServiceClient.getSuiteResult.mockResolvedValue({
        success: true,
        message: 'Suite result retrieved successfully',
        data: { suite_id: 5, results: [] },
      });

      const result = await service.getSuiteResult('test-token', 5);

      expect(result.data.results).toHaveLength(0);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('admin-service unavailable');
      adminServiceClient.getSuiteResult.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.getSuiteResult('test-token', 1)).rejects.toThrow('admin-service unavailable');
      expect(loggerSpy).toHaveBeenCalledWith('Error fetching suite result for suiteId: 1', expect.any(String));
    });
  });

  describe('saveRunResult', () => {
    const mockBody = {
      gen_id: 13,
      trigger_id: 5,
      rule_result: { id: 'rule01@1.0.0', cfg: 'none', wght: 0, prcgTm: 843982, tenantId: 'cbe', subRuleRef: '.02', indpdntVarbl: 500 },
    };

    it('forwards token and body to admin-service and returns response', async () => {
      adminServiceClient.saveRunResult.mockResolvedValue(mockSaveResponse);

      const result = await service.saveRunResult('test-token', mockBody);

      expect(result).toEqual(mockSaveResponse);
      expect(adminServiceClient.saveRunResult).toHaveBeenCalledWith('test-token', mockBody);
    });

    it('returns run_id and result_id', async () => {
      adminServiceClient.saveRunResult.mockResolvedValue(mockSaveResponse);

      const result = await service.saveRunResult('test-token', mockBody);

      expect(result.data.run_id).toBe(10);
      expect(result.data.result_id).toBe(100);
    });

    it('works with null trigger_id', async () => {
      adminServiceClient.saveRunResult.mockResolvedValue(mockSaveResponse);

      await service.saveRunResult('test-token', { ...mockBody, trigger_id: null });

      expect(adminServiceClient.saveRunResult).toHaveBeenCalledWith('test-token', expect.objectContaining({ trigger_id: null }));
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('admin-service unavailable');
      adminServiceClient.saveRunResult.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.saveRunResult('test-token', mockBody)).rejects.toThrow('admin-service unavailable');
      expect(loggerSpy).toHaveBeenCalledWith('Error saving run result for gen_id: 13', expect.any(String));
    });
  });
});

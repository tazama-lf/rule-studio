import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SuiteResultService } from '../../src/services/simulation-studio/suite-result/suite-result.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import type { SuiteResultResponseDto } from '../../src/services/simulation-studio/suite-result/dto/suite-result.dto';

describe('SuiteResultService', () => {
  let service: SuiteResultService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

  const mockTriggerConfig = {
    id: 1,
    generation_id: 10,
    txtp: 'pacs.002.001.12',
    txtp_version: '001.12',
    display_order: 1,
    message_count: 100,
    link_to_context_pairs: false,
    payload_template_json: { TxTp: 'pacs.002' },
    expected_independent_variable: 500,
    expected_result_band: 'good',
    notes: null,
    faker_seed: null,
    generator_profile: {},
    related_txtp_config_id: null,
    related_transaction: null,
  };

  const mockRunResult = {
    id: 1,
    outcome: 'PASS',
    rule_version: 'v10',
    rule_name: 'rule021',
    triggers: [
      {
        id: 10,
        outcome: 'PASS',
        independent_variable: '500',
        result_band: 'good',
        rule_result: { score: 0.5 },
        trigger: mockTriggerConfig,
      },
    ],
  };

  const mockResponse: SuiteResultResponseDto = {
    success: true,
    message: 'Suite result retrieved successfully',
    data: {
      suite_id: 3,
      total_runs: 1,
      results: [mockRunResult],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuiteResultService,
        {
          provide: AdminServiceClient,
          useValue: {
            getSuiteResult: jest.fn(),
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
      adminServiceClient.getSuiteResult.mockResolvedValue(mockResponse);

      const result = await service.getSuiteResult('test-token', 3);

      expect(result).toEqual(mockResponse);
      expect(adminServiceClient.getSuiteResult).toHaveBeenCalledWith('test-token', 3);
    });

    it('returns success flag and message', async () => {
      adminServiceClient.getSuiteResult.mockResolvedValue(mockResponse);

      const result = await service.getSuiteResult('test-token', 3);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Suite result retrieved successfully');
    });

    it('returns correct suite_id and total_runs', async () => {
      adminServiceClient.getSuiteResult.mockResolvedValue(mockResponse);

      const result = await service.getSuiteResult('test-token', 3);

      expect(result.data.suite_id).toBe(3);
      expect(result.data.total_runs).toBe(1);
    });

    it('returns results with trigger config embedded', async () => {
      adminServiceClient.getSuiteResult.mockResolvedValue(mockResponse);

      const result = await service.getSuiteResult('test-token', 3);

      const firstResult = result.data.results[0];
      expect(firstResult.rule_name).toBe('rule021');
      expect(firstResult.rule_version).toBe('v10');
      expect(firstResult.triggers[0].trigger).toEqual(mockTriggerConfig);
    });

    it('returns null trigger when trigger config not linked', async () => {
      const responseNoTrigger: SuiteResultResponseDto = {
        ...mockResponse,
        data: {
          ...mockResponse.data,
          results: [
            {
              ...mockRunResult,
              triggers: [{ ...mockRunResult.triggers[0], trigger: null }],
            },
          ],
        },
      };
      adminServiceClient.getSuiteResult.mockResolvedValue(responseNoTrigger);

      const result = await service.getSuiteResult('test-token', 3);

      expect(result.data.results[0].triggers[0].trigger).toBeNull();
    });

    it('returns empty results array when suite has no runs', async () => {
      adminServiceClient.getSuiteResult.mockResolvedValue({
        success: true,
        message: 'Suite result retrieved successfully',
        data: { suite_id: 5, total_runs: 0, results: [] },
      });

      const result = await service.getSuiteResult('test-token', 5);

      expect(result.data.results).toHaveLength(0);
      expect(result.data.total_runs).toBe(0);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('admin-service unavailable');
      adminServiceClient.getSuiteResult.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.getSuiteResult('test-token', 3)).rejects.toThrow('admin-service unavailable');
      expect(loggerSpy).toHaveBeenCalledWith('Error fetching suite result for suiteId: 3', expect.any(String));
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SuiteResultController } from '../../src/services/simulation-studio/suite-result/suite-result.controller';
import { SuiteResultService } from '../../src/services/simulation-studio/suite-result/suite-result.service';
import { makeAuthenticatedUser } from '../helpers/rbac/user.factory';
import type { SuiteResultResponseDto } from '../../src/services/simulation-studio/suite-result/dto/suite-result.dto';

describe('SuiteResultController', () => {
  let controller: SuiteResultController;
  let service: jest.Mocked<SuiteResultService>;

  const makeUser = makeAuthenticatedUser;

  const mockResponse: SuiteResultResponseDto = {
    success: true,
    message: 'Suite result retrieved successfully',
    data: {
      suite_id: 3,
      total_runs: 2,
      results: [
        {
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
              trigger: {
                id: 1,
                generation_id: 10,
                txtp: 'pacs.002.001.12',
                txtp_version: '001.12',
                display_order: 1,
                message_count: 100,
                link_to_context_pairs: false,
                payload_template_json: {},
                expected_independent_variable: 500,
                expected_result_band: 'good',
                notes: null,
                faker_seed: null,
                generator_profile: {},
                related_txtp_config_id: null,
                related_transaction: null,
              },
            },
          ],
        },
      ],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuiteResultController],
      providers: [
        {
          provide: 'AUDIT_LOGGER',
          useValue: { logEvent: jest.fn() },
        },
        {
          provide: SuiteResultService,
          useValue: {
            getSuiteResult: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SuiteResultController>(SuiteResultController);
    service = module.get(SuiteResultService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  describe('getSuiteResult', () => {
    it('delegates to service with token and suiteId', async () => {
      const user = makeUser();
      service.getSuiteResult.mockResolvedValue(mockResponse);

      const result = await controller.getSuiteResult(3, user);

      expect(result).toEqual(mockResponse);
      expect(service.getSuiteResult).toHaveBeenCalledWith('test-token', 3);
    });

    it('passes numeric suiteId (ParseIntPipe result) to service', async () => {
      const user = makeUser();
      service.getSuiteResult.mockResolvedValue(mockResponse);

      await controller.getSuiteResult(99, user);

      expect(service.getSuiteResult).toHaveBeenCalledWith('test-token', 99);
    });

    it('returns response with correct shape', async () => {
      const user = makeUser();
      service.getSuiteResult.mockResolvedValue(mockResponse);

      const result = await controller.getSuiteResult(3, user);

      expect(result.success).toBe(true);
      expect(result.data.suite_id).toBe(3);
      expect(result.data.total_runs).toBe(2);
      expect(result.data.results[0].triggers[0].trigger).not.toBeNull();
    });

    it('propagates service error to caller', async () => {
      const user = makeUser();
      service.getSuiteResult.mockRejectedValue(new Error('not found'));

      await expect(controller.getSuiteResult(3, user)).rejects.toThrow('not found');
    });
  });
});

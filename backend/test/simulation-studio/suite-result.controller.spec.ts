import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SuiteResultController } from '../../src/services/simulation-studio/suite-result/suite-result.controller';
import { SuiteResultService } from '../../src/services/simulation-studio/suite-result/suite-result.service';
import { makeAuthenticatedUser } from '../helpers/rbac/user.factory';
import type {
  SaveRunResultResponseDto,
  SuiteResultResponseDto,
} from '../../src/services/simulation-studio/suite-result/dto/suite-result.dto';

describe('SuiteResultController', () => {
  let controller: SuiteResultController;
  let service: jest.Mocked<SuiteResultService>;

  const makeUser = makeAuthenticatedUser;

  const mockGetResponse: SuiteResultResponseDto = {
    success: true,
    message: 'Suite result retrieved successfully',
    data: {
      suite_id: 1,
      results: [
        {
          run_id: 1,
          generation_id: 13,
          rule_name: 'rule01',
          rule_version: 'v1.0.1',
          trigger_count: 12,
          outcome: 'success',
          triggers: [
            {
              id: 10,
              trigger_id: 1,
              rule_result: { score: 0.5 },
              independent_variable: '500',
              sub_rule_ref: '.02',
            },
          ],
        },
      ],
    },
  };

  const mockSaveResponse: SaveRunResultResponseDto = {
    success: true,
    message: 'Run result saved successfully',
    data: { run_id: 10, result_id: 100 },
  };

  const mockSaveBody = {
    gen_id: 13,
    trigger_id: 5,
    rule_result: { id: 'rule01@1.0.0', cfg: 'none', wght: 0, prcgTm: 843982, tenantId: 'cbe', subRuleRef: '.02', indpdntVarbl: 500 },
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
            saveRunResult: jest.fn(),
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
      service.getSuiteResult.mockResolvedValue(mockGetResponse);

      const result = await controller.getSuiteResult(1, user);

      expect(result).toEqual(mockGetResponse);
      expect(service.getSuiteResult).toHaveBeenCalledWith('test-token', 1);
    });

    it('passes numeric suiteId (ParseIntPipe result) to service', async () => {
      const user = makeUser();
      service.getSuiteResult.mockResolvedValue(mockGetResponse);

      await controller.getSuiteResult(99, user);

      expect(service.getSuiteResult).toHaveBeenCalledWith('test-token', 99);
    });

    it('returns response with correct shape', async () => {
      const user = makeUser();
      service.getSuiteResult.mockResolvedValue(mockGetResponse);

      const result = await controller.getSuiteResult(1, user);

      expect(result.success).toBe(true);
      expect(result.data.suite_id).toBe(1);
      expect(result.data.results[0].run_id).toBe(1);
      expect(result.data.results[0].triggers[0].sub_rule_ref).toBe('.02');
    });

    it('propagates service error to caller', async () => {
      const user = makeUser();
      service.getSuiteResult.mockRejectedValue(new Error('not found'));

      await expect(controller.getSuiteResult(1, user)).rejects.toThrow('not found');
    });
  });

  describe('saveRunResult', () => {
    it('delegates to service with token and body', async () => {
      const user = makeUser();
      service.saveRunResult.mockResolvedValue(mockSaveResponse);

      const result = await controller.saveRunResult(mockSaveBody, user);

      expect(result).toEqual(mockSaveResponse);
      expect(service.saveRunResult).toHaveBeenCalledWith('test-token', mockSaveBody);
    });

    it('returns run_id and result_id', async () => {
      const user = makeUser();
      service.saveRunResult.mockResolvedValue(mockSaveResponse);

      const result = await controller.saveRunResult(mockSaveBody, user);

      expect(result.data.run_id).toBe(10);
      expect(result.data.result_id).toBe(100);
    });

    it('works with null trigger_id', async () => {
      const user = makeUser();
      service.saveRunResult.mockResolvedValue(mockSaveResponse);

      await controller.saveRunResult({ ...mockSaveBody, trigger_id: null }, user);

      expect(service.saveRunResult).toHaveBeenCalledWith('test-token', expect.objectContaining({ trigger_id: null }));
    });

    it('propagates service error to caller', async () => {
      const user = makeUser();
      service.saveRunResult.mockRejectedValue(new Error('gen not found'));

      await expect(controller.saveRunResult(mockSaveBody, user)).rejects.toThrow('gen not found');
    });
  });
});

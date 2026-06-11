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
              rule_result: { score: 0.5 },
              independent_variable: '500',
              sub_rule_ref: '.02',
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

      const result = await controller.getSuiteResult(1, user);

      expect(result).toEqual(mockResponse);
      expect(service.getSuiteResult).toHaveBeenCalledWith('test-token', 1);
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
});

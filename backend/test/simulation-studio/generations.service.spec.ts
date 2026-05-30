import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GenerationsService } from '../../src/services/simulation-studio/generations/generations.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import type {
  SuiteGenerationsListDto,
  SuiteGenerationResponseDto,
  ContextConfigsListDto,
  SuiteGenerationDto,
  SuiteContextTxtpConfigDto,
} from '../../src/services/simulation-studio/generations/dto/generations.dto';

describe('GenerationsService', () => {
  let service: GenerationsService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

  const mockGeneration: SuiteGenerationDto = {
    id: 1,
    suite_id: 42,
    generation_number: 1,
    status: 'DRAFT',
    simulation_type: 'SINGLE_RULE',
    wizard_snapshot: {},
    generation_metadata: {},
    created_by: 'user-1',
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
  };

  const mockGenerationsList: SuiteGenerationsListDto = {
    success: true,
    data: [mockGeneration],
  };

  const mockGenerationResponse: SuiteGenerationResponseDto = {
    success: true,
    data: mockGeneration,
  };

  const mockContextConfig: SuiteContextTxtpConfigDto = {
    id: 1,
    generation_id: 1,
    txtp: 'pacs.008',
    txtp_version: '001.08',
    display_order: 1,
    message_count: 1,
    schema_snapshot: {},
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
  };

  const mockContextConfigsList: ContextConfigsListDto = {
    success: true,
    data: [mockContextConfig],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerationsService,
        {
          provide: AdminServiceClient,
          useValue: {
            getSuiteGenerations: jest.fn(),
            getLatestSuiteGeneration: jest.fn(),
            getGenerationContextConfigs: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GenerationsService>(GenerationsService);
    adminServiceClient = module.get(AdminServiceClient);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGenerationsForSuite', () => {
    it('forwards token and suiteId, returns list', async () => {
      adminServiceClient.getSuiteGenerations.mockResolvedValue(mockGenerationsList);

      const result = await service.getGenerationsForSuite('test-token', 42);

      expect(result).toEqual(mockGenerationsList);
      expect(adminServiceClient.getSuiteGenerations).toHaveBeenCalledWith('test-token', 42);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('Network error');
      adminServiceClient.getSuiteGenerations.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.getGenerationsForSuite('test-token', 42)).rejects.toThrow('Network error');
      expect(loggerSpy).toHaveBeenCalledWith('Error fetching generations for suite 42', expect.any(String));
    });
  });

  describe('getLatestGenerationForSuite', () => {
    it('forwards token and suiteId, returns single generation', async () => {
      adminServiceClient.getLatestSuiteGeneration.mockResolvedValue(mockGenerationResponse);

      const result = await service.getLatestGenerationForSuite('test-token', 42);

      expect(result).toEqual(mockGenerationResponse);
      expect(adminServiceClient.getLatestSuiteGeneration).toHaveBeenCalledWith('test-token', 42);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('Not found');
      adminServiceClient.getLatestSuiteGeneration.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.getLatestGenerationForSuite('test-token', 42)).rejects.toThrow('Not found');
      expect(loggerSpy).toHaveBeenCalledWith('Error fetching latest generation for suite 42', expect.any(String));
    });
  });

  describe('getContextConfigsForGeneration', () => {
    it('forwards token and generationId, returns configs list', async () => {
      adminServiceClient.getGenerationContextConfigs.mockResolvedValue(mockContextConfigsList);

      const result = await service.getContextConfigsForGeneration('test-token', 1);

      expect(result).toEqual(mockContextConfigsList);
      expect(adminServiceClient.getGenerationContextConfigs).toHaveBeenCalledWith('test-token', 1);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('DB error');
      adminServiceClient.getGenerationContextConfigs.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.getContextConfigsForGeneration('test-token', 1)).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalledWith('Error fetching context configs for generation 1', expect.any(String));
    });
  });
});

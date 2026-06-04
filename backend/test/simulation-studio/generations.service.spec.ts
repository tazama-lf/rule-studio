import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GenerationsService } from '../../src/services/simulation-studio/generations/generations.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import type {
  SuiteGenerationsListDto,
  SuiteGenerationResponseDto,
  GenerationSummaryResponseDto,
  SuiteGenerationDto,
} from '../../src/services/simulation-studio/generations/dto/generations.dto';
import { SuiteContextTxtpConfigDto, ContextConfigsListDto } from 'src/services/simulation-studio/context-txtp-config/dto/context-txtp-config.dto';

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
            getGenerationSummary: jest.fn(),
            updateWizardProgress: jest.fn(),
            deleteContextTxtpConfig: jest.fn(),
            deleteTriggerTxtpConfig: jest.fn(),
            resumeGeneration: jest.fn(),
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

  describe('getGenerationSummary', () => {
    const mockSummaryResponse: GenerationSummaryResponseDto = {
      success: true,
      data: {
        generation_id: 7,
        generation_number: 1,
        status: 'DRAFT',
        suite_name: 'Q3 Edge Cases',
        associated_rule: 'Rule 001',
        primary_txtp: 'pacs.008',
        context_txtp_configs: [{ txtp: 'pacs.008', txtp_version: '001.08', message_count: 100 }],
        enrichment_table_names: ['account_enrichment'],
        context_count: 100,
        trigger_count: 10,
        enrichment_table_count: 1,
        iteration_number: 0,
      },
    };

    it('forwards token and generationId, returns summary', async () => {
      adminServiceClient.getGenerationSummary.mockResolvedValue(mockSummaryResponse);

      const result = await service.getGenerationSummary('test-token', 7);

      expect(result).toEqual(mockSummaryResponse);
      expect(adminServiceClient.getGenerationSummary).toHaveBeenCalledWith('test-token', 7);
    });

    it('includes suite name, rule, txtp list and enrichment tables', async () => {
      adminServiceClient.getGenerationSummary.mockResolvedValue(mockSummaryResponse);

      const result = await service.getGenerationSummary('test-token', 7);

      expect(result.data.suite_name).toBe('Q3 Edge Cases');
      expect(result.data.primary_txtp).toBe('pacs.008');
      expect(result.data.context_txtp_configs).toHaveLength(1);
      expect(result.data.enrichment_table_names).toEqual(['account_enrichment']);
    });

    it('includes record counts', async () => {
      adminServiceClient.getGenerationSummary.mockResolvedValue(mockSummaryResponse);

      const result = await service.getGenerationSummary('test-token', 7);

      expect(result.data.context_count).toBe(100);
      expect(result.data.trigger_count).toBe(10);
      expect(result.data.enrichment_table_count).toBe(1);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('Not found');
      adminServiceClient.getGenerationSummary.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.getGenerationSummary('test-token', 7)).rejects.toThrow('Not found');
      expect(loggerSpy).toHaveBeenCalledWith('Error fetching summary for generation 7', expect.any(String));
    });
  });

  describe('updateWizardProgress', () => {
    it('forwards both current_step_num and completed_step_num to admin-service', async () => {
      adminServiceClient.updateWizardProgress.mockResolvedValue({ success: true, message: 'Step 3 saved' });

      const result = await service.updateWizardProgress('test-token', 7, { current_step_num: 3, completed_step_num: 3 });

      expect(result.success).toBe(true);
      expect(adminServiceClient.updateWizardProgress).toHaveBeenCalledWith(
        'test-token',
        7,
        { current_step_num: 3, completed_step_num: 3 },
      );
    });

    it('forwards step 1 (first step)', async () => {
      adminServiceClient.updateWizardProgress.mockResolvedValue({ success: true, message: 'Step 1 saved' });
      await service.updateWizardProgress('test-token', 7, { current_step_num: 1, completed_step_num: 1 });
      expect(adminServiceClient.updateWizardProgress).toHaveBeenCalledWith('test-token', 7, { current_step_num: 1, completed_step_num: 1 });
    });

    it('logs and rethrows on error', async () => {
      adminServiceClient.updateWizardProgress.mockRejectedValue(new Error('DB fail'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');
      await expect(service.updateWizardProgress('test-token', 7, { current_step_num: 2, completed_step_num: 2 })).rejects.toThrow('DB fail');
      expect(loggerSpy).toHaveBeenCalledWith('Error updating wizard progress for generation 7', expect.any(String));
    });
  });

  describe('deleteContextTxtpConfig', () => {
    it('forwards token, generationId and configId', async () => {
      adminServiceClient.deleteContextTxtpConfig.mockResolvedValue({ success: true, message: 'Context txtp config deleted' });

      const result = await service.deleteContextTxtpConfig('test-token', 7, 10);

      expect(result.success).toBe(true);
      expect(adminServiceClient.deleteContextTxtpConfig).toHaveBeenCalledWith('test-token', 7, 10);
    });

    it('logs and rethrows on error', async () => {
      adminServiceClient.deleteContextTxtpConfig.mockRejectedValue(new Error('Not found'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');
      await expect(service.deleteContextTxtpConfig('test-token', 7, 10)).rejects.toThrow('Not found');
      expect(loggerSpy).toHaveBeenCalledWith('Error deleting context txtp config 10 for generation 7', expect.any(String));
    });
  });

  describe('deleteTriggerTxtpConfig', () => {
    it('forwards token, generationId and configId', async () => {
      adminServiceClient.deleteTriggerTxtpConfig.mockResolvedValue({ success: true, message: 'Trigger txtp config deleted' });

      const result = await service.deleteTriggerTxtpConfig('test-token', 7, 20);

      expect(result.success).toBe(true);
      expect(adminServiceClient.deleteTriggerTxtpConfig).toHaveBeenCalledWith('test-token', 7, 20);
    });

    it('logs and rethrows on error', async () => {
      adminServiceClient.deleteTriggerTxtpConfig.mockRejectedValue(new Error('Not found'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');
      await expect(service.deleteTriggerTxtpConfig('test-token', 7, 20)).rejects.toThrow('Not found');
      expect(loggerSpy).toHaveBeenCalledWith('Error deleting trigger txtp config 20 for generation 7', expect.any(String));
    });
  });

  describe('resumeGeneration', () => {
    it('forwards token and suiteId, returns the draft generation', async () => {
      adminServiceClient.resumeGeneration.mockResolvedValue(mockGeneration);

      const result = await service.resumeGeneration('test-token', 42);

      expect(result).toEqual(mockGeneration);
      expect(adminServiceClient.resumeGeneration).toHaveBeenCalledWith('test-token', 42);
    });

    it('returns a generation with DRAFT status and wizard snapshot', async () => {
      const draftGeneration: SuiteGenerationDto = {
        ...mockGeneration,
        status: 'DRAFT',
        wizard_snapshot: { current_step_num: 2, completed_step_num: 1 },
      };
      adminServiceClient.resumeGeneration.mockResolvedValue(draftGeneration);

      const result = await service.resumeGeneration('test-token', 42);

      expect(result.status).toBe('DRAFT');
      expect(result.wizard_snapshot).toEqual({ current_step_num: 2, completed_step_num: 1 });
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('No draft generation found');
      adminServiceClient.resumeGeneration.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.resumeGeneration('test-token', 42)).rejects.toThrow('No draft generation found');
      expect(loggerSpy).toHaveBeenCalledWith('Error resuming generation for suite 42', expect.any(String));
    });
  });
});

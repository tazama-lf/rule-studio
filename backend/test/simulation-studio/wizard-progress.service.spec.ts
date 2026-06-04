import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GenerationsService } from '../../src/services/simulation-studio/generations/generations.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';

describe('GenerationsService — wizard progress & delete config', () => {
  let service: GenerationsService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

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
          },
        },
      ],
    }).compile();

    service = module.get<GenerationsService>(GenerationsService);
    adminServiceClient = module.get(AdminServiceClient);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // ── updateWizardProgress ────────────────────────────────────────────────────

  describe('updateWizardProgress', () => {
    it('forwards both fields to admin-service', async () => {
      adminServiceClient.updateWizardProgress.mockResolvedValue({ success: true, message: 'Step 3 saved' });

      const result = await service.updateWizardProgress('tok', 7, { current_step_num: 3, completed_step_num: 3 });

      expect(result.success).toBe(true);
      expect(adminServiceClient.updateWizardProgress).toHaveBeenCalledWith('tok', 7, {
        current_step_num: 3,
        completed_step_num: 3,
      });
    });

    it('forwards step 1 (first step)', async () => {
      adminServiceClient.updateWizardProgress.mockResolvedValue({ success: true, message: 'ok' });

      await service.updateWizardProgress('tok', 7, { current_step_num: 1, completed_step_num: 1 });

      expect(adminServiceClient.updateWizardProgress).toHaveBeenCalledWith('tok', 7, {
        current_step_num: 1,
        completed_step_num: 1,
      });
    });

    it('current_step can be higher than completed (e.g. revisiting)', async () => {
      adminServiceClient.updateWizardProgress.mockResolvedValue({ success: true, message: 'ok' });

      await service.updateWizardProgress('tok', 7, { current_step_num: 4, completed_step_num: 2 });

      expect(adminServiceClient.updateWizardProgress).toHaveBeenCalledWith('tok', 7, {
        current_step_num: 4,
        completed_step_num: 2,
      });
    });

    it('logs and rethrows on error', async () => {
      adminServiceClient.updateWizardProgress.mockRejectedValue(new Error('DB fail'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.updateWizardProgress('tok', 7, { current_step_num: 2, completed_step_num: 2 })).rejects.toThrow('DB fail');
      expect(loggerSpy).toHaveBeenCalledWith('Error updating wizard progress for generation 7', expect.any(String));
    });
  });

  // ── deleteContextTxtpConfig ─────────────────────────────────────────────────

  describe('deleteContextTxtpConfig', () => {
    it('forwards token, generationId and configId', async () => {
      adminServiceClient.deleteContextTxtpConfig.mockResolvedValue({ success: true, message: 'deleted' });

      const result = await service.deleteContextTxtpConfig('tok', 7, 10);

      expect(result.success).toBe(true);
      expect(adminServiceClient.deleteContextTxtpConfig).toHaveBeenCalledWith('tok', 7, 10);
    });

    it('logs and rethrows on 404 error', async () => {
      adminServiceClient.deleteContextTxtpConfig.mockRejectedValue(new Error('Not found'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.deleteContextTxtpConfig('tok', 7, 10)).rejects.toThrow('Not found');
      expect(loggerSpy).toHaveBeenCalledWith(
        'Error deleting context txtp config 10 for generation 7',
        expect.any(String),
      );
    });
  });

  // ── deleteTriggerTxtpConfig ─────────────────────────────────────────────────

  describe('deleteTriggerTxtpConfig', () => {
    it('forwards token, generationId and configId', async () => {
      adminServiceClient.deleteTriggerTxtpConfig.mockResolvedValue({ success: true, message: 'deleted' });

      const result = await service.deleteTriggerTxtpConfig('tok', 7, 20);

      expect(result.success).toBe(true);
      expect(adminServiceClient.deleteTriggerTxtpConfig).toHaveBeenCalledWith('tok', 7, 20);
    });

    it('logs and rethrows on 404 error', async () => {
      adminServiceClient.deleteTriggerTxtpConfig.mockRejectedValue(new Error('Not found'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.deleteTriggerTxtpConfig('tok', 7, 20)).rejects.toThrow('Not found');
      expect(loggerSpy).toHaveBeenCalledWith(
        'Error deleting trigger txtp config 20 for generation 7',
        expect.any(String),
      );
    });
  });
});

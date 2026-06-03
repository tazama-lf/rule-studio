import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TriggerTxtpConfigService } from '../../src/services/simulation-studio/trigger-txtp-config/trigger-txtp-config.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import type {
  AddTriggerTxtpConfigDto,
  TriggerConfigsListDto,
  TriggerConfigWithOverridesResponseDto,
  BulkTriggerConfigItemDto,
  BulkUpdateTriggerConfigsResponseDto,
  TriggerTxtpConfigWithOverridesDto,
} from '../../src/services/simulation-studio/trigger-txtp-config/dto/trigger-txtp-config.dto';

describe('TriggerTxtpConfigService', () => {
  let service: TriggerTxtpConfigService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

  const mockOverride = {
    id: 1,
    trigger_txtp_config_id: 20,
    field_path: 'amount',
    override_type: 'null',
    generator_options: {},
    created_at: '2026-05-01T00:00:00.000Z',
  };

  const mockConfigWithOverrides: TriggerTxtpConfigWithOverridesDto = {
    trigger_txtp_config_id: 20,
    txtp: 'pacs.008',
    txtp_version: '001.08',
    message_count: 1,
    display_order: 1,
    payload_template_json: { amount: 100 },
    link_to_context_pairs: false,
    field_overrides: [mockOverride],
  };

  const mockGetResponse: TriggerConfigsListDto = {
    success: true,
    data: [mockConfigWithOverrides],
  };

  const mockAddResponse: TriggerConfigWithOverridesResponseDto = {
    success: true,
    data: mockConfigWithOverrides,
  };

  const mockBulkResponse: BulkUpdateTriggerConfigsResponseDto = {
    success: true,
    data: [mockConfigWithOverrides],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TriggerTxtpConfigService,
        {
          provide: AdminServiceClient,
          useValue: {
            getTriggerConfigs: jest.fn(),
            addTriggerTxtpConfig: jest.fn(),
            bulkUpdateTriggerConfigs: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TriggerTxtpConfigService>(TriggerTxtpConfigService);
    adminServiceClient = module.get(AdminServiceClient);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── getTriggerConfigs ──────────────────────────────────────────────────────

  describe('getTriggerConfigs', () => {
    it('forwards token and generationId, returns configs with overrides', async () => {
      adminServiceClient.getTriggerConfigs.mockResolvedValue(mockGetResponse);

      const result = await service.getTriggerConfigs('test-token', 1);

      expect(result).toEqual(mockGetResponse);
      expect(adminServiceClient.getTriggerConfigs).toHaveBeenCalledWith('test-token', 1);
    });

    it('returns empty data array when no configs exist', async () => {
      adminServiceClient.getTriggerConfigs.mockResolvedValue({ success: true, data: [] });

      const result = await service.getTriggerConfigs('test-token', 1);

      expect(result.data).toHaveLength(0);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('Fetch failed');
      adminServiceClient.getTriggerConfigs.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.getTriggerConfigs('test-token', 1)).rejects.toThrow('Fetch failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error fetching trigger configs for generation 1', expect.any(String));
    });
  });

  // ── addTriggerConfig ───────────────────────────────────────────────────────

  describe('addTriggerConfig', () => {
    it('forwards token, generationId and dto, returns config with overrides', async () => {
      const dto: AddTriggerTxtpConfigDto = { txtp: 'pacs.008', txtp_version: '001.08', message_count: 1 };
      adminServiceClient.addTriggerTxtpConfig.mockResolvedValue(mockAddResponse);

      const result = await service.addTriggerConfig('test-token', 1, dto);

      expect(result).toEqual(mockAddResponse);
      expect(adminServiceClient.addTriggerTxtpConfig).toHaveBeenCalledWith('test-token', 1, dto);
    });

    it('defaults to message_count=1 when not provided', async () => {
      const dto: AddTriggerTxtpConfigDto = { txtp: 'pacs.008', txtp_version: '001.08' };
      adminServiceClient.addTriggerTxtpConfig.mockResolvedValue(mockAddResponse);

      await service.addTriggerConfig('test-token', 1, dto);

      expect(adminServiceClient.addTriggerTxtpConfig).toHaveBeenCalledWith('test-token', 1, dto);
    });

    it('includes field overrides seeded with null type in response', async () => {
      const dto: AddTriggerTxtpConfigDto = { txtp: 'pacs.008', txtp_version: '001.08' };
      adminServiceClient.addTriggerTxtpConfig.mockResolvedValue(mockAddResponse);

      const result = await service.addTriggerConfig('test-token', 1, dto);

      expect(result.data.field_overrides[0].override_type).toBe('null');
    });

    it('logs and rethrows on error', async () => {
      const dto: AddTriggerTxtpConfigDto = { txtp: 'pacs.008', txtp_version: '001.08' };
      const error = new Error('Create failed');
      adminServiceClient.addTriggerTxtpConfig.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.addTriggerConfig('test-token', 1, dto)).rejects.toThrow('Create failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error adding trigger config for generation 1', expect.any(String));
    });
  });

  // ── bulkUpdateTriggerConfigs ───────────────────────────────────────────────

  describe('bulkUpdateTriggerConfigs', () => {
    it('forwards token, generationId and items array, returns updated configs', async () => {
      const items: BulkTriggerConfigItemDto[] = [
        {
          trigger_txtp_config_id: 20,
          message_count: 2,
          field_overrides: [{ field_path: 'amount', override_type: 'static', static_value: '999' }],
        },
      ];
      adminServiceClient.bulkUpdateTriggerConfigs.mockResolvedValue(mockBulkResponse);

      const result = await service.bulkUpdateTriggerConfigs('test-token', 1, items);

      expect(result).toEqual(mockBulkResponse);
      expect(adminServiceClient.bulkUpdateTriggerConfigs).toHaveBeenCalledWith('test-token', 1, items);
    });

    it('handles all override types', async () => {
      const items: BulkTriggerConfigItemDto[] = [
        {
          trigger_txtp_config_id: 20,
          field_overrides: [
            { field_path: 'field.a', override_type: 'static', static_value: 'x' },
            { field_path: 'field.b', override_type: 'range', range_min: 1, range_max: 100 },
            { field_path: 'field.c', override_type: 'generated', generator_type: 'iso20022.bic' },
            { field_path: 'field.d', override_type: 'remove' },
            { field_path: 'field.e', override_type: 'null' },
          ],
        },
      ];
      adminServiceClient.bulkUpdateTriggerConfigs.mockResolvedValue(mockBulkResponse);

      await service.bulkUpdateTriggerConfigs('test-token', 1, items);

      expect(adminServiceClient.bulkUpdateTriggerConfigs).toHaveBeenCalledWith('test-token', 1, items);
    });

    it('handles multiple configs in one call', async () => {
      const items: BulkTriggerConfigItemDto[] = [
        { trigger_txtp_config_id: 20, message_count: 2 },
        { trigger_txtp_config_id: 21, message_count: 3, notes: 'boundary test', expected_result_band: 'bad' },
      ];
      adminServiceClient.bulkUpdateTriggerConfigs.mockResolvedValue(mockBulkResponse);

      await service.bulkUpdateTriggerConfigs('test-token', 1, items);

      expect(adminServiceClient.bulkUpdateTriggerConfigs).toHaveBeenCalledWith('test-token', 1, items);
    });

    it('supports link_to_context_pairs and expected_result_band', async () => {
      const items: BulkTriggerConfigItemDto[] = [
        { trigger_txtp_config_id: 20, link_to_context_pairs: true, expected_result_band: 'good' },
      ];
      adminServiceClient.bulkUpdateTriggerConfigs.mockResolvedValue(mockBulkResponse);

      await service.bulkUpdateTriggerConfigs('test-token', 1, items);

      expect(adminServiceClient.bulkUpdateTriggerConfigs).toHaveBeenCalledWith('test-token', 1, items);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('Bulk update failed');
      adminServiceClient.bulkUpdateTriggerConfigs.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.bulkUpdateTriggerConfigs('test-token', 1, [])).rejects.toThrow('Bulk update failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error bulk updating trigger configs for generation 1', expect.any(String));
    });
  });
});

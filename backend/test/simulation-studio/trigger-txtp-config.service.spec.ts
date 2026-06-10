import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TriggerTxtpConfigService } from '../../src/services/simulation-studio/trigger-txtp-config/trigger-txtp-config.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import type {
  AddTriggerTxtpConfigDto,
  CreateTriggerMappingDto,
  TriggerMappingResponseDto,
  TriggerMappingsResponseDto,
  TriggerConfigsListDto,
  TriggerConfigWithStrategiesResponseDto,
  BulkTriggerConfigItemDto,
  BulkUpdateTriggerConfigsResponseDto,
  TriggerTxtpConfigWithStrategiesDto,
} from '../../src/services/simulation-studio/trigger-txtp-config/dto/trigger-txtp-config.dto';

describe('TriggerTxtpConfigService', () => {
  let service: TriggerTxtpConfigService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

  const mockOverride = {
    id: 1,
    trigger_txtp_config_id: 20,
    field_path: 'amount',
    strategy_code: 'null',
    generator_options: {},
    created_at: '2026-05-01T00:00:00.000Z',
  };

  const mockConfigWithStrategies: TriggerTxtpConfigWithStrategiesDto = {
    trigger_txtp_config_id: 20,
    txtp: 'pacs.008',
    txtp_version: '001.08',
    message_count: 1,
    display_order: 1,
    payload_template_json: { amount: 100 },
    link_to_context_pairs: false,
    field_strategies: [mockOverride],
  };

  const mockGetResponse: TriggerConfigsListDto = {
    success: true,
    data: [mockConfigWithStrategies],
  };

  const mockAddResponse: TriggerConfigWithStrategiesResponseDto = {
    success: true,
    data: mockConfigWithStrategies,
  };

  const mockBulkResponse: BulkUpdateTriggerConfigsResponseDto = {
    success: true,
    data: [mockConfigWithStrategies],
  };

  const mockTriggerMappingCreateDto: CreateTriggerMappingDto = {
    primary_txtp_id: 123,
    related_txtp_id: 456,
    mapping: [{ primary: 'FITOFI.amount', related: 'msgId' }],
  };

  const mockTriggerMappingRow = {
    id: 201,
    primary_tx_id: 123,
    related_tx_id: 456,
    mapping: [{ primary: 'FITOFI.amount', related: 'msgId' }],
  };

  const mockTriggerMappingCreateResponse: TriggerMappingResponseDto = {
    success: true,
    data: mockTriggerMappingRow,
  };

  const mockTriggerMappingsResponse: TriggerMappingsResponseDto = {
    success: true,
    data: [
      mockTriggerMappingRow,
      {
        id: 202,
        primary_tx_id: 123,
        related_tx_id: 456,
        mapping: [{ primary: 'FITOFI.currency', related: 'ccy' }],
      },
    ],
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
            createTriggerMapping: jest.fn(),
            getTriggerMappings: jest.fn(),
            deleteTriggerMapping: jest.fn(),
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

      expect(result.data.field_strategies[0].strategy_code).toBe('null');
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
          field_strategies: [{ field_path: 'amount', strategy_code: 'static', static_value: '999' }],
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
          field_strategies: [
            { field_path: 'field.a', strategy_code: 'static', static_value: 'x', faker_semantic_type: 'iso20022.bic' },
            { field_path: 'field.b', strategy_code: 'range', range_min: 1, range_max: 100, faker_semantic_type: 'iso20022.amount' },
            { field_path: 'field.c', strategy_code: 'generated', faker_semantic_type: 'iso20022.bic' },
            { field_path: 'field.d', strategy_code: 'remove', faker_semantic_type: 'iso20022.bic' },
            { field_path: 'field.e', strategy_code: 'null', faker_semantic_type: 'iso20022.bic' },
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

  describe('createTriggerMapping', () => {
    it('forwards token and dto, returns created mapping row', async () => {
      adminServiceClient.createTriggerMapping.mockResolvedValue(mockTriggerMappingCreateResponse);

      const result = await service.createTriggerMapping('test-token', mockTriggerMappingCreateDto);

      expect(result).toEqual(mockTriggerMappingCreateResponse);
      expect(adminServiceClient.createTriggerMapping).toHaveBeenCalledWith('test-token', mockTriggerMappingCreateDto);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('Create mapping failed');
      adminServiceClient.createTriggerMapping.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.createTriggerMapping('test-token', mockTriggerMappingCreateDto)).rejects.toThrow('Create mapping failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error creating trigger mapping', expect.any(String));
    });
  });

  describe('getTriggerMappings', () => {
    it('forwards token and ids, returns all mapping rows for pair', async () => {
      adminServiceClient.getTriggerMappings.mockResolvedValue(mockTriggerMappingsResponse);

      const result = await service.getTriggerMappings('test-token', 123, 456);

      expect(result).toEqual(mockTriggerMappingsResponse);
      expect(result.data).toHaveLength(2);
      expect(adminServiceClient.getTriggerMappings).toHaveBeenCalledWith('test-token', 123, 456);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('Get mappings failed');
      adminServiceClient.getTriggerMappings.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.getTriggerMappings('test-token', 123, 456)).rejects.toThrow('Get mappings failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error fetching trigger mappings for 123/456', expect.any(String));
    });
  });

  describe('deleteTriggerMapping', () => {
    it('forwards token and ids, returns delete response', async () => {
      const deleteResponse = { success: true, message: 'Trigger mapping deleted' };
      adminServiceClient.deleteTriggerMapping.mockResolvedValue(deleteResponse);

      const result = await service.deleteTriggerMapping('test-token', 123, 456);

      expect(result).toEqual(deleteResponse);
      expect(adminServiceClient.deleteTriggerMapping).toHaveBeenCalledWith('test-token', 123, 456);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('Delete mappings failed');
      adminServiceClient.deleteTriggerMapping.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.deleteTriggerMapping('test-token', 123, 456)).rejects.toThrow('Delete mappings failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error deleting trigger mappings for 123/456', expect.any(String));
    });
  });
});

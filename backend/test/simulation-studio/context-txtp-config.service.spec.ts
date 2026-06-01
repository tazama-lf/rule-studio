import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ContextTxtpConfigService } from '../../src/services/simulation-studio/context-txtp-config/context-txtp-config.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import type {
  UpdateContextTxtpConfigDto,
  ContextTxtpConfigResponseDto,
  UpsertFieldStrategiesDto,
  FieldStrategyResponseDto,
  FieldStrategiesListDto,
  ContextFieldStrategyDto,
  SuiteContextTxtpConfigDto,
} from '../../src/services/simulation-studio/context-txtp-config/dto/context-txtp-config.dto';

describe('ContextTxtpConfigService', () => {
  let service: ContextTxtpConfigService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

  const mockContextConfig: SuiteContextTxtpConfigDto = {
    id: 1,
    generation_id: 1,
    txtp: 'pacs.008',
    txtp_version: '001.08',
    display_order: 1,
    message_count: 5,
    faker_seed: 42,
    schema_snapshot: {},
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
  };

  const mockConfigResponse: ContextTxtpConfigResponseDto = {
    success: true,
    data: mockContextConfig,
  };

  const mockFieldStrategy: ContextFieldStrategyDto = {
    id: 1,
    context_txtp_config_id: 1,
    field_path: 'CdtTrfTxInf.IntrBkSttlmAmt.value',
    strategy_code: 'static',
    static_value: 999,
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
  };

  const mockFieldStrategyResponse: FieldStrategyResponseDto = {
    success: true,
    data: [mockFieldStrategy],
  };

  const mockFieldStrategiesList: FieldStrategiesListDto = {
    success: true,
    data: [mockFieldStrategy],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContextTxtpConfigService,
        {
          provide: AdminServiceClient,
          useValue: {
            updateContextTxtpConfig: jest.fn(),
            upsertFieldStrategies: jest.fn(),
            getFieldStrategies: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContextTxtpConfigService>(ContextTxtpConfigService);
    adminServiceClient = module.get(AdminServiceClient);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateContextConfig', () => {
    it('forwards token, suiteId, configId and dto', async () => {
      const dto: UpdateContextTxtpConfigDto = { message_count: 5, faker_seed: 42 };
      adminServiceClient.updateContextTxtpConfig.mockResolvedValue(mockConfigResponse);

      const result = await service.updateContextConfig('test-token', 42, 1, dto);

      expect(result).toEqual(mockConfigResponse);
      expect(adminServiceClient.updateContextTxtpConfig).toHaveBeenCalledWith('test-token', 42, 1, dto);
    });

    it('logs and rethrows on error', async () => {
      const dto: UpdateContextTxtpConfigDto = { message_count: 5 };
      const error = new Error('Config not found');
      adminServiceClient.updateContextTxtpConfig.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.updateContextConfig('test-token', 42, 1, dto)).rejects.toThrow('Config not found');
      expect(loggerSpy).toHaveBeenCalledWith('Error updating context config 1 for suite 42', expect.any(String));
    });
  });

  describe('upsertFieldStrategies', () => {
    it('forwards token, suiteId, configId and strategies', async () => {
      const dto: UpsertFieldStrategiesDto = {
        strategies: [
          { field_path: 'CdtTrfTxInf.IntrBkSttlmAmt.value', strategy_code: 'static', static_value: 999 },
        ],
      };
      adminServiceClient.upsertFieldStrategies.mockResolvedValue(mockFieldStrategyResponse);

      const result = await service.upsertFieldStrategies('test-token', 42, 1, dto);

      expect(result).toEqual(mockFieldStrategyResponse);
      expect(adminServiceClient.upsertFieldStrategies).toHaveBeenCalledWith('test-token', 42, 1, dto);
    });

    it('supports all strategy codes', async () => {
      const dto: UpsertFieldStrategiesDto = {
        strategies: [
          { field_path: 'field.a', strategy_code: 'keep_sample' },
          { field_path: 'field.b', strategy_code: 'range', range_min: 1, range_max: 100 },
          { field_path: 'field.c', strategy_code: 'generated', generator_type: 'iso20022.bic' },
          { field_path: 'field.d', strategy_code: 'null' },
          { field_path: 'field.e', strategy_code: 'skip' },
        ],
      };
      adminServiceClient.upsertFieldStrategies.mockResolvedValue(mockFieldStrategyResponse);

      await service.upsertFieldStrategies('test-token', 42, 1, dto);

      expect(adminServiceClient.upsertFieldStrategies).toHaveBeenCalledWith('test-token', 42, 1, dto);
    });

    it('logs and rethrows on error', async () => {
      const dto: UpsertFieldStrategiesDto = { strategies: [] };
      const error = new Error('Upsert failed');
      adminServiceClient.upsertFieldStrategies.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.upsertFieldStrategies('test-token', 42, 1, dto)).rejects.toThrow('Upsert failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error upserting field strategies for config 1', expect.any(String));
    });
  });

  describe('getFieldStrategies', () => {
    it('forwards token, suiteId and configId', async () => {
      adminServiceClient.getFieldStrategies.mockResolvedValue(mockFieldStrategiesList);

      const result = await service.getFieldStrategies('test-token', 42, 1);

      expect(result).toEqual(mockFieldStrategiesList);
      expect(adminServiceClient.getFieldStrategies).toHaveBeenCalledWith('test-token', 42, 1);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('Fetch failed');
      adminServiceClient.getFieldStrategies.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.getFieldStrategies('test-token', 42, 1)).rejects.toThrow('Fetch failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error fetching field strategies for config 1', expect.any(String));
    });
  });
});

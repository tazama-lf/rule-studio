import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ContextTxtpConfigService } from '../../src/services/simulation-studio/context-txtp-config/context-txtp-config.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import type {
  AddContextTxtpConfigDto,
  ContextConfigWithStrategiesResponseDto,
  ContextConfigsWithStrategiesListDto,
  BulkConfigItemDto,
  BulkUpdateContextConfigsResponseDto,
  ContextTxtpConfigWithStrategiesDto,
} from '../../src/services/simulation-studio/context-txtp-config/dto/context-txtp-config.dto';

describe('ContextTxtpConfigService', () => {
  let service: ContextTxtpConfigService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

  const mockStrategy = {
    id: 1,
    context_txtp_config_id: 10,
    field_path: 'amount',
    strategy_code: 'keep_sample' as const,
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
  };

  const mockConfigWithStrategies: ContextTxtpConfigWithStrategiesDto = {
    context_txtp_config_id: 10,
    txtp: 'pacs.008',
    txtp_version: '001.08',
    message_count: 100,
    display_order: 1,
    schema_snapshot: {},
    field_strategies: [mockStrategy],
  };

  const mockGetResponse: ContextConfigsWithStrategiesListDto = {
    success: true,
    data: [mockConfigWithStrategies],
  };

  const mockAddResponse: ContextConfigWithStrategiesResponseDto = {
    success: true,
    data: mockConfigWithStrategies,
  };

  const mockBulkResponse: BulkUpdateContextConfigsResponseDto = {
    success: true,
    data: [mockConfigWithStrategies],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContextTxtpConfigService,
        {
          provide: AdminServiceClient,
          useValue: {
            getContextConfigs: jest.fn(),
            addContextTxtpConfig: jest.fn(),
            bulkUpdateContextConfigs: jest.fn(),
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

  describe('getContextConfigs', () => {
    it('forwards token and generationId, returns configs with strategies', async () => {
      adminServiceClient.getContextConfigs.mockResolvedValue(mockGetResponse);

      const result = await service.getContextConfigs('test-token', 1);

      expect(result).toEqual(mockGetResponse);
      expect(adminServiceClient.getContextConfigs).toHaveBeenCalledWith('test-token', 1);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('Fetch failed');
      adminServiceClient.getContextConfigs.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.getContextConfigs('test-token', 1)).rejects.toThrow('Fetch failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error fetching context configs for generation 1', expect.any(String));
    });
  });

  describe('addContextConfig', () => {
    it('forwards token, generationId and dto, returns config with strategies', async () => {
      const dto: AddContextTxtpConfigDto = { txtp: 'pacs.008', txtp_version: '001.08', message_count: 100 };
      adminServiceClient.addContextTxtpConfig.mockResolvedValue(mockAddResponse);

      const result = await service.addContextConfig('test-token', 1, dto);

      expect(result).toEqual(mockAddResponse);
      expect(adminServiceClient.addContextTxtpConfig).toHaveBeenCalledWith('test-token', 1, dto);
    });

    it('uses default message_count when not provided', async () => {
      const dto: AddContextTxtpConfigDto = { txtp: 'pacs.002', txtp_version: '001.08' };
      adminServiceClient.addContextTxtpConfig.mockResolvedValue(mockAddResponse);

      await service.addContextConfig('test-token', 1, dto);

      expect(adminServiceClient.addContextTxtpConfig).toHaveBeenCalledWith('test-token', 1, dto);
    });

    it('logs and rethrows on error', async () => {
      const dto: AddContextTxtpConfigDto = { txtp: 'pacs.008', txtp_version: '001.08' };
      const error = new Error('Create failed');
      adminServiceClient.addContextTxtpConfig.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.addContextConfig('test-token', 1, dto)).rejects.toThrow('Create failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error adding context config for generation 1', expect.any(String));
    });
  });

  describe('bulkUpdateContextConfigs', () => {
    it('forwards token, generationId and items array, returns updated configs', async () => {
      const items: BulkConfigItemDto[] = [
        {
          context_txtp_config_id: 10,
          message_count: 50,
          field_strategies: [{ field_path: 'amount', strategy_code: 'keep_sample' }],
        },
      ];
      adminServiceClient.bulkUpdateContextConfigs.mockResolvedValue(mockBulkResponse);

      const result = await service.bulkUpdateContextConfigs('test-token', 1, items);

      expect(result).toEqual(mockBulkResponse);
      expect(adminServiceClient.bulkUpdateContextConfigs).toHaveBeenCalledWith('test-token', 1, items);
    });

    it('handles multiple configs in one call', async () => {
      const items: BulkConfigItemDto[] = [
        { context_txtp_config_id: 10, message_count: 50 },
        { context_txtp_config_id: 11, message_count: 200, field_strategies: [{ field_path: 'field.b', strategy_code: 'static', static_value: 'x' }] },
      ];
      adminServiceClient.bulkUpdateContextConfigs.mockResolvedValue(mockBulkResponse);

      await service.bulkUpdateContextConfigs('test-token', 1, items);

      expect(adminServiceClient.bulkUpdateContextConfigs).toHaveBeenCalledWith('test-token', 1, items);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('Bulk update failed');
      adminServiceClient.bulkUpdateContextConfigs.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.bulkUpdateContextConfigs('test-token', 1, [])).rejects.toThrow('Bulk update failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error bulk updating context configs for generation 1', expect.any(String));
    });
  });
});

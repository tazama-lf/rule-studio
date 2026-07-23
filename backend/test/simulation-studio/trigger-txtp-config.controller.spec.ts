import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TriggerTxtpConfigController } from '../../src/services/simulation-studio/trigger-txtp-config/trigger-txtp-config.controller';
import { TriggerTxtpConfigService } from '../../src/services/simulation-studio/trigger-txtp-config/trigger-txtp-config.service';
import { makeAuthenticatedUser } from '../helpers/rbac/user.factory';
import type {
  TriggerConfigsListDto,
  TriggerConfigWithStrategiesResponseDto,
  TriggerTxtpConfigWithStrategiesDto,
} from '../../src/services/simulation-studio/trigger-txtp-config/dto/trigger-txtp-config.dto';

describe('TriggerTxtpConfigController', () => {
  let controller: TriggerTxtpConfigController;
  let service: jest.Mocked<TriggerTxtpConfigService>;

  const makeUser = makeAuthenticatedUser;

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

  const mockGetListResponse: TriggerConfigsListDto = {
    success: true,
    data: [mockConfigWithStrategies],
  };

  const mockGetByIdResponse: TriggerConfigWithStrategiesResponseDto = {
    success: true,
    data: mockConfigWithStrategies,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TriggerTxtpConfigController],
      providers: [
        {
          provide: 'AUDIT_LOGGER',
          useValue: { logEvent: jest.fn() },
        },
        {
          provide: TriggerTxtpConfigService,
          useValue: {
            getTriggerConfigs: jest.fn(),
            getTriggerConfigById: jest.fn(),
            addTriggerConfig: jest.fn(),
            bulkUpdateTriggerConfigs: jest.fn(),
            deleteTriggerTxtpConfig: jest.fn(),
            createTriggerMapping: jest.fn(),
            getTriggerMappings: jest.fn(),
            deleteTriggerMapping: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TriggerTxtpConfigController>(TriggerTxtpConfigController);
    service = module.get(TriggerTxtpConfigService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  // ── getTriggerConfigs ──────────────────────────────────────────────────────

  describe('getTriggerConfigs', () => {
    it('delegates to service with token and generationId', async () => {
      const user = makeUser();
      service.getTriggerConfigs.mockResolvedValue(mockGetListResponse);

      const result = await controller.getTriggerConfigs(1, user);

      expect(result).toEqual(mockGetListResponse);
      expect(service.getTriggerConfigs).toHaveBeenCalledWith('test-token', 1);
    });

    it('returns configs array', async () => {
      const user = makeUser();
      service.getTriggerConfigs.mockResolvedValue(mockGetListResponse);

      const result = await controller.getTriggerConfigs(1, user);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].trigger_txtp_config_id).toBe(20);
    });

    it('propagates service error to caller', async () => {
      const user = makeUser();
      service.getTriggerConfigs.mockRejectedValue(new Error('fetch failed'));

      await expect(controller.getTriggerConfigs(1, user)).rejects.toThrow('fetch failed');
    });
  });

  // ── getTriggerConfigById ───────────────────────────────────────────────────

  describe('getTriggerConfigById', () => {
    it('delegates to service with token and configId', async () => {
      const user = makeUser();
      service.getTriggerConfigById.mockResolvedValue(mockGetByIdResponse);

      const result = await controller.getTriggerConfigById(20, user);

      expect(result).toEqual(mockGetByIdResponse);
      expect(service.getTriggerConfigById).toHaveBeenCalledWith('test-token', 20);
    });

    it('returns config with field strategies', async () => {
      const user = makeUser();
      service.getTriggerConfigById.mockResolvedValue(mockGetByIdResponse);

      const result = await controller.getTriggerConfigById(20, user);

      expect(result.data.trigger_txtp_config_id).toBe(20);
      expect(result.data.field_strategies).toHaveLength(1);
    });

    it('passes numeric configId (ParseIntPipe result) to service', async () => {
      const user = makeUser();
      service.getTriggerConfigById.mockResolvedValue(mockGetByIdResponse);

      await controller.getTriggerConfigById(99, user);

      expect(service.getTriggerConfigById).toHaveBeenCalledWith('test-token', 99);
    });

    it('propagates service error to caller', async () => {
      const user = makeUser();
      service.getTriggerConfigById.mockRejectedValue(new Error('not found'));

      await expect(controller.getTriggerConfigById(20, user)).rejects.toThrow('not found');
    });
  });
});

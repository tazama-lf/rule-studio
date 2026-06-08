import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { FakerSemanticDataService } from '../../src/services/simulation-studio/faker-semantic-data/faker_semantic_data.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import type {
  FakerSemanticDataDto,
  FakerSemanticDataListDto,
} from '../../src/services/simulation-studio/faker-semantic-data/dto/faker_semantic_data.dto';

describe('FakerSemanticDataService', () => {
  let service: FakerSemanticDataService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

  const mockFakerItem: FakerSemanticDataDto = {
    id: 1,
    name: ['name1', 'name2'],
  };

  const mockListResponse: FakerSemanticDataListDto = {
    success: true,
    message: 'Data fetched successfully',
    data: [mockFakerItem],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FakerSemanticDataService,
        {
          provide: AdminServiceClient,
          useValue: {
            generateFakerSemanticData: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FakerSemanticDataService>(FakerSemanticDataService);
    adminServiceClient = module.get(AdminServiceClient);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // ── generateFakerSemanticData ───────────────────────────────────────────

  describe('generateFakerSemanticData', () => {
    it('forwards token to admin-service and returns the list response', async () => {
      adminServiceClient.generateFakerSemanticData.mockResolvedValue(mockListResponse);

      const result = await service.generateFakerSemanticData('test-token');

      expect(result).toEqual(mockListResponse);
      expect(adminServiceClient.generateFakerSemanticData).toHaveBeenCalledWith('test-token');
    });

    it('returns success flag and message from admin-service response', async () => {
      adminServiceClient.generateFakerSemanticData.mockResolvedValue(mockListResponse);

      const result = await service.generateFakerSemanticData('test-token');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Data fetched successfully');
    });

    it('returns data array with faker items', async () => {
      adminServiceClient.generateFakerSemanticData.mockResolvedValue(mockListResponse);

      const result = await service.generateFakerSemanticData('test-token');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].name).toEqual(['name1', 'name2']);
    });

    it('returns empty data array when no faker items exist', async () => {
      adminServiceClient.generateFakerSemanticData.mockResolvedValue({
        success: true,
        message: 'Data fetched successfully',
        data: [],
      });

      const result = await service.generateFakerSemanticData('test-token');

      expect(result.data).toHaveLength(0);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('Fetch failed');
      adminServiceClient.generateFakerSemanticData.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.generateFakerSemanticData('test-token')).rejects.toThrow('Fetch failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error getting faker semantic data', expect.any(String));
    });
  });
});

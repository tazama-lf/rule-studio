import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { EnrichmentTableService } from '../../src/services/simulation-studio/enrichment-table/enrichment-table.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import type {
  CreateEnrichmentTableDto,
  EnrichmentTableResponseDto,
  EnrichmentTablesListDto,
  BulkEnrichmentUpdateItemDto,
  BulkUpdateEnrichmentTablesResponseDto,
  DeleteEnrichmentTableResponseDto,
  EnrichmentTableWithStrategiesDto,
} from '../../src/services/simulation-studio/enrichment-table/dto/enrichment-table.dto';

describe('EnrichmentTableService', () => {
  let service: EnrichmentTableService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

  const mockStrategy = {
    id: 1,
    enrichment_table_id: 30,
    column_name: 'name',
    strategy_code: 'null',
    generator_options: {},
    created_at: '2026-06-01T00:00:00.000Z',
  };

  const mockTableWithStrategies: EnrichmentTableWithStrategiesDto = {
    enrichment_table_id: 30,
    table_name: 'account_enrichment',
    table_order: 1,
    row_count: 13,
    payload_template_json: { name: 'feeba', country: 'Pak' },
    field_strategies: [mockStrategy],
  };

  const mockListResponse: EnrichmentTablesListDto = { success: true, data: [mockTableWithStrategies] };
  const mockCreateResponse: EnrichmentTableResponseDto = { success: true, data: mockTableWithStrategies };
  const mockBulkResponse: BulkUpdateEnrichmentTablesResponseDto = { success: true, data: [mockTableWithStrategies] };
  const mockDeleteResponse: DeleteEnrichmentTableResponseDto = { success: true, message: 'Enrichment table deleted' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrichmentTableService,
        {
          provide: AdminServiceClient,
          useValue: {
            getEnrichmentTables: jest.fn(),
            createEnrichmentTable: jest.fn(),
            bulkUpdateEnrichmentTables: jest.fn(),
            deleteEnrichmentTable: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EnrichmentTableService>(EnrichmentTableService);
    adminServiceClient = module.get(AdminServiceClient);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // ── getEnrichmentTables ──────────────────────────────────────────────────

  describe('getEnrichmentTables', () => {
    it('forwards token and generationId, returns tables with strategies', async () => {
      adminServiceClient.getEnrichmentTables.mockResolvedValue(mockListResponse);
      const result = await service.getEnrichmentTables('test-token', 1);
      expect(result).toEqual(mockListResponse);
      expect(adminServiceClient.getEnrichmentTables).toHaveBeenCalledWith('test-token', 1);
    });

    it('returns empty data array when no tables', async () => {
      adminServiceClient.getEnrichmentTables.mockResolvedValue({ success: true, data: [] });
      const result = await service.getEnrichmentTables('test-token', 1);
      expect(result.data).toHaveLength(0);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('Fetch failed');
      adminServiceClient.getEnrichmentTables.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');
      await expect(service.getEnrichmentTables('test-token', 1)).rejects.toThrow('Fetch failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error fetching enrichment tables for generation 1', expect.any(String));
    });
  });

  // ── createEnrichmentTable ────────────────────────────────────────────────

  describe('createEnrichmentTable', () => {
    it('forwards token, generationId and dto, returns table with strategies', async () => {
      const dto: CreateEnrichmentTableDto = { table_name: 'account_enrichment', row_count: 13, payload_template_json: { name: 'feeba' } };
      adminServiceClient.createEnrichmentTable.mockResolvedValue(mockCreateResponse);
      const result = await service.createEnrichmentTable('test-token', 1, dto);
      expect(result).toEqual(mockCreateResponse);
      expect(adminServiceClient.createEnrichmentTable).toHaveBeenCalledWith('test-token', 1, dto);
    });

    it('seeds field strategies with null as default', async () => {
      const dto: CreateEnrichmentTableDto = { table_name: 'cnic', row_count: 1, payload_template_json: { id: '123' } };
      adminServiceClient.createEnrichmentTable.mockResolvedValue(mockCreateResponse);
      const result = await service.createEnrichmentTable('test-token', 1, dto);
      expect(result.data.field_strategies[0].strategy_code).toBe('null');
    });

    it('logs and rethrows on error', async () => {
      const dto: CreateEnrichmentTableDto = { table_name: 'test', row_count: 1 };
      adminServiceClient.createEnrichmentTable.mockRejectedValue(new Error('Create failed'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');
      await expect(service.createEnrichmentTable('test-token', 1, dto)).rejects.toThrow('Create failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error creating enrichment table for generation 1', expect.any(String));
    });
  });

  // ── bulkUpdateEnrichmentTables ───────────────────────────────────────────

  describe('bulkUpdateEnrichmentTables', () => {
    it('forwards token, generationId and items, returns updated tables', async () => {
      const items: BulkEnrichmentUpdateItemDto[] = [
        { enrichment_table_id: 30, row_count: 5, field_strategies: [{ column_name: 'name', strategy_code: 'static', static_value: 'Ahmad' }] },
      ];
      adminServiceClient.bulkUpdateEnrichmentTables.mockResolvedValue(mockBulkResponse);
      const result = await service.bulkUpdateEnrichmentTables('test-token', 1, items);
      expect(result).toEqual(mockBulkResponse);
      expect(adminServiceClient.bulkUpdateEnrichmentTables).toHaveBeenCalledWith('test-token', 1, items);
    });

    it('handles multiple tables in one call', async () => {
      const items: BulkEnrichmentUpdateItemDto[] = [
        { enrichment_table_id: 30, row_count: 5 },
        { enrichment_table_id: 31, payload_template_json: { city: 'Karachi' }, field_strategies: [{ column_name: 'city', strategy_code: 'null' }] },
      ];
      adminServiceClient.bulkUpdateEnrichmentTables.mockResolvedValue(mockBulkResponse);
      await service.bulkUpdateEnrichmentTables('test-token', 1, items);
      expect(adminServiceClient.bulkUpdateEnrichmentTables).toHaveBeenCalledWith('test-token', 1, items);
    });

    it('supports all strategy codes', async () => {
      const items: BulkEnrichmentUpdateItemDto[] = [
        {
          enrichment_table_id: 30,
          field_strategies: [
            { column_name: 'a', strategy_code: 'static', static_value: 'x' },
            { column_name: 'b', strategy_code: 'range', range_min: 1, range_max: 100 },
            { column_name: 'c', strategy_code: 'generated', generator_type: 'iso20022.bic' },
            { column_name: 'd', strategy_code: 'null' },
            { column_name: 'e', strategy_code: 'copy' },
          ],
        },
      ];
      adminServiceClient.bulkUpdateEnrichmentTables.mockResolvedValue(mockBulkResponse);
      await service.bulkUpdateEnrichmentTables('test-token', 1, items);
      expect(adminServiceClient.bulkUpdateEnrichmentTables).toHaveBeenCalledWith('test-token', 1, items);
    });

    it('logs and rethrows on error', async () => {
      adminServiceClient.bulkUpdateEnrichmentTables.mockRejectedValue(new Error('Update failed'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');
      await expect(service.bulkUpdateEnrichmentTables('test-token', 1, [])).rejects.toThrow('Update failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error bulk updating enrichment tables for generation 1', expect.any(String));
    });
  });

  // ── deleteEnrichmentTable ────────────────────────────────────────────────

  describe('deleteEnrichmentTable', () => {
    it('forwards token, generationId and tableId, returns success', async () => {
      adminServiceClient.deleteEnrichmentTable.mockResolvedValue(mockDeleteResponse);
      const result = await service.deleteEnrichmentTable('test-token', 1, 30);
      expect(result).toEqual(mockDeleteResponse);
      expect(adminServiceClient.deleteEnrichmentTable).toHaveBeenCalledWith('test-token', 1, 30);
    });

    it('logs and rethrows on error', async () => {
      adminServiceClient.deleteEnrichmentTable.mockRejectedValue(new Error('Delete failed'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');
      await expect(service.deleteEnrichmentTable('test-token', 1, 30)).rejects.toThrow('Delete failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error deleting enrichment table 30 for generation 1', expect.any(String));
    });
  });
});

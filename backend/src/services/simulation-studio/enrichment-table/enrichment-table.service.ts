import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../../admin-service-client';
import type {
  CreateEnrichmentTableDto,
  EnrichmentTableResponseDto,
  EnrichmentTablesListDto,
  BulkEnrichmentUpdateItemDto,
  BulkUpdateEnrichmentTablesResponseDto,
  DeleteEnrichmentTableResponseDto,
} from './dto/enrichment-table.dto';

@Injectable()
export class EnrichmentTableService {
  private readonly logger = new Logger(EnrichmentTableService.name);

  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async getEnrichmentTables(token: string, generationId: number): Promise<EnrichmentTablesListDto> {
    try {
      return await this.adminServiceClient.getEnrichmentTables(token, generationId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error fetching enrichment tables for generation ${generationId}`, error.stack);
      throw err;
    }
  }

  async createEnrichmentTable(token: string, generationId: number, dto: CreateEnrichmentTableDto): Promise<EnrichmentTableResponseDto> {
    try {
      return await this.adminServiceClient.createEnrichmentTable(token, generationId, dto);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error creating enrichment table for generation ${generationId}`, error.stack);
      throw err;
    }
  }

  async bulkUpdateEnrichmentTables(
    token: string,
    generationId: number,
    items: BulkEnrichmentUpdateItemDto[],
  ): Promise<BulkUpdateEnrichmentTablesResponseDto> {
    try {
      return await this.adminServiceClient.bulkUpdateEnrichmentTables(token, generationId, items);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error bulk updating enrichment tables for generation ${generationId}`, error.stack);
      throw err;
    }
  }

  async deleteEnrichmentTable(token: string, generationId: number, tableId: number): Promise<DeleteEnrichmentTableResponseDto> {
    try {
      return await this.adminServiceClient.deleteEnrichmentTable(token, generationId, tableId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error deleting enrichment table ${tableId} for generation ${generationId}`, error.stack);
      throw err;
    }
  }
}

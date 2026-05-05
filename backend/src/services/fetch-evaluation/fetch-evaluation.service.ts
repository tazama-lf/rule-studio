import { Injectable, Logger } from '@nestjs/common';
import type { FetchEvaluationResponseDto } from './dto/fetch-evaluation.dto';
import { AdminServiceClient } from '../admin-service-client';

@Injectable()
export class FetchEvaluationService {
  private readonly logger = new Logger(FetchEvaluationService.name);

  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async fetchEvaluation(token: string, tableName?: string, tenantId?: string, totalRecords?: number): Promise<FetchEvaluationResponseDto> {
    this.logger.log('fetchEvaluation called');
    const result = await this.adminServiceClient.getAllEvaluations(token);

    await this.adminServiceClient.saveEvaluationsInResultsTable(token, result.data, tableName);
    console.log("table name iss", tableName);
    console.log("result data iss", result.data);

    await this.adminServiceClient.saveRecordInTrsSimulation({
      simulationId: tableName,
      totalRecord: totalRecords ?? result.data.length,
      recordProcessed: result.data.length,
      simStatus: 'COMPLETED',
      tenantId: tenantId ?? '',
    }, token);

    return { success: true, message: result.message, data: result.data };
  }
}
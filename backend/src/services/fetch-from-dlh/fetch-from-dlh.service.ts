import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../admin-service-client';
import type { FetchFromDlhQueryDto, FetchFromDlhResponseDto } from './dto/fetch-from-dlh.dto';

@Injectable()
export class FetchFromDlhService {
  private readonly logger = new Logger(FetchFromDlhService.name);

  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  private readonly LIMIT = 100; //hardcoded for now since no paginations

  async fetchFromDlh(queries: FetchFromDlhQueryDto[], tenantId: string, token: string): Promise<FetchFromDlhResponseDto> {
    try {
      this.logger.log(`Fetching data from DLH for ${queries.length} query/queries (tenantId: ${tenantId})`);

      const payload = queries.map((q) => ({ txtp: q.txtp, mask_fields: q.mask_fields, startDtTm: q.startDtTm, endDtTm: q.endDtTm, tenantId, limit: this.LIMIT }));

      return await this.adminServiceClient.fetchFromDlh(payload, token) as unknown as FetchFromDlhResponseDto;
    } catch (error) {
      this.logger.error('Error fetching data from DLH', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}


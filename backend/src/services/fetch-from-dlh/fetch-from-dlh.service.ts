import { Injectable, Logger } from '@nestjs/common';
import { DEMS_BASE_URL } from '../../constants/constant';
import { AdminServiceClient } from '../admin-service-client';
import { SendToDemsService } from '../send-to-dems/send-to-dems.service';
import type { FetchFromDlhQueryDto, FetchFromDlhResponseDto } from './dto/fetch-from-dlh.dto';

@Injectable()
export class FetchFromDlhService {
  private readonly logger = new Logger(FetchFromDlhService.name);

  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly sendToDemsService: SendToDemsService,
  ) {}

  private readonly LIMIT = 3; //hardcoded for now since no paginations
  private readonly DEMS_ENDPOINT = DEMS_BASE_URL;

  async fetchFromDlh(queries: FetchFromDlhQueryDto[], tenantId: string, token: string): Promise<FetchFromDlhResponseDto> {
    try {
      this.logger.log(`Fetching data from DLH for ${queries.length} query/queries (tenantId: ${tenantId})`);

      const payload = queries.map((q) => ({ txtp: q.txtp, mask_fields: q.mask_fields, startDtTm: q.startDtTm, endDtTm: q.endDtTm, tenantId, limit: this.LIMIT }));

      const response = await this.adminServiceClient.fetchFromDlh(payload, token) as unknown as FetchFromDlhResponseDto;

      this.logger.log(`Successfully fetched data from DLH for tenantId: ${tenantId}`);

      

      const messages = response.results.flatMap((r, i) => {
        const query = queries[i];
        const endpoint = query?.endpoint_path
          ? `${this.DEMS_ENDPOINT}${query.endpoint_path}`
          : this.DEMS_ENDPOINT;
        return r.data.map((item) => ({
          messageId: item.message_id,
          timestamp: item.credttm_ts,
          endpoint,
          data: item.document,
        }));
      });

      this.logger.log(`Mapped ${messages.length} message(s) from DLH response — enqueueing simulation`);

      const { jobId } = await this.sendToDemsService.enqueueDlhSimulation(messages, token);

      this.logger.log(`Simulation job ${jobId} enqueued`);

      return { ...response, jobId };
    } catch (error) {
      this.logger.error('Error fetching data from DLH', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}


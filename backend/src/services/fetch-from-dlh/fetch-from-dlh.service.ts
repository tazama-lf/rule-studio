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

      const response = await this.adminServiceClient.fetchFromDlh(payload, token) as unknown as Record<string, unknown>;

      this.logger.log(`Successfully fetched data from DLH for tenantId: ${tenantId}`);

      const tableName = response.tableName as string | undefined;

      // Response items are stored under numeric string keys ("0", "1", ...) from spreading the allItems array
      type DlhItem = { message_id: string; credttm_ts: string; document: Record<string, unknown> };
      const items = Object.entries(response)
        .filter(([key]) => !isNaN(Number(key)))
        .map(([, value]) => value as DlhItem);

      // Normalize txtp for matching (e.g. "pacs002" vs "pacs.002.001.12")
      const normalizeTxtp = (s: string) => s.replace(/\./g, '').toLowerCase();
      const endpointByTxtp = new Map(
        queries.map((q) => [normalizeTxtp(q.txtp), q.endpoint_path ? `${this.DEMS_ENDPOINT}${q.endpoint_path}` : this.DEMS_ENDPOINT]),
      );

      const messages = items.map((item) => {
        const normalizedDocTxtp = normalizeTxtp((item.document?.TxTp as string | undefined) ?? '');
        const entry = [...endpointByTxtp.entries()].find(([key]) => normalizedDocTxtp.startsWith(key));
        const endpoint = entry?.[1] ?? this.DEMS_ENDPOINT;
        return {
          messageId: item.message_id,
          timestamp: item.credttm_ts,
          endpoint,
          data: item.document,
        };
      });

      this.logger.log(`Mapped ${messages.length} message(s) from DLH response — enqueueing simulation`);

      const { jobId } = await this.sendToDemsService.enqueueDlhSimulation(messages, token);

      this.logger.log(`Simulation job ${jobId} enqueued`);

      return { tableName, jobId } as FetchFromDlhResponseDto;
    } catch (error) {
      this.logger.error('Error fetching data from DLH', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}


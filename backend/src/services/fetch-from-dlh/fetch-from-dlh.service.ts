import { Injectable, Logger } from '@nestjs/common';
import { DEMS_BASE_URL, DLH_BASE_URL } from '../../constants/constant';
import { AdminServiceClient } from '../admin-service-client';
import { SendToDemsService } from '../send-to-dems/send-to-dems.service';
import type { FetchFromDlhQueryDto, FetchFromDlhResponseDto } from './dto/fetch-from-dlh.dto';

type DlhItem = { message_id: string; credttm_ts: string; document: Record<string, unknown> };

interface DlhPageResponse {
  items: DlhItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

@Injectable()
export class FetchFromDlhService {
  private readonly logger = new Logger(FetchFromDlhService.name);

  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly sendToDemsService: SendToDemsService,
  ) {}

  private readonly PAGE_SIZE = 100;
  private readonly limit = 3;
  private readonly DEMS_ENDPOINT = DEMS_BASE_URL;
  private readonly DLH_ENDPOINT = `${DLH_BASE_URL}/extract/page`;

  private async fetchAllFromDlh(queries: FetchFromDlhQueryDto[], tenantId: string, token: string): Promise<DlhItem[]> {
    const allItems: DlhItem[] = [];

    for (const query of queries) {
      const body = { txtp: query.txtp, mask_fields: query.mask_fields, startDtTm: query.startDtTm, endDtTm: query.endDtTm, tenantId, limit: this.limit };

      // First call to page 1 to determine total number of pages
      const firstResponse = await fetch(`${this.DLH_ENDPOINT}?page=1&size=${this.PAGE_SIZE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!firstResponse.ok) {
        throw new Error(`Failed to fetch data from DLH: ${firstResponse.statusText}`);
      }

      const firstResult = (await firstResponse.json()) as DlhPageResponse;
      const totalPages = firstResult.pages ?? 1;
      allItems.push(...(firstResult.items ?? []));

      this.logger.log(`DLH query [${query.txtp}]: page 1/${totalPages} — ${firstResult.items?.length ?? 0} items`);

      // Fetch remaining pages
      for (let page = 2; page <= totalPages; page++) {
        const pageResponse = await fetch(`${this.DLH_ENDPOINT}?page=${page}&size=${this.PAGE_SIZE}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });

        if (!pageResponse.ok) {
          throw new Error(`Failed to fetch page ${page} from DLH: ${pageResponse.statusText}`);
        }

        const pageResult = (await pageResponse.json()) as DlhPageResponse;
        allItems.push(...(pageResult.items ?? []));

        this.logger.log(`DLH query [${query.txtp}]: page ${page}/${totalPages} — ${pageResult.items?.length ?? 0} items`);
      }
    }

    return allItems;
  }

  async fetchFromDlh(queries: FetchFromDlhQueryDto[], tenantId: string, token: string): Promise<FetchFromDlhResponseDto> {
    try {
      this.logger.log(`Fetching data from DLH for ${queries.length} query/queries (tenantId: ${tenantId})`);

      const rawItems = await this.fetchAllFromDlh(queries, tenantId, token);

      this.logger.log(`Successfully fetched ${rawItems.length} item(s) from DLH for tenantId: ${tenantId}`);

      const { tableName } = await this.adminServiceClient.stageSimulationItems(rawItems as unknown as Array<Record<string, unknown>>, token);

      // Normalize txtp for matching (e.g. "pacs002" vs "pacs.002.001.12")
      const normalizeTxtp = (s: string) => s.replace(/\./g, '').toLowerCase();
      const endpointByTxtp = new Map(
        queries.map((q) => [normalizeTxtp(q.txtp), q.endpoint_path ? `${this.DEMS_ENDPOINT}${q.endpoint_path}` : this.DEMS_ENDPOINT]),
      );

      const messages = rawItems.map((item) => {
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

      // at this point, truncation happens
      await this.adminServiceClient.truncateEvaluationData(token);
      await this.adminServiceClient.saveRecordInTrsSimulation({
        simulationId: tableName ?? undefined,
        totalRecord: messages.length,
        recordProcessed: 0,
        simStatus: 'RUNNING',
        tenantId,
      }, token);

      const { jobId } = await this.sendToDemsService.enqueueDlhSimulation(messages, token, tableName ?? undefined, tenantId, messages.length);

      this.logger.log(`Simulation job ${jobId} enqueued`);

      return { tableName, jobId } as FetchFromDlhResponseDto;
    } catch (error) {
      this.logger.error('Error fetching data from DLH', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}


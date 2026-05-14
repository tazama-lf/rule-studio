import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { EndpointKey, RbacService } from 'src/utils/rbac/rbacHelper';
import { DEMS_BASE_URL, DLH_BASE_URL } from '../../constants/constant';
import { AdminServiceClient } from '../admin-service-client';
import { AuthenticatedUser } from '../auth/auth.types';
import { SendToDemsService } from '../send-to-dems/send-to-dems.service';
import type { DlhCountDto, DlhCountResponse, FetchFromDlhQueryDto, FetchFromDlhResponseDto } from './dto/fetch-from-dlh.dto';
import { SimulationService } from '../simulation/simulation.service';

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
  private readonly rbacService = new RbacService();

  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly sendToDemsService: SendToDemsService,
    private readonly simulationService: SimulationService
  ) { }

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

  private normalizeTxtp(s: string): string {
    return s.replace(/\./g, '').toLowerCase();
  }

  private buildEndpointMaps(queries: FetchFromDlhQueryDto[]): {
    endpointByTxtp: Map<string, string>;
    rawEndpointPathByTxtp: Map<string, string | null>;
  } {
    return {
      endpointByTxtp: new Map(
        queries.map((q) => [this.normalizeTxtp(q.txtp), q.endpoint_path ? `${this.DEMS_ENDPOINT}${q.endpoint_path}` : this.DEMS_ENDPOINT]),
      ),
      rawEndpointPathByTxtp: new Map(
        queries.map((q) => [this.normalizeTxtp(q.txtp), q.endpoint_path ?? null]),
      ),
    };
  }

  private stageItems(rawItems: DlhItem[], rawEndpointPathByTxtp: Map<string, string | null>, tenantId: string, token: string): Promise<{ tableName: string | null }> {
    const itemsWithEndpoint = rawItems.map((item) => {
      const normalizedDocTxtp = this.normalizeTxtp((item.document?.TxTp as string | undefined) ?? '');
      const entry = [...rawEndpointPathByTxtp.entries()].find(([key]) => normalizedDocTxtp.startsWith(key));
      const endpointPath = entry?.[1] ?? null;
      return { ...item, endpointPath, _credttm: item.credttm_ts, _tenantId: tenantId, _msgid: item.message_id } as unknown as Record<string, unknown>;
    });

    return this.adminServiceClient.stageSimulationItems(itemsWithEndpoint, token);
  }

  private buildMessages(rawItems: DlhItem[], endpointByTxtp: Map<string, string>): Array<{ messageId: string; timestamp: string; endpoint: string; data: Record<string, unknown> }> {
    return rawItems.map((item) => {
      const normalizedDocTxtp = this.normalizeTxtp((item.document?.TxTp as string | undefined) ?? '');
      const entry = [...endpointByTxtp.entries()].find(([key]) => normalizedDocTxtp.startsWith(key));
      const endpoint = entry?.[1] ?? this.DEMS_ENDPOINT;
      return {
        messageId: item.message_id,
        timestamp: item.credttm_ts,
        endpoint,
        data: item.document,
      };
    });
  }

  private async enqueueSimulation(
    messages: Array<{ messageId: string; timestamp: string; endpoint: string; data: Record<string, unknown> }>,
    tableName: string | null,
    tenantId: string,
    token: string,
  ): Promise<{ jobId: string }> {
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

    return { jobId };
  }

  async fetchFromDlh(queries: FetchFromDlhQueryDto[], tenantId: string, token: string): Promise<FetchFromDlhResponseDto> {
    try {
      if (!Array.isArray(queries)) {
        throw new Error('Invalid queries parameter: expected an array');
      }

      this.logger.log(`Fetching data from DLH for ${queries.length} query/queries (tenantId: ${tenantId})`);

      const rawItems = await this.fetchAllFromDlh(queries, tenantId, token);
      this.logger.log(`Successfully fetched ${rawItems.length} item(s) from DLH for tenantId: ${tenantId}`);

      const { endpointByTxtp, rawEndpointPathByTxtp } = this.buildEndpointMaps(queries);

      const { tableName } = await this.stageItems(rawItems, rawEndpointPathByTxtp, tenantId, token);

      const messages = this.buildMessages(rawItems, endpointByTxtp);
      this.logger.log(`Mapped ${messages.length} message(s) from DLH response — enqueueing simulation`);

      const { jobId } = await this.enqueueSimulation(messages, tableName, tenantId, token);

      return { tableName, jobId } as FetchFromDlhResponseDto;
    } catch (error) {
      this.logger.error('Error fetching data from DLH', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }


  async getCount(data: DlhCountDto, user: AuthenticatedUser): Promise<DlhCountResponse> {
    const normalizedRole = this.rbacService.getNormalizedRole(user);
    const tier2 = this.rbacService.getTier2({ role: normalizedRole, endpointKey: 'POST /fetch-from-dlh/api/count' as EndpointKey });
    if (!tier2.allowed) {
      throw new ForbiddenException(tier2.reason ?? 'Not authorized to access count');
    }

    const types = await this.simulationService.excludedTypes(user.token.tokenString);

    const existing = types.excludedTypes.filter((item) => item.record_status === 'Exists');

    const uniqueTxtps = Array.from(
      new Map(
        existing
          .filter((item): item is typeof item & { txtp: string } => !!item.txtp)
          .map((item) => [item.txtp, item] as const)
      ).values()
    );

    return await this.adminServiceClient.fetchCountFromDlh(
      {
        data: uniqueTxtps.map((eType) => ({
          txtp: eType.txtp,
          startDtTm: data.startDtTm,
          endDtTm: data.endDtTm,
          tenantId: user.tenantId
        }))
      },
      user.token.tokenString
    );
  }
}



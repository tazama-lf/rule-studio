import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { EndpointKey, RbacService } from 'src/utils/rbac/rbacHelper';
import { DEMS_BASE_URL } from '../../constants/constant';
import { AdminServiceClient } from '../admin-service-client';
import { AuthenticatedUser } from '../auth/auth.types';
import { SendToDemsService } from '../send-to-dems/send-to-dems.service';
import type { DlhCountDto, DlhCountResponse, FetchFromDlhQueryDto, FetchFromDlhResponseDto } from './dto/fetch-from-dlh.dto';
import { SimulationService } from '../simulation/simulation.service';

@Injectable()
export class FetchFromDlhService {
  private readonly logger = new Logger(FetchFromDlhService.name);
  private readonly rbacService = new RbacService();

  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly sendToDemsService: SendToDemsService,
    private readonly simulationService: SimulationService
  ) { }

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
        const endpoint = query.endpoint_path
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

      return {
        status: response.status,
        results: response.results,
        tableName: response.tableName,
        jobId,
      };
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
      new Map(existing.map((item) => [item.txtp, item])).values()
    );

    return await this.adminServiceClient.fetchCountFromDlh(
      {
        data: uniqueTxtps.map((eType) => ({
          txtp: eType.txtp!,
          startDtTm: data.startDtTm,
          endDtTm: data.endDtTm,
          tenantId: user.tenantId
        }))
      },
      user.token.tokenString
    );
  }
}



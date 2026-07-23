import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AdminServiceClient } from '../admin-service-client';
import { SendToDemsService } from '../send-to-dems/send-to-dems.service';
import { DEMS_BASE_URL } from '../../constants/constant';
import type { RerunSimulationResponseDto } from './dto/rerun-simulation.dto';
import type { DirectSimulationMessage } from '../../queues/simulation-queue.constants';

@Injectable()
export class RerunSimulationService {
  private readonly logger = new Logger(RerunSimulationService.name);

  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly sendToDemsService: SendToDemsService,
  ) {}

  async rerunSimulation(tableName: string, token: string): Promise<RerunSimulationResponseDto> {
    this.logger.log(`Re-run requested for simulation table: ${tableName}`);

    const rows = await this.adminServiceClient.getSimulationItems(token, tableName);

    if (rows.length === 0) {
      throw new HttpException(
        `No simulation items found in table "${tableName}". Cannot re-run an empty simulation.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const tenantId = rows[0]?.tenantId ?? 'DEFAULT';

    const messages: DirectSimulationMessage[] = rows.map((row) => {
      // The payload column stores the full DLH item (with `doc`, `credttm`, `document`, etc.).
      // DEMS only accepts the inner transaction document — same as `item.document` in the original DLH flow,
      // which is stored under the `doc` key after staging.
      const rawPayload = row.payload;
      const data = typeof rawPayload.doc === 'object' && rawPayload.doc !== null ? (rawPayload.doc as Record<string, unknown>) : rawPayload;

      return {
        messageId: row.msgid ?? randomUUID(),
        timestamp: row.credttm ?? new Date().toISOString(),
        endpoint: row.endpointPath ? `${DEMS_BASE_URL}${row.endpointPath}` : DEMS_BASE_URL,
        data,
      };
    });

    await this.adminServiceClient.truncateEvaluationData(token);

    await this.adminServiceClient.saveRecordInTrsSimulation(
      {
        simulationId: tableName,
        totalRecord: messages.length,
        recordProcessed: 0,
        simStatus: 'RUNNING',
        tenantId,
      },
      token,
    );

    const { jobId } = await this.sendToDemsService.enqueueDlhSimulation(messages, token, tableName, tenantId, messages.length);

    this.logger.log(`Re-run job ${jobId} enqueued for table ${tableName} (${messages.length} messages)`);

    return { jobId, tableName };
  }
}

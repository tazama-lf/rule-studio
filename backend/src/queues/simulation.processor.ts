import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Job } from 'bullmq';
import { firstValueFrom } from 'rxjs';
import { SIMULATION_QUEUE } from './simulation-queue.constants';
import type { SimulationJobPayload, DirectSimulationMessage } from './simulation-queue.constants';
import { SimulationProgressGateway } from '../gateways/simulation-progress.gateway';
import { AdminServiceClient } from '../services/admin-service-client';
import { FetchEvaluationService } from '../services/fetch-evaluation/fetch-evaluation.service';
import type { SimulationMessage } from '../services/admin-service-client';
import type { ProgressUpdateDto, SimulationLogDto } from '../services/send-to-dems/dto/send-to-dems.dto';

@Processor(SIMULATION_QUEUE, {
  concurrency: 2,
  // Reduce from the 30s defaults so stalled job locks (e.g. from dev-server restarts)
  // are detected and freed within ~15s instead of blocking slots for 30s.
  lockDuration: 15000,
  stalledInterval: 15000,
})
export class SimulationProcessor extends WorkerHost {
  private readonly logger = new Logger(SimulationProcessor.name);

  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly httpService: HttpService,
    private readonly gateway: SimulationProgressGateway,
    private readonly fetchEvaluationService: FetchEvaluationService,
  ) {
    super();
  }

  @OnWorkerEvent('ready')
  onWorkerReady(): void {
    this.logger.log('Simulation worker ready — connected to Redis and listening for jobs');
  }

  @OnWorkerEvent('error')
  onWorkerError(err: Error): void {
    this.logger.error(`Simulation worker error: ${err.message}`, err.stack);
  }

  @OnWorkerEvent('stalled')
  onWorkerStalled(jobId: string): void {
    // Fires when a job's lock expired without completion (typically a dead worker from a dev restart).
    // With stalledInterval: 15000, this is detected within ~15s and the slot is freed.
    this.logger.warn(`Job ${jobId} stalled (lock expired) — slot freed, job will be re-queued or failed`);
  }

  async process(job: Job<SimulationJobPayload>): Promise<void> {
    const { jobId, token, tableNames, messages: directMessages, tableName, tenantId, totalMessages } = job.data;
    const source = directMessages ? `${directMessages.length} direct DLH messages` : `tables: ${(tableNames ?? []).join(', ')}`;
    this.logger.log(`Starting simulation job ${jobId} from ${source}`);

    let lastEmittedPercent = -1;
    let processed = 0;

    try {
      this.gateway.emitProgress(jobId, {
        jobId, progress: 0, processed: 0, total: 0, status: 'running',
        log: this.makeLog('info', 'Initializing simulation environment...'),
      });
    } catch (gatewayErr) {
      this.logger.error(`Initial gateway emit failed for job ${jobId}:`, gatewayErr);
    }

    try {
      let messages: Array<SimulationMessage | DirectSimulationMessage>;

      if (directMessages) {
        // DLH direct-data flow — messages were already mapped and stored in the job payload
        messages = directMessages;
      } else {
        // DB-table flow — fetch messages from admin-service simulation tables
        const messageArrays = await Promise.all(
          (tableNames ?? []).map(async (tableName) => await this.adminServiceClient.getSimulationMessages(token, tableName)),
        );
        messages = messageArrays.flat();
      }

      const total = messages.length;

      // Edge case: no messages to process
      if (total === 0) {
        this.gateway.emitProgress(jobId, {
          jobId, progress: 100, processed: 0, total: 0, status: 'completed',
          log: this.makeLog('success', 'Simulation completed successfully.'),
        });
        this.logger.log(`Simulation job ${jobId} completed with 0 messages`);
        return;
      }

      this.gateway.emitProgress(jobId, {
        jobId, progress: 0, processed: 0, total, status: 'running',
        log: this.makeLog('success', 'Records loaded successfully.'),
      });

      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      this.gateway.emitProgress(jobId, {
        jobId, progress: 0, processed: 0, total, status: 'running',
        log: this.makeLog('info', 'Replay started. Processing transactions in historical sequence...'),
      });

      const MAX_REPLAY_DELAY_MS = 2000; // Cap replay delay — real-world timestamps can be hours/days apart, which would stall worker slots indefinitely

      for (const [i, message] of messages.entries()) {
        // Honour the original inter-message timing from the simulation dataset
        if (i > 0) {
          const rawDelay = new Date(message.timestamp).getTime() - new Date(messages[i - 1].timestamp).getTime();
          const delay = Math.min(rawDelay, MAX_REPLAY_DELAY_MS);
          if (delay > 0) {
            if (rawDelay > MAX_REPLAY_DELAY_MS) {
              this.logger.debug(`Job ${jobId}: original gap ${rawDelay}ms capped to ${MAX_REPLAY_DELAY_MS}ms before message ${message.messageId}`);
            } else {
              this.logger.debug(`Job ${jobId}: waiting ${delay}ms before message ${message.messageId}`);
            }
            // eslint-disable-next-line no-await-in-loop -- Sequential execution is required for timing simulation
            await this.sleep(delay);
          }
        }

        try {
          this.logger.debug(`Job ${jobId}: sending message ${message.messageId} → ${message.endpoint}`);
          // removing DataCache from the payload before sendin
          const { DataCache: _dc, ...payload } = message.data;

          // eslint-disable-next-line no-await-in-loop -- Sequential delivery required to preserve message order
          await firstValueFrom(
            this.httpService.post(message.endpoint, payload, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader,
                'X-Message-Id': message.messageId,
                'X-Timestamp': message.timestamp,
              },
              timeout: 10000,
            }),
          );
          this.logger.debug(`Job ${jobId}: message ${message.messageId} delivered`);
        } catch (error: unknown) {
          // Per-message failures are non-fatal; emit immediately (outside threshold gate) and continue
          const errMsg = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Job ${jobId}: failed to deliver ${message.messageId}: ${errMsg}`);
          this.gateway.emitProgress(jobId, {
            jobId,
            progress: Math.floor((processed / total) * 100),
            processed,
            total,
            status: 'running',
            log: this.makeLog('error', `Failed to deliver message ${message.messageId}: ${errMsg}`),
          });
        }

        processed += 1;
        lastEmittedPercent = this.emitIfThreshold(jobId, processed, total, lastEmittedPercent);
      }

      
      if (tableName) {
        this.logger.log(`Simulation job ${jobId}: triggering evaluation cycle for table ${tableName}`);
        await this.fetchEvaluationService.fetchEvaluation(token, tableName, tenantId, totalMessages ?? total);
      }

      // Always emit a final 100% completed event, regardless of where the last threshold fell
      this.gateway.emitProgress(jobId, {
        jobId, progress: 100, processed: total, total, status: 'completed',
        log: this.makeLog('success', 'Simulation completed successfully.'),
      });
      this.logger.log(`Simulation job ${jobId} completed (${total} messages processed)`);
    } catch (error: unknown) {
      // Outer failure: e.g. could not fetch messages from admin service
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Simulation job ${jobId} failed: ${errMessage}`);

      this.gateway.emitProgress(jobId, {
        jobId,
        progress: lastEmittedPercent < 0 ? 0 : lastEmittedPercent,
        processed,
        total: 0,
        status: 'failed',
        log: this.makeLog('error', `Simulation failed: ${errMessage}`),
      });

      throw error; // re-throw so BullMQ marks the job as failed
    }
  }

  /**
   * Emits a progress update only when the rounded 5% threshold increases.
   * Never emits 100% — that is handled by the completion block to ensure
   * the correct `status: 'completed'` is always the final event.
   *
   * @returns the new lastEmittedPercent (updated only if a new threshold was crossed)
   */
  private emitIfThreshold(jobId: string, processed: number, total: number, lastEmittedPercent: number): number {
    const pct = Math.floor((processed / total) * 100);
    const roundedPct = Math.floor(pct / 5) * 5;

    if (roundedPct > lastEmittedPercent && roundedPct < 100) {
      const update: ProgressUpdateDto = {
        jobId, progress: roundedPct, processed, total, status: 'running',
        log: this.makeLog('warning', 'Rule engine processing... Alerts triggered.'),
      };
      this.gateway.emitProgress(jobId, update);
      return roundedPct;
    }

    return lastEmittedPercent;
  }

  private makeLog(level: SimulationLogDto['level'], message: string): SimulationLogDto {
    return { timestamp: new Date().toISOString(), level, message };
  }

  // eslint-disable-next-line @typescript-eslint/promise-function-async -- Avoiding circular lint conflicts
  private sleep(ms: number): Promise<void> {
    // eslint-disable-next-line promise/avoid-new -- Simple delay utility function
    return new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

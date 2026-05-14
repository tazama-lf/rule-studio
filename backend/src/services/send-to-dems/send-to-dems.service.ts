import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { SIMULATION_QUEUE, SIMULATION_JOB } from '../../queues/simulation-queue.constants';
import type { DirectSimulationMessage } from '../../queues/simulation-queue.constants';
import type { StartSimulationResponseDto } from './dto/send-to-dems.dto';

@Injectable()
export class SendToDemsService {
  private readonly logger = new Logger(SendToDemsService.name);

  constructor(
    @InjectQueue(SIMULATION_QUEUE) private readonly simulationQueue: Queue,
  ) {}

  /**
   * Enqueues a simulation job and returns a jobId immediately.
   * Actual message processing is handled by SimulationProcessor (BullMQ worker).
   * Clients should connect to WebSocket namespace `/simulation` and emit
   * `joinJob` with `{ jobId }` to receive real-time progress updates.
   */
  async enqueueSimulation(token: string, tableNames: string[]): Promise<StartSimulationResponseDto> {
    const jobId = randomUUID();

    await this.simulationQueue.add(SIMULATION_JOB, { jobId, token, tableNames });

    this.logger.log(`Enqueued simulation job ${jobId} for tables: ${tableNames.join(', ')}`);

    return { jobId };
  }

  /**
   * Enqueues a simulation job with messages already fetched from DLH.
   * Messages are sent one by one to their respective endpoints.
   * Track progress via WebSocket namespace `/simulation` with `joinJob { jobId }`.
   */
  async enqueueDlhSimulation(messages: DirectSimulationMessage[], token: string, tableName: string | undefined, tenantId?: string, totalMessages?: number): Promise<StartSimulationResponseDto> {
    const jobId = randomUUID();

    await this.simulationQueue.add(SIMULATION_JOB, { jobId, token, messages, tableName, tenantId, totalMessages });

    this.logger.log(`Enqueued DLH simulation job ${jobId} with ${messages.length} direct messages`);

    return { jobId };
  }
}

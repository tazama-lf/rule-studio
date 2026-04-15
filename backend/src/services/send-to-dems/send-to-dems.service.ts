import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AdminServiceClient } from '../admin-service-client';

export interface MessageDeliveryStatus {
  messageId: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  error?: string;
}

export interface SimulationResult {
  totalMessages: number;
  sentMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  deliveryTracker: MessageDeliveryStatus[];
  simulationDuration: number;
}

@Injectable()
export class SendToDemsService {
  private readonly logger = new Logger(SendToDemsService.name);

  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly httpService: HttpService,
  ) {}

  async startSimulation(token: string): Promise<SimulationResult> {
    const startTime = Date.now();
    const messages = await this.adminServiceClient.getSimulationMessages(token);
    const deliveryTracker: MessageDeliveryStatus[] = [];

    this.logger.log(`Starting DEMS simulation with ${messages.length} messages`);

    messages.forEach((msg) => {
      deliveryTracker.push({
        messageId: msg.messageId,
        timestamp: new Date(msg.timestamp),
        status: 'pending',
      });
    });

    let sentCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;

    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    // sending msgs sequentially with time intervals
    for (const [i, message] of messages.entries()) {
      const trackerIndex = deliveryTracker.findIndex((t) => t.messageId === message.messageId);

      if (i > 0) {
        const currentTimestamp = new Date(message.timestamp).getTime();
        const previousTimestamp = new Date(messages[i - 1].timestamp).getTime();
        const delay = currentTimestamp - previousTimestamp;

        this.logger.log(`Waiting ${delay}ms before sending message ${message.messageId}`);
        // eslint-disable-next-line no-await-in-loop -- Sequential execution required for timing simulation
        await this.sleep(delay);
      }

      try {
        deliveryTracker[trackerIndex].status = 'sent';
        sentCount += 1;

        this.logger.log(`Sending message ${message.messageId} to DEMS endpoint: ${message.endpoint}`);

        // eslint-disable-next-line no-await-in-loop -- Sequential delivery required by user story
        await firstValueFrom(
          this.httpService.post(message.endpoint, message.data, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: authHeader,
              'X-Message-Id': message.messageId,
              'X-Timestamp': message.timestamp,
            },
            timeout: 10000,
          }),
        );

        deliveryTracker[trackerIndex].status = 'delivered';
        deliveredCount += 1;

        this.logger.log(`Message ${message.messageId} delivered successfully to ${message.endpoint}`);
      } catch (error: unknown) {
        deliveryTracker[trackerIndex].status = 'failed';
        deliveryTracker[trackerIndex].error = error instanceof Error ? error.message : 'Unknown error';
        failedCount += 1;

        this.logger.error(
          `Failed to deliver message ${message.messageId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    const endTime = Date.now();
    const simulationDuration = endTime - startTime;

    const result: SimulationResult = {
      totalMessages: messages.length,
      sentMessages: sentCount,
      deliveredMessages: deliveredCount,
      failedMessages: failedCount,
      deliveryTracker,
      simulationDuration,
    };

    this.logger.log(
      `Simulation completed in ${simulationDuration}ms. Sent: ${sentCount}, Delivered: ${deliveredCount}, Failed: ${failedCount}`,
    );

    return result;
  }

  // eslint-disable-next-line @typescript-eslint/promise-function-async -- Avoiding circular lint conflicts
  private sleep(ms: number): Promise<void> {
    // eslint-disable-next-line promise/avoid-new -- Simple delay utility function
    return new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

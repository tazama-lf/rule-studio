import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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

  // Dummy bearer token for DEMS authentication
  private readonly dummyBearerToken =
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI6IjM4NGRjOTM1LTdhMGYtNGI1OS04OWMwLTMwZDg4OWE1MWRiNiIsImlzcyI6Imh0dHA6Ly8xMC4xMC44MC4zMzo4MDgwL3JlYWxtcy90Y3MiLCJzaWQiOiI0NTRlNTlhMC1kOTA0LTRkNDgtOGYwMy1jY2VmYjIzYjU1YTMiLCJleHAiOjE3NzYyMDQzNjksInRva2VuU3RyaW5nIjoiZXlKaGJHY2lPaUpTVXpJMU5pSXNJblI1Y0NJZ09pQWlTbGRVSWl3aWEybGtJaUE2SUNKT05GRlBWa0kyVUMxT1VtTjBaa3htTUd0V04zVmxaemQwWlU1UFVHOTBVbkJzWm5wUk1YUllZWFZSSW4wLmV5SmxlSEFpT2pFM056WXlNRFF6Tmprc0ltbGhkQ0k2TVRjM05qRTJPRE0yT1N3aWFuUnBJam9pWXpSbVpHVXpOVFV0TkdSalppMDBaVFJtTFRneFl6Z3ROREpqT1RZM04yTXlOVE5qSWl3aWFYTnpJam9pYUhSMGNEb3ZMekV3TGpFd0xqZ3dMak16T2pnd09EQXZjbVZoYkcxekwzUmpjeUlzSW1GMVpDSTZJbUZqWTI5MWJuUWlMQ0p6ZFdJaU9pSXpPRFJrWXprek5TMDNZVEJtTFRSaU5Ua3RPRGxqTUMwek1HUTRPRGxoTlRGa1lqWWlMQ0owZVhBaU9pSkNaV0Z5WlhJaUxDSmhlbkFpT2lKMFkzTXRZMnhwWlc1MElpd2ljMlZ6YzJsdmJsOXpkR0YwWlNJNklqUTFOR1UxT1dFd0xXUTVNRFF0TkdRME9DMDRaakF6TFdOalpXWmlNak5pTlRWaE15SXNJbUZqY2lJNklqRWlMQ0poYkd4dmQyVmtMVzl5YVdkcGJuTWlPbHNpTHlvaVhTd2ljbVZoYkcxZllXTmpaWE56SWpwN0luSnZiR1Z6SWpwYkltUmxabUYxYkhRdGNtOXNaWE10ZEdOeklpd2laR1Z0Y3pwM2NtbDBaU0lzSW05bVpteHBibVZmWVdOalpYTnpJaXdpZFcxaFgyRjFkR2h2Y21sNllYUnBiMjRpWFgwc0luSmxjMjkxY21ObFgyRmpZMlZ6Y3lJNmV5SmhZMk52ZFc1MElqcDdJbkp2YkdWeklqcGJJbTFoYm1GblpTMWhZMk52ZFc1MElpd2liV0Z1WVdkbExXRmpZMjkxYm5RdGJHbHVhM01pTENKMmFXVjNMWEJ5YjJacGJHVWlYWDE5TENKelkyOXdaU0k2SW1WdFlXbHNJSEJ5YjJacGJHVWlMQ0p6YVdRaU9pSTBOVFJsTlRsaE1DMWtPVEEwTFRSa05EZ3RPR1l3TXkxalkyVm1Zakl6WWpVMVlUTWlMQ0owWlc1aGJuUmZhV1FpT2lKalltVWlMQ0psYldGcGJGOTJaWEpwWm1sbFpDSTZabUZzYzJVc0luUmxibUZ1ZEY5a1pYUmhhV3h6SWpwYklpOURiMjF0WlhKamFXRnNJRUpoYm1zZ2IyWWdSWFJvYVc5d2FXRWlMQ0l2UTI5dGJXVnlZMmxoYkNCQ1lXNXJJRzltSUVWMGFHbHZjR2xoTDJSbGJYTWlYU3dpY0hKbFptVnljbVZrWDNWelpYSnVZVzFsSWpvaVkySmxMbk41YzNSbGJTNTFjMlZ5UUdkdFlXbHNMbU52YlNKOS5Lb1FmV3JXX01lNWFVR1A2b3ZxSXIxWTJNaHp4VDVWeFRvcTItT3BUb25lX3c2Z3BjcWNWMTdyLVVsRWthUzZXU29DWlYtNFFMLXQ4OXgtYVozN2M1THdWSWp3ZFZHZHhWMlZFZjdJSTV0S2RPNTNLMXo0VzhFTFMwOEJqMm9tem12T0s2QUdIUDBoZ1R3VmlIdUczeHVkZmpBamhtNkRfdFlMZDJjMUV5ZW5mbVU2OUZxS2xfWTFmUlBaeExlZWhYM1RYWVV5QUtJc0ZCZk93Z2RZb1dhY0NEQVRjUks3Y3dkOEd6a3NpWmQzVEVON3VYSXRNdGJQMmhjSmdxQU5xOHVCZUxuQmNFMV9aT1BCMnNYa2l1cmVZRTV1UGt4UUpMdlFxTVppbG5aS0FXSXZzV1Nla1RPQnVRTE5Gdks1T0FFNlRSbXFjMlJYUUdJU2t1NmdGanciLCJjbGFpbXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSIsImRlZmF1bHQtcm9sZXMtdGNzIiwiZGVtczp3cml0ZSIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXSwidGVuYW50SWQiOiJjYmUiLCJpYXQiOjE3NzYxNjg0Nzh9.mnRt9_G88dlkvNrW1oqp2jhKUC5jX0E22DquMymrYtCBY_jM8bEiUc_-XMWBC3IcF2JnnBgO4vSEFgSHBZjxoUBpHQ31YMkhJawnKiA3Nw-ZmNzkJQBDIpUC_Nm0HwbxFk2jgq4YgoVDrm8SXXtNG5iH2maTxHySiOl4lMHy9otXRkp_mG-t1FyzjE_SlnRMj5zO0b5jwgJaXBXImiGDXiPE0TiHDj3S0bTrdz-7oGzTJWg_Zf2xABXjqy4QVtYM17id5flAYDCQecvdQRUhWsImukK7NptIgweFCcc1TQA3rnARD8SXU7OvP6q6JZuz4z52ZdyL8t2f3rZhd-_qwA';

  // Dummy JSON objects for simulation
  private readonly dummyMessages = {
    simulationData: [
      {
        messageId: 'msg_001',
        timestamp: '2024-04-14T10:00:00.000Z',
        endpoint: 'http://localhost:3002/dems-engine/cbe/1.0.0/iso/test_transaction',
        data: {
          msgid: 'msg001',
          amount: 1000,
          currency: 'PKR',
          country: 'PK',
          cnic: '1234-5678-910',
          date: '10-10-2025'
        },
      },
      {
        messageId: 'msg_002',
        timestamp: '2024-04-14T10:00:03.000Z',
        endpoint: 'http://localhost:3002/dems-engine/cbe/1.0.0/iso/test_transaction',
        data: {
          msgid: 'msg002',
          amount: 2500,
          currency: 'PKR',
          country: 'PK',
          cnic: '9876-5432-109',
          date: '11-10-2025'
        },
      },
      {
        messageId: 'msg_003',
        timestamp: '2024-04-14T10:00:08.000Z',
        endpoint: 'http://localhost:3002/dems-engine/cbe/1.0.0/iso/test_transaction',
        data: {
          msgid: 'msg003',
          amount: 5000,
          currency: 'PKR',
          country: 'PK',
          cnic: '5555-4444-333',
          date: '12-10-2025'
        },
      },
    ],
  };

  constructor(private readonly httpService: HttpService) {}

  /**
   * Start the simulation - sends messages to DEMS one by one with proper time intervals
   */
  async startSimulation(): Promise<SimulationResult> {
    const startTime = Date.now();
    const messages = this.dummyMessages.simulationData;
    const deliveryTracker: MessageDeliveryStatus[] = [];

    this.logger.log(`Starting DEMS simulation with ${messages.length} messages`);

    // Initialize delivery tracker
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

    // Send messages sequentially with time intervals
    // Sequential processing is required by user story to maintain original timing intervals
    for (const [i, message] of messages.entries()) {
      const trackerIndex = deliveryTracker.findIndex((t) => t.messageId === message.messageId);

      // Calculate delay for this message
      if (i > 0) {
        const currentTimestamp = new Date(message.timestamp).getTime();
        const previousTimestamp = new Date(messages[i - 1].timestamp).getTime();
        const delay = currentTimestamp - previousTimestamp;

        this.logger.log(`Waiting ${delay}ms before sending message ${message.messageId}`);
        // eslint-disable-next-line no-await-in-loop -- Sequential execution required for timing simulation
        await this.sleep(delay);
      }

      try {
        // Update status to sent
        deliveryTracker[trackerIndex].status = 'sent';
        sentCount += 1;

        this.logger.log(`Sending message ${message.messageId} to DEMS endpoint: ${message.endpoint}`);

        // Send message to DEMS endpoint
        // eslint-disable-next-line no-await-in-loop -- Sequential delivery required by user story
        await firstValueFrom(
          this.httpService.post(message.endpoint, message.data, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.dummyBearerToken}`,
              'X-Message-Id': message.messageId,
              'X-Timestamp': message.timestamp,
            },
            timeout: 10000, // 10 second timeout
          }),
        );

        // Mark as delivered if successful
        deliveryTracker[trackerIndex].status = 'delivered';
        deliveredCount += 1;

        this.logger.log(`Message ${message.messageId} delivered successfully to ${message.endpoint}`);
      } catch (error: unknown) {
        // Handle individual message failure
        deliveryTracker[trackerIndex].status = 'failed';
        deliveryTracker[trackerIndex].error = error instanceof Error ? error.message : 'Unknown error';
        failedCount += 1;

        this.logger.error(`Failed to deliver message ${message.messageId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue with next message instead of stopping the simulation
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

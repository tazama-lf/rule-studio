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

  // Dummy JSON objects for simulation
  private readonly dummyMessages = {
    simulationData: [
      {
        messageId: 'msg_001',
        timestamp: '2024-04-14T10:00:00.000Z',
        data: {
          TxTp: 'pacs.008.001.10',
          FIToFICstmrCdtTrf: {
            GrpHdr: {
              MsgId: 'TXN001',
              CreDtTm: '2024-04-14T10:00:00.000Z',
              NbOfTxs: '1',
            },
            CdtTrfTxInf: {
              PmtId: {
                EndToEndId: 'E2E001',
                TxId: 'TXN001',
              },
              IntrBkSttlmAmt: {
                Ccy: 'USD',
                value: '1000.00',
              },
              ChrgBr: 'SLEV',
              Dbtr: {
                Nm: 'John Doe',
                Id: {
                  PrvtId: {
                    DtAndPlcOfBirth: {
                      BirthDt: '1985-05-15',
                      CityOfBirth: 'New York',
                      CtryOfBirth: 'US',
                    },
                  },
                },
              },
              Cdtr: {
                Nm: 'Jane Smith',
                Id: {
                  PrvtId: {
                    DtAndPlcOfBirth: {
                      BirthDt: '1990-08-22',
                      CityOfBirth: 'Los Angeles',
                      CtryOfBirth: 'US',
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        messageId: 'msg_002',
        timestamp: '2024-04-14T10:00:03.000Z',
        data: {
          TxTp: 'pacs.008.001.10',
          FIToFICstmrCdtTrf: {
            GrpHdr: {
              MsgId: 'TXN002',
              CreDtTm: '2024-04-14T10:00:03.000Z',
              NbOfTxs: '1',
            },
            CdtTrfTxInf: {
              PmtId: {
                EndToEndId: 'E2E002',
                TxId: 'TXN002',
              },
              IntrBkSttlmAmt: {
                Ccy: 'EUR',
                value: '2500.00',
              },
              ChrgBr: 'SLEV',
              Dbtr: {
                Nm: 'Alice Johnson',
                Id: {
                  PrvtId: {
                    DtAndPlcOfBirth: {
                      BirthDt: '1988-03-10',
                      CityOfBirth: 'London',
                      CtryOfBirth: 'GB',
                    },
                  },
                },
              },
              Cdtr: {
                Nm: 'Bob Wilson',
                Id: {
                  PrvtId: {
                    DtAndPlcOfBirth: {
                      BirthDt: '1992-12-05',
                      CityOfBirth: 'Manchester',
                      CtryOfBirth: 'GB',
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        messageId: 'msg_003',
        timestamp: '2024-04-14T10:00:08.000Z',
        data: {
          TxTp: 'pacs.008.001.10',
          FIToFICstmrCdtTrf: {
            GrpHdr: {
              MsgId: 'TXN003',
              CreDtTm: '2024-04-14T10:00:08.000Z',
              NbOfTxs: '1',
            },
            CdtTrfTxInf: {
              PmtId: {
                EndToEndId: 'E2E003',
                TxId: 'TXN003',
              },
              IntrBkSttlmAmt: {
                Ccy: 'ZAR',
                value: '15000.00',
              },
              ChrgBr: 'SLEV',
              Dbtr: {
                Nm: 'Michael Brown',
                Id: {
                  PrvtId: {
                    DtAndPlcOfBirth: {
                      BirthDt: '1987-07-20',
                      CityOfBirth: 'Cape Town',
                      CtryOfBirth: 'ZA',
                    },
                  },
                },
              },
              Cdtr: {
                Nm: 'Sarah Davis',
                Id: {
                  PrvtId: {
                    DtAndPlcOfBirth: {
                      BirthDt: '1995-11-18',
                      CityOfBirth: 'Johannesburg',
                      CtryOfBirth: 'ZA',
                    },
                  },
                },
              },
            },
          },
        },
      },
    ],
  };

  // DEMS Dev endpoint configuration
  private readonly demsDevEndpoint = process.env.DEMS_DEV_ENDPOINT ?? 'http://localhost:3000/dems/ingest';

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

        this.logger.log(`Sending message ${message.messageId} to DEMS Dev endpoint`);

        // Send message to DEMS Dev endpoint
        // eslint-disable-next-line no-await-in-loop -- Sequential delivery required by user story
        await firstValueFrom(
          this.httpService.post(this.demsDevEndpoint, message.data, {
            headers: {
              'Content-Type': 'application/json',
              'X-Message-Id': message.messageId,
              'X-Timestamp': message.timestamp,
            },
            timeout: 10000, // 10 second timeout
          }),
        );

        // Mark as delivered if successful
        deliveryTracker[trackerIndex].status = 'delivered';
        deliveredCount += 1;

        this.logger.log(`Message ${message.messageId} delivered successfully`);
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

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AdminServiceClient } from '../../admin-service-client';
import { EphemeralEnvService } from '../ephemeral-env/ephemeral-env.service';
import {
  RunSimulationDto,
  RunSimulationResponseDto,
  RuleResult,
  SampleTriggerMessage,
  SampleTriggerMessagesResponse,
} from './dto/run-simulation.dto';
import { SimulationSuiteResponseDto } from '../suites/dto';
import { Client as PgClient } from 'pg';

@Injectable()
export class RunSimulationService {
  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly ephemeralEnvService: EphemeralEnvService,
    private readonly httpService: HttpService,
  ) { }

  async runSimulation(token: string, body: RunSimulationDto): Promise<RunSimulationResponseDto> {
    const { suiteId, generationId } = body;
    const simName = `run-sim-${suiteId}-gen-${generationId}-${Date.now()}`;

    // 1. Fetch suite (rule_name, rule_version, rule_config) and trigger messages in parallel
    const [suiteResp, triggerResp] = await Promise.all([
      this.adminServiceClient.getSimulationSuiteById(token, suiteId),
      this.adminServiceClient.getSampleTriggerMessages<SampleTriggerMessagesResponse>(token, generationId),
    ]);

    const suite = (suiteResp as SimulationSuiteResponseDto).suite;
    const ruleName: string = suite.rule_name ?? '';
    const version: string = suite.rule_version ?? 'rc';
    const ruleConfig: Record<string, unknown> = suite.rule_config ?? {};

    if (!ruleName) {
      throw new Error(`Suite ${suiteId} has no rule_name set`);
    }

    const triggerMessages: SampleTriggerMessage[] = triggerResp?.data ?? [];


    if (triggerMessages.length === 0) {
      return { success: true, results: [] };
    }

    // 2. Spawn ephemeral environment
    const simInfo = await this.ephemeralEnvService.spawn(simName, { ruleName, version });
    const { ports, natsSubject, natsConsumer, functionName } = simInfo;


    try {
      // 3. Apply rule config to postgres
      const ruleBaseName = ruleName.replace(/^rule-/, '');
      console.log('service level ', ruleConfig)
      await this.applyRuleConfig(ports.pg, ruleName, version, ruleConfig);

      // 4. Send each trigger payload through nats-utilities and collect results
      // const natsUtilsBase = `http://localhost:${ports.natsUtils}`;
      const natsUtilsBase = 'http://10.10.80.37:4000';
      const results: RuleResult[] = await this.publishTriggerMessages(
        natsUtilsBase,
        triggerMessages,
        natsSubject,
        natsConsumer,
        functionName,
        ruleBaseName,
        version,
      );

      return { success: true, results };
    } finally {
      await this.ephemeralEnvService.destroy(simName).catch(() => undefined);
    }
  }

  private async applyRuleConfig(
    pgPort: number,
    ruleName: string,
    version: string,
    ruleConfig: Record<string, unknown>,
  ): Promise<void> {
    // const ruleBaseName = ruleName;
    const rulePayload = {
      ...ruleConfig
    };


    const client = new PgClient({
      host: 'localhost',
      port: pgPort,
      user: 'postgres',
      password: 'unused',
      database: 'configuration',
    });

    try {
      await client.connect();
      await client.query(
        `INSERT INTO "rule" ("configuration") VALUES($1)`,
        [JSON.stringify(rulePayload)],
      );

    } catch (_err) {
      // handle silently
    } finally {

      await client.end().catch(() => undefined);
    }
  }

  private async publishTriggerMessages(
    natsUtilsBase: string,
    triggerMessages: SampleTriggerMessage[],
    natsSubject: string,
    natsConsumer: string,
    functionName: string,
    ruleBaseName: string,
    version: string,
  ): Promise<RuleResult[]> {
    const results: RuleResult[] = [];

    for (const msg of triggerMessages) {
      const payload = msg.payload;
      console.log(payload);


      const new_payload = { "Txtp": "amounttransaction", "MsgId": payload.msgId, "Payload": payload, "TenantId": "cbe" };

      console.log(new_payload)


      let result: unknown = null;
      let error: string | undefined;

      // The rule-executer expects: { transaction, DataCache, networkMap }
      // msg.payload is the raw transaction object from the payload template.
      // nats-utilities protobuf-encodes the message without normalising Payload,
      // so BaseMessage transactions must have Payload.Json (a JSON string) rather
      // than Payload as a plain object, otherwise proto encoding drops the nested data.
      // const rawTxn = msg.payload as Record<string, unknown>;
      // const transaction = this.normalisePayload(rawTxn);

      // console.log('the trasnsaction is ', JSON.stringify(transaction))

      // const txTp =
      //   (rawTxn['TxTp'] as string | undefined)
      //   ?? `${msg.txtp}.${msg.txtp_version}`;

      const natsMessage = {
        transaction: new_payload,
        DataCache: {},
        networkMap: {
          "cfg": "1.0.0",
          "name": "Public 701 Network Map",
          "active": true,
          "messages": [
            {
              "id": "123@1.0.0",
              "cfg": "1.0.0",
              "txTp": "test_transaction",
              "typologies": [
                {
                  "id": "test-processor@1.0.0",
                  "cfg": "test@1.0.0",
                  "rules": [
                    {
                      "id": "cbe-rule-test@1.0.0",
                      "cfg": "1.0.0"
                    }
                  ],
                  "tenantId": "cbe"
                }
              ]
            },
            {
              "id": "123@1.0.0",
              "cfg": "1.0.0",
              "txTp": "fable004",
              "typologies": [
                {
                  "id": "story-processor@1.0.0",
                  "cfg": "fables@1.0.0",
                  "rules": [
                    {
                      "id": "cbe-rule-fable004@1.0.0",
                      "cfg": "1.0.0"
                    }
                  ],
                  "tenantId": "cbe"
                }
              ]
            },
            {
              "id": "135@1.0.0",
              "cfg": "1.0.0",
              "txTp": "amount",
              "typologies": [
                {
                  "id": "new-test-rule-processor@1.0.0",
                  "cfg": "new-test-rule@1.0.0",
                  "rules": [
                    {
                      "id": "cbe-rule-new@1.0.0",
                      "cfg": "1.0.0"
                    }
                  ],
                  "tenantId": "cbe"
                }
              ]
            },
            {
              "id": "999@1.0.0",
              "cfg": "1.0.0",
              "txTp": "kashif123",
              "typologies": [
                {
                  "id": "kashif-processor@1.0.0",
                  "cfg": "kashif@1.0.0",
                  "rules": [
                    {
                      "id": "cbe-rule-kashif@1.0.0",
                      "cfg": "1.0.0"
                    }
                  ],
                  "tenantId": "cbe"
                }
              ]
            },
            {
              "id": "456@1.0.0",
              "cfg": "1.0.0",
              "txTp": "amount_processor_transaction",
              "typologies": [
                {
                  "id": "test-processor@1.0.0",
                  "cfg": "test@1.0.0",
                  "rules": [
                    {
                      "id": "cbe-rule-test@1.0.0",
                      "cfg": "1.0.0"
                    }
                  ],
                  "tenantId": "cbe"
                }
              ]
            },
            {
              "id": "987@1.0.0",
              "cfg": "1.0.0",
              "txTp": "country",
              "typologies": [
                {
                  "id": "cases-processor@1.0.0",
                  "cfg": "cases@1.0.0",
                  "rules": [
                    {
                      "id": "cbe-cases-rule@1.0.0",
                      "cfg": "1.0.0"
                    },
                    {
                      "id": "cbe-rule-cnic@1.0.0",
                      "cfg": "1.0.0"
                    }
                  ],
                  "tenantId": "cbe"
                }
              ]
            },
            {
              "id": "004@1.0.0",
              "cfg": "1.0.0",
              "txTp": "dems_pacs002",
              "typologies": [
                {
                  "id": "typology-processor@1.0.0",
                  "cfg": "999@1.0.0",
                  "rules": [
                    {
                      "id": "EFRuP@1.0.0",
                      "cfg": "none"
                    },
                    {
                      "id": "901@1.0.0",
                      "cfg": "1.0.0"
                    },
                    {
                      "id": "902@1.0.0",
                      "cfg": "1.0.0"
                    }
                  ],
                  "tenantId": "cbe"
                }
              ]
            },
            {
              "id": "619@1.0.0",
              "cfg": "1.0.0",
              "txTp": "amounttransaction",
              "typologies": [
                {
                  "id": "amount-typology-processor@1.0.0",
                  "cfg": "atp@1.0.0",
                  "rules": [
                    {
                      "id": "cbe-rule-amount@1.0.0",
                      "cfg": "1.0.0"
                    }
                  ],
                  "tenantId": "cbe"
                }
              ]
            }
          ],
          "tenantId": "cbe"
        },
      };

      console.log(natsMessage)

      console.log('the nats subject is ', natsSubject)
      console.log('the nats consumer is ', natsConsumer)
      console.log('the url is', natsUtilsBase)
      try {
        const response = await firstValueFrom(this.httpService.post(`${natsUtilsBase}/natsPublish`, {
          // destination: natsSubject,
          // consumer: natsConsumer,
          // functionName,
          // awaitReply: true,
          // message: natsMessage

          "functionName": "",
          "awaitReply": true,
          "destination": "sub-rule-cbe-rule-amount@1.0.0",
          "consumer": "pub-rule-cbe-rule-amount@1.0.0",
          "message": {
            "metaData": {
              "tenantId": "cbe",
              "timestamp": "2026-06-11T06:46:25.710Z",
              "correlationId": "55fd1ca3-4cdc-4fdb-815b-dbf968e633de",
              "transactionType": "amounttransaction"
            },
            "DataCache": {},
            "networkMap": {
              "cfg": "1.0.0",
              "name": "Public 701 Network Map",
              "active": true,
              "messages": [
                {
                  "id": "123@1.0.0",
                  "cfg": "1.0.0",
                  "txTp": "test_transaction",
                  "typologies": [
                    {
                      "id": "test-processor@1.0.0",
                      "cfg": "test@1.0.0",
                      "rules": [
                        {
                          "id": "cbe-rule-test@1.0.0",
                          "cfg": "1.0.0"
                        }
                      ],
                      "tenantId": "cbe"
                    }
                  ]
                },
                {
                  "id": "123@1.0.0",
                  "cfg": "1.0.0",
                  "txTp": "fable004",
                  "typologies": [
                    {
                      "id": "story-processor@1.0.0",
                      "cfg": "fables@1.0.0",
                      "rules": [
                        {
                          "id": "cbe-rule-fable004@1.0.0",
                          "cfg": "1.0.0"
                        }
                      ],
                      "tenantId": "cbe"
                    }
                  ]
                },
                {
                  "id": "135@1.0.0",
                  "cfg": "1.0.0",
                  "txTp": "amount",
                  "typologies": [
                    {
                      "id": "new-test-rule-processor@1.0.0",
                      "cfg": "new-test-rule@1.0.0",
                      "rules": [
                        {
                          "id": "cbe-rule-new@1.0.0",
                          "cfg": "1.0.0"
                        }
                      ],
                      "tenantId": "cbe"
                    }
                  ]
                },
                {
                  "id": "999@1.0.0",
                  "cfg": "1.0.0",
                  "txTp": "kashif123",
                  "typologies": [
                    {
                      "id": "kashif-processor@1.0.0",
                      "cfg": "kashif@1.0.0",
                      "rules": [
                        {
                          "id": "cbe-rule-kashif@1.0.0",
                          "cfg": "1.0.0"
                        }
                      ],
                      "tenantId": "cbe"
                    }
                  ]
                },
                {
                  "id": "456@1.0.0",
                  "cfg": "1.0.0",
                  "txTp": "amount_processor_transaction",
                  "typologies": [
                    {
                      "id": "test-processor@1.0.0",
                      "cfg": "test@1.0.0",
                      "rules": [
                        {
                          "id": "cbe-rule-test@1.0.0",
                          "cfg": "1.0.0"
                        }
                      ],
                      "tenantId": "cbe"
                    }
                  ]
                },
                {
                  "id": "987@1.0.0",
                  "cfg": "1.0.0",
                  "txTp": "country",
                  "typologies": [
                    {
                      "id": "cases-processor@1.0.0",
                      "cfg": "cases@1.0.0",
                      "rules": [
                        {
                          "id": "cbe-cases-rule@1.0.0",
                          "cfg": "1.0.0"
                        },
                        {
                          "id": "cbe-rule-cnic@1.0.0",
                          "cfg": "1.0.0"
                        }
                      ],
                      "tenantId": "cbe"
                    }
                  ]
                },
                {
                  "id": "004@1.0.0",
                  "cfg": "1.0.0",
                  "txTp": "dems_pacs002",
                  "typologies": [
                    {
                      "id": "typology-processor@1.0.0",
                      "cfg": "999@1.0.0",
                      "rules": [
                        {
                          "id": "EFRuP@1.0.0",
                          "cfg": "none"
                        },
                        {
                          "id": "901@1.0.0",
                          "cfg": "1.0.0"
                        },
                        {
                          "id": "902@1.0.0",
                          "cfg": "1.0.0"
                        }
                      ],
                      "tenantId": "cbe"
                    }
                  ]
                },
                {
                  "id": "619@1.0.0",
                  "cfg": "1.0.0",
                  "txTp": "amounttransaction",
                  "typologies": [
                    {
                      "id": "amount-typology-processor@1.0.0",
                      "cfg": "atp@1.0.0",
                      "rules": [
                        {
                          "id": "cbe-rule-amount@1.0.0",
                          "cfg": "1.0.0"
                        }
                      ],
                      "tenantId": "cbe"
                    }
                  ]
                }
              ],
              "tenantId": "cbe"
            },
            "transaction": {
              "TxTp": "amounttransaction",
              "MsgId": "TXN-20260610-0001",
              "Payload": {
                "msgId": "TXN-20260610-0001",
                "amount": 100,
                "sender": {
                  "bankName": "Meezan Bank",
                  "fullName": "Ali Khan",
                  "personId": "P-1001",
                  "phoneNumber": "+923001234567",
                  "accountNumber": "PK001234567890"
                },
                "status": "PENDING",
                "channel": "MOBILE_APP",
                "purpose": "Personal transfer",
                "currency": "PKR",
                "metadata": {
                  "deviceId": "device-abc-123",
                  "location": "Karachi, Pakistan",
                  "ipAddress": "192.168.1.10"
                },
                "receiver": {
                  "bankName": "HBL",
                  "fullName": "Ahmed Raza",
                  "personId": "P-2001",
                  "phoneNumber": "+923211234567",
                  "accountNumber": "PK009876543210"
                },
                "transactionType": "TRANSFER",
                "transactionDateTime": "2026-06-10T14:30:00+05:00"
              },
              "TenantId": "cbe"
            }
          }
        }
        ));

        const responseBody = response.data as { message: string; data: unknown };
        result = responseBody.data ?? responseBody;
      } catch (err) {
        error = (err as Error).message;
      }

      results.push({
        trigger_txtp_config_id: msg.trigger_txtp_config_id,
        txtp: new_payload.Txtp,
        payload: new_payload,
        result,
        ...(error !== undefined ? { error } : {}),

      });

    }
    return results;
  }

  /**
   * Normalise a transaction for protobuf encoding via nats-utilities.
   * nats-utilities calls FRMSMessage.create/encode directly (no normalisation).
   * For BaseMessage transactions the proto expects Payload.Json (a JSON string),
   * not Payload as a plain object — otherwise proto encoding drops the nested data.
   * pacs.002 transactions (FIToFIPmtSts.GrpHdr + TxInfAndSts) are left as-is.
   */
  private normalisePayload(txn: Record<string, unknown>): Record<string, unknown> {
    const payload = txn['Payload'];
    if (payload === undefined || payload === null) return txn;
    if (typeof payload === 'object' && 'Json' in (payload as Record<string, unknown>)) return txn;
    return {
      ...txn,
      Payload: {
        Json: typeof payload === 'string' ? payload : JSON.stringify(payload),
      },
    };
  }
}

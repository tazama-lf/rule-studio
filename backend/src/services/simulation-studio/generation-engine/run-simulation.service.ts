import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
      const natsUtilsBase = `http://localhost:${ports.natsUtils}`;

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
      // await this.ephemeralEnvService.destroy(simName).catch(() => undefined);
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
      // id: ruleConfig['id'] ?? `${ruleBaseName}@${version}`,
      // cfg: ruleConfig['cfg'] ?? version,
      // tenantId: ruleConfig['tenantId'] ?? 'DEFAULT',
    };

    console.log('service level neeche ', rulePayload)

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

      console.log("ok scene")
    } catch (_err) {
      // handle silently
      console.log("off scene")
    } finally {

      console.log("finally scene")
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
      let result: unknown = null;
      let error: string | undefined;

      // The rule-executer expects: { transaction, DataCache, networkMap }
      // msg.payload is the raw transaction object from the payload template.
      // nats-utilities protobuf-encodes the message without normalising Payload,
      // so BaseMessage transactions must have Payload.Json (a JSON string) rather
      // than Payload as a plain object, otherwise proto encoding drops the nested data.
      const rawTxn = msg.payload as Record<string, unknown>;
      const transaction = this.normalisePayload(rawTxn);

      const txTp =
        (rawTxn['TxTp'] as string | undefined)
        ?? `${msg.txtp}.${msg.txtp_version}`;

      const natsMessage = {
        transaction,
        DataCache: {},
        networkMap: {
          active: true,
          messages: [
            {
              id: 'channel@1.0.0',
              cfg: '1.0.0',
              txTp,
              typologies: [
                {
                  id: 'typology-processor@1.0.0',
                  cfg: '999@1.0.0',
                  rules: [{ id: `${ruleBaseName}@${version}`, cfg: version }],
                },
              ],
            },
          ],
        },
      };
      try {
        const response = await fetch(`${natsUtilsBase}/natsPublish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination: natsSubject,
            consumer: natsConsumer,
            functionName,
            awaitReply: true,
            message: natsMessage,
          }),

        });

        if (!response.ok) {
          throw new InternalServerErrorException(
            `nats-utilities responded with HTTP ${response.status}`,
          );
        }


        const responseBody = (await response.json()) as { message: string; data: unknown };
        result = responseBody.data ?? responseBody;
      } catch (err) {
        error = (err as Error).message;
      }

      results.push({
        trigger_txtp_config_id: msg.trigger_txtp_config_id,
        txtp: msg.txtp,
        payload: msg.payload,
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

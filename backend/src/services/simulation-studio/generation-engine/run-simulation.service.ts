import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Client as PgClient } from 'pg';
import { AdminServiceClient } from '../../admin-service-client';
import { EphemeralEnvService } from '../ephemeral-env/ephemeral-env.service';
import {
  RunSimulationDto,
  RunSimulationResponseDto,
  RuleResult,
  SampleTriggerMessage,
  SampleTriggerMessagesResponse,
} from './dto/run-simulation.dto';

const STATIC_NETWORK_MAP = {
  cfg: '1.0.0',
  name: 'Public 701 Network Map',
  active: true,
  messages: [
    {
      id: '123@1.0.0',
      cfg: '1.0.0',
      txTp: 'test_transaction',
      typologies: [
        {
          id: 'test-processor@1.0.0',
          cfg: 'test@1.0.0',
          rules: [{ id: 'cbe-rule-test@1.0.0', cfg: '1.0.0' }],
          tenantId: 'cbe',
        },
      ],
    },
    {
      id: '123@1.0.0',
      cfg: '1.0.0',
      txTp: 'fable004',
      typologies: [
        {
          id: 'story-processor@1.0.0',
          cfg: 'fables@1.0.0',
          rules: [{ id: 'cbe-rule-fable004@1.0.0', cfg: '1.0.0' }],
          tenantId: 'cbe',
        },
      ],
    },
    {
      id: '135@1.0.0',
      cfg: '1.0.0',
      txTp: 'amount',
      typologies: [
        {
          id: 'new-test-rule-processor@1.0.0',
          cfg: 'new-test-rule@1.0.0',
          rules: [{ id: 'cbe-rule-new@1.0.0', cfg: '1.0.0' }],
          tenantId: 'cbe',
        },
      ],
    },
    {
      id: '999@1.0.0',
      cfg: '1.0.0',
      txTp: 'kashif123',
      typologies: [
        {
          id: 'kashif-processor@1.0.0',
          cfg: 'kashif@1.0.0',
          rules: [{ id: 'cbe-rule-kashif@1.0.0', cfg: '1.0.0' }],
          tenantId: 'cbe',
        },
      ],
    },
    {
      id: '456@1.0.0',
      cfg: '1.0.0',
      txTp: 'amount_processor_transaction',
      typologies: [
        {
          id: 'test-processor@1.0.0',
          cfg: 'test@1.0.0',
          rules: [{ id: 'cbe-rule-test@1.0.0', cfg: '1.0.0' }],
          tenantId: 'cbe',
        },
      ],
    },
    {
      id: '987@1.0.0',
      cfg: '1.0.0',
      txTp: 'country',
      typologies: [
        {
          id: 'cases-processor@1.0.0',
          cfg: 'cases@1.0.0',
          rules: [
            { id: 'cbe-cases-rule@1.0.0', cfg: '1.0.0' },
            { id: 'cbe-rule-cnic@1.0.0', cfg: '1.0.0' },
          ],
          tenantId: 'cbe',
        },
      ],
    },
    {
      id: '004@1.0.0',
      cfg: '1.0.0',
      txTp: 'dems_pacs002',
      typologies: [
        {
          id: 'typology-processor@1.0.0',
          cfg: '999@1.0.0',
          rules: [
            { id: 'EFRuP@1.0.0', cfg: 'none' },
            { id: '901@1.0.0', cfg: '1.0.0' },
            { id: '902@1.0.0', cfg: '1.0.0' },
          ],
          tenantId: 'cbe',
        },
      ],
    },
    {
      id: '619@1.0.0',
      cfg: '1.0.0',
      txTp: 'amounttransaction',
      typologies: [
        {
          id: 'amount-typology-processor@1.0.0',
          cfg: 'atp@1.0.0',
          rules: [{ id: 'cbe-rule-amount@1.0.0', cfg: '1.0.0' }],
          tenantId: 'cbe',
        },
      ],
    },
  ],
  tenantId: 'cbe',
};

@Injectable()
export class RunSimulationService {
  private readonly logger = new Logger(RunSimulationService.name);

  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly ephemeralEnvService: EphemeralEnvService,
    private readonly httpService: HttpService,
  ) {}

  async runSimulation(token: string, body: RunSimulationDto): Promise<RunSimulationResponseDto> {
    const { suiteId, generationId } = body;
    const simName = `run-sim-${suiteId}-gen-${generationId}-${Date.now()}`;

    const [suiteResp, triggerResp] = await Promise.all([
      this.adminServiceClient.getSimulationSuiteById(token, suiteId),
      this.adminServiceClient.getSampleTriggerMessages<SampleTriggerMessagesResponse>(token, generationId),
    ]);

    const { suite } = suiteResp;
    const ruleName = suite.rule_name;
    const version = suite.rule_version ?? 'rc';
    const ruleConfig = suite.rule_config;

    if (!ruleName) {
      throw new Error(`Suite ${suiteId} has no rule_name set`);
    }

    const { data: triggerMessages } = triggerResp;
    if (triggerMessages.length === 0) {
      return { success: true, results: [] };
    }

    const simInfo = await this.ephemeralEnvService.spawn(simName, { ruleName, version });
    const { ports } = simInfo;

    try {
      await this.applyRuleConfig(ports.pg, ruleConfig);

      // Intentionally hardcoded endpoint and routing for now, per current local testing flow.
      const natsUtilsBase = 'http://10.10.80.37:4000';
      const results = await this.publishTriggerMessages(natsUtilsBase, triggerMessages, token, generationId);

      return { success: true, results };
    } finally {
      await this.ephemeralEnvService.destroy(simName).catch(() => undefined);
    }
  }

  private async applyRuleConfig(pgPort: number, ruleConfig: Record<string, unknown>): Promise<void> {
    const client = new PgClient({
      host: 'localhost',
      port: pgPort,
      user: 'postgres',
      password: 'unused',
      database: 'configuration',
    });

    try {
      await client.connect();
      await client.query('INSERT INTO "rule" ("configuration") VALUES($1)', [JSON.stringify(ruleConfig)]);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Failed to apply rule config to ephemeral postgres: ${err.message}`);
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  private async publishTriggerMessages(
    natsUtilsBase: string,
    triggerMessages: SampleTriggerMessage[],
    token: string,
    generationId: number,
  ): Promise<RuleResult[]> {
    this.logger.log(JSON.stringify(triggerMessages));
    const publishTasks = triggerMessages.map(async (msg): Promise<RuleResult> => {
      const { payload } = msg;
      this.logger.log('the payload is ', JSON.stringify(payload));
      const msgId = typeof payload.msgId === 'string' ? payload.msgId : '';

      const mappedPayload = {
        TxTp: msg.txtp,
        MsgId: msgId,
        Payload: payload,
        TenantId: 'cbe', // extract from JWT and keep it here
      };

      let result: unknown = null;
      let error: string | undefined;

      const natsMessage = {
        transaction: mappedPayload,
        DataCache: {},
        networkMap: STATIC_NETWORK_MAP,
      };

      const requestBody = {
        functionName: '',
        awaitReply: true,
        destination: 'sub-rule-cbe-rule-amount@1.0.0',
        consumer: 'pub-rule-cbe-rule-amount@1.0.0',
        message: natsMessage,
      };

      try {
        const response = await firstValueFrom(this.httpService.post(`${natsUtilsBase}/natsPublish`, requestBody, { timeout: 15_000 }));
        const responseBody = response.data as { message?: string; data?: unknown };
        result = responseBody.data ?? responseBody;
      } catch (err) {
        error = (err as Error).message;
      }

      const ruleResult = result !== null && typeof result === 'object' ? (result as Record<string, unknown>) : { value: result };
      await this.adminServiceClient.saveRunResult(token, {
        gen_id: generationId,
        trigger_id: msg.trigger_txtp_config_id,
        rule_result: ruleResult,
      });

      return {
        trigger_txtp_config_id: msg.trigger_txtp_config_id,
        txtp: mappedPayload.TxTp,
        payload: mappedPayload,
        result,
        ...(error === undefined ? {} : { error }),
      };
    });

    return await Promise.all(publishTasks);
  }
}

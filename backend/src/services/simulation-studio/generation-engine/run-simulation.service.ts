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

interface RuleConfigBand {
  subRuleRef: string;
  reason?: string;
  upperLimit?: number;
  lowerLimit?: number;
}

interface RuleConfig {
  id: string;
  cfg: string;
  tenantId: string;
  config?: {
    bands?: RuleConfigBand[];
  };
}

function buildTypology(ruleConfig: RuleConfig, ruleName: string, ruleVersion: string) {
  const typologyId = `${ruleName}-typology-processor@${ruleVersion}`;
  const typologyCfg = `atp@${ruleVersion}`;
  const termId = `v${ruleName}at100at100`;

  const bands: RuleConfigBand[] = ruleConfig.config?.bands ?? [];
  const wghts = [
    { ref: '.err', wght: '0' },
    ...bands.map((band) => ({ ref: band.subRuleRef, wght: '100' })),
  ];

  return {
    id: typologyId,
    cfg: typologyCfg,
    rules: [
      {
        id: ruleConfig.id,
        cfg: ruleConfig.cfg,
        wghts,
        termId,
      },
    ],
    tenantId: ruleConfig.tenantId,
    workflow: {
      alertThreshold: 100,
      interdictionThreshold: 400,
    },
    expression: ['Add', termId],
    typology_name: `${ruleName}-typology-processor`,
  };
}

function buildNetworkMap(ruleConfig: RuleConfig, ruleName: string, ruleVersion: string, txTp: string) {
  const typology = buildTypology(ruleConfig, ruleName, ruleVersion);

  return {
    cfg: '1.0.0',
    name: `Public ${ruleName} Network Map`,
    active: true,
    messages: [
      {
        id: '619@1.0.0',
        cfg: '1.0.0',
        txTp,
        typologies: [
          {
            id: typology.id,
            cfg: typology.cfg,
            rules: typology.rules.map((r) => ({ id: r.id, cfg: r.cfg })),
            tenantId: typology.tenantId,
          },
        ],
      },
    ],
    tenantId: ruleConfig.tenantId,
  };
}

@Injectable()
export class RunSimulationService {
  private readonly logger = new Logger(RunSimulationService.name);

  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly ephemeralEnvService: EphemeralEnvService,
    private readonly httpService: HttpService,
  ) { }

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
      this.logger.log('the nats util url is: ', natsUtilsBase)
      const results = await this.publishTriggerMessages(natsUtilsBase, triggerMessages, token, generationId, ruleName, version, ruleConfig as unknown as RuleConfig);

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
    ruleName: string,
    version: string,
    ruleConfig: RuleConfig,
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

      // Build dynamic NATS routing parameters based on ruleName and version
      const destination = `sub-rule-${ruleName}@${version}`;
      const consumer = `pub-rule-${ruleName}@${version}`;
      const functionName = ruleName;

      const natsMessage = {
        transaction: mappedPayload,
        DataCache: {},
        networkMap: buildNetworkMap(ruleConfig, ruleName, version, msg.txtp),
      };

      const requestBody = {
        functionName,
        awaitReply: true,
        destination,
        consumer,
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

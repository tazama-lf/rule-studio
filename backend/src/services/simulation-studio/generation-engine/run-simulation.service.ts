import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { faker } from '@faker-js/faker';
import { firstValueFrom } from 'rxjs';
import { Client as PgClient } from 'pg';
import { AdminServiceClient } from '../../admin-service-client';
import { EphemeralEnvService } from '../ephemeral-env/ephemeral-env.service';
import { MsgSampleGenerationService } from '../../msg-sample-generation/msg-sample-generation.service';
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

interface RuleConfigCaseExpression {
  value: unknown;
  reason?: string;
  subRuleRef: string;
}

interface RuleConfigCases {
  alternative: { subRuleRef: string; reason?: string };
  expressions: RuleConfigCaseExpression[];
}

interface RuleConfig {
  id: string;
  cfg: string;
  tenantId: string;
  // Bands and cases are mutually exclusive on a rule config.
  config?: {
    bands?: RuleConfigBand[];
    cases?: RuleConfigCases;
  };
}

type Typology = ReturnType<typeof buildTypology>;
type NetworkMap = ReturnType<typeof buildNetworkMap>;

function extractSubRuleRefs(ruleConfig: RuleConfig): string[] {
  // Cases take precedence over bands. Order matters: alternative first, then expressions in their declared order.
  const cases = ruleConfig.config?.cases;
  if (cases) {
    return [cases.alternative.subRuleRef, ...cases.expressions.map((e) => e.subRuleRef)];
  }
  return (ruleConfig.config?.bands ?? []).map((band) => band.subRuleRef);
}

function buildTypology(ruleConfig: RuleConfig, ruleName: string, ruleVersion: string) {
  const typologyId = `${ruleName}-typology-processor@${ruleVersion}`;
  const typologyCfg = `atp@${ruleVersion}`;
  const termId = `v${ruleName}at100at100`;

  // Ordinal weights: each subRuleRef gets index*100. `.err` is always 0 and is not part of the ordinal sequence.
  const subRuleRefs = extractSubRuleRefs(ruleConfig);
  const wghts: { ref: string; wght: number }[] = [
    { ref: '.err', wght: 0 },
    ...subRuleRefs.map((ref, i) => ({ ref, wght: i * 100 })),
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
      interdictionThreshold: 100,
    },
    expression: ['Add', termId],
    typology_name: `${ruleName}-typology-processor`,
  };
}

function buildNetworkMap(typology: Typology, ruleName: string, tenantId: string, txTp: string) {
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
    tenantId,
  };
}

@Injectable()
export class RunSimulationService {
  private readonly logger = new Logger(RunSimulationService.name);

  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly ephemeralEnvService: EphemeralEnvService,
    private readonly msgSampleGenerationService: MsgSampleGenerationService,
    private readonly httpService: HttpService,
  ) {}

  async runSimulation(token: string, tenantId: string, body: RunSimulationDto): Promise<RunSimulationResponseDto> {
    const { suiteId, generationId } = body;
    const simName = `run-sim-${suiteId}-gen-${generationId}-${Date.now()}`;

    await this.adminServiceClient.updateGenerationStatus(token, generationId, { status: 'RUNNING' });

    try {
      const [suiteResp, triggerResp, sampleResp] = await Promise.all([
        this.adminServiceClient.getSimulationSuiteById(token, suiteId),
        this.adminServiceClient.getSampleTriggerMessages<SampleTriggerMessagesResponse>(token, generationId),
        this.adminServiceClient.getSampleMessages(token, generationId),
      ]);

      const { suite } = suiteResp;
      const ruleName = suite.rule_name;
      // TODO(client-input): version is taken from the suite's rule_version for now; the user-provided rule_config may have its own version we should honour. Confirm with client before changing.
      const version = suite.rule_version ?? 'rc';
      const ruleConfig = suite.rule_config as unknown as RuleConfig;
      // suite.primary_txtp is the contract source for the run-level network map's txTp.
      // The DTO currently marks it optional ([suites/dto/index.ts:209-212]) — that is a defect
      // to tighten later; for now we enforce the invariant at runtime.
      const primaryTxTp = suite.primary_txtp;

      if (!ruleName) {
        throw new Error(`Suite ${suiteId} has no rule_name set`);
      }
      if (!primaryTxTp) {
        throw new Error(`Suite ${suiteId} has no primary_txtp set`);
      }

      const { data: triggerMessages } = triggerResp;
      if (triggerMessages.length === 0) {
        // No triggers to publish — run is vacuously complete.
        await this.markGenerationStatus(token, generationId, 'COMPLETED');
        return { success: true, results: [] };
      }

      // Build artifacts once for the whole run. Both typology and network map are
      // shared by the DB seed AND every NATS publish — there is one shape per run.
      const typology = buildTypology(ruleConfig, ruleName, version);
      const networkMap = buildNetworkMap(typology, ruleName, tenantId, primaryTxTp);
      // One correlationId per run, shared by every trigger publish in this simulation.
      const correlationId = faker.string.uuid();

      // Phase 1 of the spawn: Postgres + network only. Seeding happens in the gap
      // before the runtime stack joins so the rule processor never sees an unseeded DB.
      const pgInfo = await this.ephemeralEnvService.spawnPostgres(simName, { ruleName, version });
      const pgPort = pgInfo.ports.pg;

      try {
        await this.seedConfigArtifacts(pgPort, { ruleConfig, typology, networkMap });

        // Generate and seed the database with sample data
        const dbScript = await this.msgSampleGenerationService.generateDbScript(sampleResp, token);
        await this.seedDatabaseWithScript(pgPort, dbScript);

        // TODO(Phase 3.2): table-count + row-count validation gate. Fail-fast here means we tear down Postgres without ever spawning the runtime stack.

        // Phase 2 of the spawn: NATS, Valkey, rule processor, nats-utilities join the network.
        await this.ephemeralEnvService.spawnRuntime(simName);

        // Intentionally hardcoded endpoint and routing for now, per current local testing flow.
        const natsUtilsBase = 'http://10.10.80.37:4000';
        this.logger.log('the nats util url is: ', natsUtilsBase);
        const results = await this.publishTriggerMessages(
          natsUtilsBase,
          triggerMessages,
          token,
          generationId,
          ruleName,
          version,
          networkMap,
          primaryTxTp,
          tenantId,
          correlationId,
        );

        await this.markGenerationStatus(token, generationId, 'COMPLETED');
        return { success: true, results };
      } finally {
        await this.ephemeralEnvService.destroy(simName).catch(() => undefined);
      }
    } catch (err) {
      await this.markGenerationStatus(token, generationId, 'FAILED');
      throw err;
    }
  }

  private async markGenerationStatus(token: string, generationId: number, status: 'COMPLETED' | 'FAILED'): Promise<void> {
    // Status update failures shouldn't shadow the run's real outcome — log and swallow.
    try {
      await this.adminServiceClient.updateGenerationStatus(token, generationId, { status });
    } catch (err) {
      this.logger.warn(`Failed to update generation ${generationId} status to ${status}: ${(err as Error).message}`);
    }
  }

  private async seedConfigArtifacts(
    pgPort: number,
    artifacts: { ruleConfig: RuleConfig; typology: Typology; networkMap: NetworkMap },
  ): Promise<void> {
    // The core migrations seed default rows into rule/typology/network_map. We truncate
    // first so our rows are the only ones present, then insert. Everything is wrapped in
    // a single transaction so the ephemeral DB is never half-seeded.
    const client = new PgClient({
      host: 'localhost',
      port: pgPort,
      user: 'postgres',
      password: 'unused',
      database: 'configuration',
    });

    try {
      await client.connect();
      await client.query('BEGIN');
      await client.query('TRUNCATE TABLE public.rule, public.typology, public.network_map');
      await client.query('INSERT INTO public.rule (configuration) VALUES ($1::jsonb)', [JSON.stringify(artifacts.ruleConfig)]);
      await client.query('INSERT INTO public.typology (configuration) VALUES ($1::jsonb)', [JSON.stringify(artifacts.typology)]);
      await client.query('INSERT INTO public.network_map (configuration) VALUES ($1::jsonb)', [JSON.stringify(artifacts.networkMap)]);
      await client.query('COMMIT');

      // Phase 3.2 — verification gate: every config table should hold exactly one row.
      // Warn-only by design — a mismatch may hint at upstream data issues but should not
      // abort a run that may still produce useful results.
      const counts = await client.query<{ table: string; n: string }>(
        `SELECT 'rule' AS table, COUNT(*)::text AS n FROM public.rule
         UNION ALL SELECT 'typology', COUNT(*)::text FROM public.typology
         UNION ALL SELECT 'network_map', COUNT(*)::text FROM public.network_map`,
      );
      const actual = Object.fromEntries(counts.rows.map((r) => [r.table, Number(r.n)]));
      const expected = { rule: 1, typology: 1, network_map: 1 };
      const mismatch = (Object.keys(expected) as (keyof typeof expected)[]).some((k) => actual[k] !== expected[k]);
      if (mismatch) {
        this.logger.warn(
          `[seedConfigArtifacts] expected rule=${expected.rule} typology=${expected.typology} network_map=${expected.network_map}; ` +
          `actual rule=${actual.rule ?? 0} typology=${actual.typology ?? 0} network_map=${actual.network_map ?? 0}`,
        );
        this.logger.warn('[seedConfigArtifacts] count mismatch — see warning above');
      }

      this.logger.log('Seeded config artifacts (rule, typology, network_map)');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      const err = error as Error;
      this.logger.error(`Failed to seed config artifacts: ${err.message}`);
      throw error;
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  private async seedDatabaseWithScript(pgPort: number, dbScript: string): Promise<void> {
    if (!dbScript || dbScript.trim() === '') {
      this.logger.warn('No database script provided, skipping seed');
      return;
    }

    const client = new PgClient({
      host: 'localhost',
      port: pgPort,
      user: 'postgres',
      password: 'unused',
      database: 'raw_history',
    });

    try {
      await client.connect();
      await client.query(dbScript);
      this.logger.log('Successfully seeded database with generated script');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to seed database with generated script: ${err.message}`);
      throw error;
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
    networkMap: NetworkMap,
    primaryTxTp: string,
    tenantId: string,
    correlationId: string,
  ): Promise<RuleResult[]> {
    this.logger.log(JSON.stringify(triggerMessages));
    const publishTasks = triggerMessages.map(async (msg): Promise<RuleResult> => {
      const { payload } = msg;
      this.logger.log('the payload is ', JSON.stringify(payload));
      const msgId = typeof payload.msgId === 'string' ? payload.msgId : '';

      // Surface mismatches between the trigger's txtp and the suite's primary_txtp.
      // Triggers are expected to be primary txtp payloads; a mismatch means either a
      // malformed trigger or a related-txtp accidentally promoted into the trigger list.
      // Warn-only by design — see plan Q4 for Phase 3.1.
      if (msg.txtp !== primaryTxTp) {
        this.logger.warn(`Trigger ${msg.trigger_txtp_config_id} txtp '${msg.txtp}' does not match suite primary_txtp '${primaryTxTp}'`);
      }

      const mappedPayload = {
        TxTp: msg.txtp,
        MsgId: msgId,
        Payload: payload,
        TenantId: tenantId,
      };

      let result: unknown = null;
      let error: string | undefined;

      // Build dynamic NATS routing parameters based on ruleName and version
      const destination = `sub-rule-${ruleName}@${version}`;
      const consumer = `pub-rule-${ruleName}@${version}`;
      const functionName = ruleName;

      const natsMessage = {
        metaData: {
          tenantId,
          timestamp: new Date().toISOString(),
          correlationId,
          transactionType: msg.txtp,
        },
        DataCache: {},
        networkMap,
        transaction: mappedPayload,
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
        rule_result: ruleResult.ruleResult as Record<string, unknown>,
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

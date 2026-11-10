import { Logger } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { getContainerRuntimeClient } from 'testcontainers';
import type { DeployProfile, ImageProfile } from './artifact-profile';
import { type Message, msgIdOf, sampleTransactions } from './rule-samples';
import { followDockerStream, registryAuth } from './rule-pipeline.service';
import type { RuleAlert, RuleContainerState, RuleDeploymentStatus, RuleDeployResult, RuleResultView, RuleRunResult } from './rule-pipeline.types';

interface Outcome {
  subRuleRef: string;
  reason?: string;
}

export interface RuleConfiguration {
  id: string;
  cfg: string;
  config?: {
    bands?: Outcome[];
    cases?: { alternative: Outcome; expressions: Outcome[] };
    exitConditions?: Outcome[];
  };
  [key: string]: unknown;
}

export interface RuleTarget {
  ruleId: string;
  version: string;
  tenantId: string;
  txtp: string;
  config: RuleConfiguration;
}

interface ConfigRef {
  id: string;
  cfg: string;
}

interface NetworkMapTypology extends ConfigRef {
  rules: ConfigRef[];
}

interface NetworkMapMessage extends ConfigRef {
  txTp: string;
  typologies: NetworkMapTypology[];
}

export interface NetworkMap {
  active: boolean;
  cfg: string;
  tenantId: string;
  messages: NetworkMapMessage[];
  [key: string]: unknown;
}

export interface Typology extends ConfigRef {
  tenantId: string;
  desc: string;
  typology_name: string;
  rules: Array<ConfigRef & { termId: string; wghts: Array<{ ref: string; wght: number }> }>;
  workflow: { alertThreshold: number; interdictionThreshold: number; flowProcessor?: string };
  expression: string[];
}

const TYPOLOGY_ID = 'typology-processor';
const FLOW_PROCESSOR = 'EFRuP@';
const FLOW_PROCESSOR_REFS = ['.err', 'override', 'non-overridable-block', 'overridable-block', 'none'];
const TIMEOUT_MS = 15_000;
const CONNECTED = 'Connected to nats';

export const ruleRef = (target: Pick<RuleTarget, 'ruleId' | 'version'>): string => `${target.ruleId}@${target.version}`;
export const typologyCfg = (target: Pick<RuleTarget, 'ruleId' | 'version'>): string => `trs-${target.ruleId}@${target.version}`;
export const containerName = (target: Pick<RuleTarget, 'ruleId' | 'tenantId'>): string =>
  `trs-${target.tenantId}-rule-${target.ruleId}`.toLowerCase().replace(/[^a-z0-9_.-]/g, '-');
const termId = (id: string, cfg: string): string => `v${id.replace('@', 'at').replace(/\./g, '')}at${cfg.replace(/\./g, '')}`;

export function reasonOf(config: RuleConfiguration, result: Pick<RuleResultView, 'subRuleRef' | 'reason'>): string | undefined {
  const { bands, cases, exitConditions } = config.config ?? {};
  const known = [...(exitConditions ?? []), ...(bands ?? []), ...(cases ? [cases.alternative, ...cases.expressions] : [])];
  return result.reason ?? known.find((o) => o.subRuleRef === result.subRuleRef)?.reason;
}

async function containerState(
  state: { Running: boolean; Restarting: boolean; StartedAt: string },
  logsSince: (since: number) => Promise<string>,
): Promise<RuleContainerState> {
  if (state.Restarting) return 'restarting';
  if (!state.Running) return 'stopped';
  const since = Math.floor(new Date(state.StartedAt).getTime() / 1000);
  return (await logsSince(since).catch(() => '')).includes(CONNECTED) ? 'deployed' : 'starting';
}

function outcomes(config: RuleConfiguration): { exits: string[]; results: string[] } {
  const { bands, cases, exitConditions } = config.config ?? {};
  const results = cases ? [cases.alternative.subRuleRef, ...cases.expressions.map((e) => e.subRuleRef)] : (bands ?? []).map((b) => b.subRuleRef);
  return { exits: (exitConditions ?? []).map((e) => e.subRuleRef), results };
}

export function ruleTypology(target: RuleTarget, flowProcessor?: ConfigRef): Typology {
  const id = ruleRef(target);
  const term = termId(id, target.config.cfg);
  const { exits, results } = outcomes(target.config);
  return {
    id: TYPOLOGY_ID,
    cfg: typologyCfg(target),
    tenantId: target.tenantId,
    desc: `Rule Studio typology for rule ${id}`,
    typology_name: `Rule Studio ${id}`,
    rules: [
      {
        id,
        cfg: target.config.cfg,
        termId: term,
        wghts: [
          { ref: '.err', wght: 0 },
          ...exits.map((ref) => ({ ref, wght: 0 })),
          ...results.map((ref, i) => ({ ref, wght: (i + 1) * 100 })),
        ],
      },
      ...(flowProcessor
        ? [{ ...flowProcessor, termId: termId(flowProcessor.id, flowProcessor.cfg), wghts: FLOW_PROCESSOR_REFS.map((ref) => ({ ref, wght: 0 })) }]
        : []),
    ],
    workflow: { alertThreshold: 200, interdictionThreshold: 400, ...(flowProcessor ? { flowProcessor: flowProcessor.id } : {}) },
    expression: ['Add', term],
  };
}

export function flowProcessorOf(map: NetworkMap, txtp: string): ConfigRef | undefined {
  const rule = map.messages
    .find((m) => m.txTp === txtp)
    ?.typologies.flatMap((t) => t.rules)
    .find((r) => r.id.startsWith(FLOW_PROCESSOR));
  return rule && { id: rule.id, cfg: rule.cfg };
}

export function withRuleTypology(map: NetworkMap, target: RuleTarget, typology: Typology): { map: NetworkMap; replaced: string[] } {
  const own = (t: NetworkMapTypology): boolean => t.cfg.startsWith(`trs-${target.ruleId}@`);
  const replaced = [...new Set(map.messages.flatMap((m) => m.typologies.filter(own).map((t) => t.cfg)))].filter((cfg) => cfg !== typology.cfg);
  const entry: NetworkMapTypology = { id: typology.id, cfg: typology.cfg, rules: typology.rules.map(({ id, cfg }) => ({ id, cfg })) };
  const messages = map.messages.map((m) => ({ ...m, typologies: m.typologies.filter((t) => !own(t)) }));
  const index = messages.findIndex((m) => m.txTp === target.txtp);
  if (index === -1) messages.push({ id: `${target.txtp}@${map.cfg}`, cfg: map.cfg, txTp: target.txtp, typologies: [entry] });
  else messages[index].typologies.push(entry);
  return { map: { ...map, messages }, replaced };
}

export function replayNetworkMap(target: RuleTarget): NetworkMap {
  return {
    active: true,
    cfg: '1.0.0',
    tenantId: target.tenantId,
    messages: [
      {
        id: `${target.txtp}@1.0.0`,
        cfg: '1.0.0',
        txTp: target.txtp,
        typologies: [{ id: TYPOLOGY_ID, cfg: `trs-run-${ruleRef(target)}`, rules: [{ id: ruleRef(target), cfg: target.config.cfg }] }],
      },
    ],
  };
}

function messageFor(messages: Message[], txtp: string): Message {
  const message = messages.find((m) => m.TxTp === txtp);
  if (!message) throw new Error(`There is no sample ${txtp} message; end-to-end runs support ${messages.map((m) => m.TxTp).join(' and ')} rules`);
  return message;
}

async function poll<T>(deadline: number, probe: () => Promise<T | undefined>): Promise<T | undefined> {
  const value = await probe();
  if (value !== undefined || Date.now() >= deadline) return value;
  await sleep(1000);
  return await poll(deadline, probe);
}

function parse(text: string): unknown {
  try {
    return text ? JSON.parse(text) : undefined;
  } catch {
    return text;
  }
}

function readEnvFile(path?: string): string[] {
  if (!path) return [];
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='));
}

export class RuleDeployer {
  private readonly logger = new Logger(RuleDeployer.name);

  constructor(
    private readonly profile: DeployProfile,
    private readonly image: ImageProfile,
  ) {}

  async deploy(target: RuleTarget, image: { ref: string; digest?: string }): Promise<RuleDeployResult> {
    if (!image.digest) throw new Error('The image has no registry digest, so it cannot be deployed from the registry');
    const pinned = `${image.ref.replace(/:[^:/]+$/, '')}@${image.digest}`;
    const name = containerName(target);
    await this.startContainer(name, pinned, target);

    const token = await this.login();
    await this.ensureRuleConfig(token, target);
    const map = await this.activeNetworkMap(token);
    const typology = ruleTypology(target, flowProcessorOf(map, target.txtp));
    const path = `/configuration/typology/${TYPOLOGY_ID}/${encodeURIComponent(typology.cfg)}`;
    const exists = (await this.admin(token, 'GET', path)).status === 200;
    await this.adminOk(token, exists ? 'PUT' : 'POST', exists ? path : '/configuration/typology', typology, `Saving typology ${typology.cfg}`);
    const next = withRuleTypology(map, target, typology);
    await this.adminOk(token, 'PUT', `/configuration/network_map/${encodeURIComponent(map.cfg)}`, next.map, `Updating network map ${map.cfg}`);
    await Promise.all(next.replaced.map(async (cfg) => await this.admin(token, 'DELETE', `/configuration/typology/${TYPOLOGY_ID}/${encodeURIComponent(cfg)}`)));
    await this.adminOk(token, 'POST', '/configuration/network_map/reload', { reloadMode: 'broadcast' }, 'Reloading the network map');
    this.logger.log(`Deployed ${ruleRef(target)} as ${name} (${pinned}) with typology ${typology.cfg} in network map ${map.cfg}`);
    return { ok: true, container: name, network: this.profile.network, image: pinned, typology: typology.cfg, networkMap: map.cfg };
  }

  async status(target: Pick<RuleTarget, 'ruleId' | 'version' | 'tenantId'>): Promise<RuleDeploymentStatus> {
    const name = containerName(target);
    const { dockerode } = (await getContainerRuntimeClient()).container;
    const container = dockerode.getContainer(name);
    const info = await container.inspect().catch(() => undefined);
    if (!info) return { enabled: true, deployed: false, network: this.profile.network };
    const rule = info.Config.Labels['tazama.trs.rule'];
    const state = await containerState(info.State, async (since) =>
      (await container.logs({ stdout: true, stderr: true, since, until: since + 300 })).toString('utf8'),
    );
    return {
      enabled: true,
      deployed: true,
      state,
      restarts: info.RestartCount,
      exitCode: info.State.Running ? undefined : info.State.ExitCode,
      current: rule === ruleRef(target),
      container: name,
      network: this.profile.network,
      rule,
      image: info.Config.Image,
      startedAt: info.State.StartedAt,
    };
  }

  async runRule(target: RuleTarget, msgId?: string, timeoutMs = 30_000): Promise<RuleRunResult> {
    await this.assertRunning(target);
    const token = await this.login();
    const id = msgId ?? (await this.evaluateSample(token, target, 60_000)).msgId;
    const evaluated = await this.evaluatedMessage(token, id, target);
    const started = Date.now();
    const response = await fetch(`${this.profile.natsUtilsUrl}/natsPublish`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        functionName: `trs-run-${target.ruleId}`,
        awaitReply: true,
        destination: `sub-rule-${ruleRef(target)}`,
        consumer: `pub-rule-${ruleRef(target)}`,
        message: { ...evaluated, networkMap: replayNetworkMap(target), metaData: { prcgTmDp: 0, prcgTmED: 0 } },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = parse(await response.text()) as { data?: { transaction?: Record<string, unknown>; ruleResult?: RuleResultView } } | undefined;
    if (!response.ok) throw new Error(`nats-utilities answered HTTP ${response.status}: ${JSON.stringify(body).slice(0, 300)}`);
    const reply = body?.data;
    if (!reply?.ruleResult?.subRuleRef) throw new Error(`The rule replied without a result: ${JSON.stringify(body).slice(0, 300)}`);
    if (reply.transaction && msgIdOf(reply.transaction) !== id) throw new Error('The result of another transaction arrived first; run it again');
    const result = reply.ruleResult;
    const reason = reasonOf(target.config, result);
    const failed = result.subRuleRef === '.err';
    return { kind: 'rule', ok: !failed, msgId: id, ranAt: new Date(started).toISOString(), tookMs: Date.now() - started, result, reason, error: failed ? reason : undefined };
  }

  async endToEnd(target: RuleTarget, timeoutMs = 60_000): Promise<RuleRunResult> {
    await this.assertRunning(target);
    const started = Date.now();
    const { msgId, alert } = await this.evaluateSample(await this.login(), target, timeoutMs);
    const typologies = alert.report.tadpResult?.typologyResult ?? [];
    const result = typologies.find((t) => t.cfg === typologyCfg(target))?.ruleResults?.find((r) => r.id === ruleRef(target));
    if (!result) {
      const seen = typologies.map((t) => t.cfg).join(', ');
      throw new Error(`The evaluation of ${msgId} has no result from ${ruleRef(target)} (typologies: ${seen || 'none'})`);
    }
    const reason = reasonOf(target.config, result);
    return {
      kind: 'e2e',
      ok: result.subRuleRef !== '.err',
      msgId,
      ranAt: new Date(started).toISOString(),
      tookMs: Date.now() - started,
      result,
      reason,
      alert,
      error: result.subRuleRef === '.err' ? reason : undefined,
    };
  }

  private async evaluateSample(token: string, target: RuleTarget, timeoutMs: number): Promise<{ msgId: string; alert: RuleAlert }> {
    const messages = sampleTransactions();
    const msgId = msgIdOf(messageFor(messages, target.txtp)) ?? '';
    await messages.reduce(async (previous, message) => {
      await previous;
      await this.submit(token, message);
    }, Promise.resolve());
    return { msgId, alert: await this.waitForEvaluation(token, msgId, timeoutMs) };
  }

  private async evaluatedMessage(token: string, msgId: string, target: RuleTarget): Promise<{ transaction: Message; DataCache: Record<string, unknown> }> {
    const { status, data } = await this.admin(token, 'GET', `/reports/getreportbymsgid?msgid=${encodeURIComponent(msgId)}`);
    const evaluated = (data as { data?: { transaction?: Message; dataCache?: Record<string, unknown> } } | undefined)?.data;
    if (status !== 200 || !evaluated?.transaction) throw new Error(`Tazama has not evaluated a message with id ${msgId}`);
    const { transaction, dataCache } = evaluated;
    if (transaction.TxTp !== target.txtp) throw new Error(`${msgId} is a ${transaction.TxTp}; rule ${ruleRef(target)} handles ${target.txtp}`);
    return { transaction, DataCache: dataCache ?? {} };
  }

  private async assertRunning(target: RuleTarget): Promise<void> {
    const status = await this.status(target);
    if (status.state === 'deployed' && status.current) return;
    if (!status.deployed) throw new Error(`${ruleRef(target)} is not deployed; deploy it first`);
    if (!status.current) throw new Error(`${status.container} runs ${status.rule ?? 'another rule'}; deploy ${ruleRef(target)} first`);
    throw new Error(`${status.container} is ${status.state ?? 'not running'}; redeploy it or check its logs`);
  }

  private async submit(token: string, message: Message): Promise<void> {
    const response = await fetch(`${this.profile.tmsUrl}/v1/evaluate/iso20022/${message.TxTp}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`TMS rejected the ${message.TxTp}: HTTP ${response.status} ${(await response.text()).slice(0, 300)}`);
    await sleep(500);
  }

  private async startContainer(name: string, image: string, target: RuleTarget): Promise<void> {
    const { dockerode } = (await getContainerRuntimeClient()).container;
    const pull = await dockerode.pull(image, { authconfig: registryAuth(this.image) ?? {} });
    await followDockerStream(dockerode.modem, pull, `docker pull ${image}`);
    await dockerode
      .getContainer(name)
      .remove({ force: true })
      .catch(() => undefined);
    const container = await dockerode.createContainer({
      name,
      Image: image,
      Env: [
        ...readEnvFile(this.profile.envFile),
        `RULE_NAME=${target.ruleId}`,
        `RULE_VERSION=${target.version}`,
        `FUNCTION_NAME=rule-${target.ruleId}`,
        `APM_SERVICE_NAME=rule-${target.ruleId}`,
      ],
      Labels: { 'tazama.trs.rule': ruleRef(target), 'tazama.trs.tenant': target.tenantId },
      HostConfig: { NetworkMode: this.profile.network, RestartPolicy: { Name: 'unless-stopped' } },
    });
    await container.start();
    const connected = await poll(Date.now() + 60_000, async () => {
      const logs = (await container.logs({ stdout: true, stderr: true })).toString('utf8');
      if (logs.includes(CONNECTED)) return true;
      const { State } = await container.inspect();
      if (!State.Running) throw new Error(`${name} stopped (exit ${State.ExitCode}):\n${logs.slice(-2000)}`);
      return undefined;
    });
    if (!connected) throw new Error(`${name} did not connect to NATS within 60 s`);
  }

  private async login(): Promise<string> {
    const response = await fetch(`${this.profile.authUrl}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: this.profile.username, password: this.profile.password }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Login of ${this.profile.username} failed: HTTP ${response.status}`);
    try {
      const body = JSON.parse(text) as string | { token?: string; access_token?: string };
      const token = typeof body === 'string' ? body : (body.token ?? body.access_token);
      if (token) return token;
    } catch {
      if (text.split('.').length === 3) return text.trim();
    }
    throw new Error(`Login of ${this.profile.username} returned no token`);
  }

  private async admin(token: string, method: string, path: string, body?: unknown): Promise<{ status: number; data: unknown }> {
    const response = await fetch(`${this.profile.adminUrl}/v1/admin${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { status: response.status, data: parse(await response.text()) };
  }

  private async adminOk<T>(token: string, method: string, path: string, body: unknown, what: string): Promise<T> {
    const { status, data } = await this.admin(token, method, path, body);
    if (status < 200 || status >= 300) throw new Error(`${what} failed: HTTP ${status} ${JSON.stringify(data).slice(0, 300)}`);
    return data as T;
  }

  private async ensureRuleConfig(token: string, target: RuleTarget): Promise<void> {
    const path = `/configuration/rule/${encodeURIComponent(target.config.id)}/${encodeURIComponent(target.config.cfg)}`;
    if ((await this.admin(token, 'GET', path)).status === 200) return;
    await this.adminOk(token, 'POST', '/configuration/rule', { ...target.config, tenantId: target.tenantId }, `Saving rule config ${target.config.id}`);
  }

  private async activeNetworkMap(token: string): Promise<NetworkMap> {
    const { data } = await this.adminOk<{ data?: NetworkMap[] }>(token, 'GET', '/configuration/network_map', undefined, 'Reading the network map');
    const map = (data ?? []).find((m) => m.active);
    if (!map) throw new Error('There is no active network map to add the rule to');
    return map;
  }

  private async waitForEvaluation(token: string, msgId: string, timeoutMs: number): Promise<RuleAlert> {
    const alert = await poll(Date.now() + timeoutMs, async () => {
      const { status, data } = await this.admin(token, 'GET', `/reports/getreportbymsgid?msgid=${encodeURIComponent(msgId)}`);
      const found = (data as { data?: Partial<RuleAlert> } | undefined)?.data;
      return status === 200 && found?.report?.tadpResult ? (found as RuleAlert) : undefined;
    });
    if (!alert) throw new Error(`No evaluation for ${msgId} within ${Math.round(timeoutMs / 1000)} s`);
    return alert;
  }
}

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockContainer = {
  start: jest.fn<() => Promise<void>>(),
  logs: jest.fn<() => Promise<Buffer>>(),
  inspect: jest.fn<() => Promise<{ State: { Running: boolean; ExitCode: number } }>>(),
};
const mockRemove = jest.fn<(options: unknown) => Promise<void>>();
const mockInspectDeployed = jest.fn<() => Promise<unknown>>();
const mockLogsDeployed = jest.fn<(options: unknown) => Promise<Buffer>>();
const mockDockerode = {
  modem: { followProgress: (_s: unknown, done: (err: Error | null, out: unknown[]) => void) => done(null, []) },
  pull: jest.fn<(image: string, options: unknown) => Promise<unknown>>(),
  getContainer: jest.fn<(name: string) => unknown>(),
  createContainer: jest.fn<(options: unknown) => Promise<typeof mockContainer>>(),
};
jest.mock('testcontainers', () => ({
  ...jest.requireActual<object>('testcontainers'),
  getContainerRuntimeClient: async () => ({ container: { dockerode: mockDockerode } }),
}));

import {
  containerName,
  flowProcessorOf,
  type NetworkMap,
  reasonOf,
  replayNetworkMap,
  RuleDeployer,
  ruleTypology,
  withRuleTypology,
} from '../../src/services/rule-pipeline/rule-deployment';
import { msgIdOf, sampleTransactions } from '../../src/services/rule-pipeline/rule-samples';

const config = {
  id: '021@4.0.0',
  cfg: '4.0.0',
  config: {
    bands: [{ subRuleRef: '.01' }, { subRuleRef: '.02' }],
    exitConditions: [{ subRuleRef: '.x00' }, { subRuleRef: '.x01', reason: 'Insufficient transaction history' }],
  },
};
const target = { ruleId: '021', version: '4.0.0', tenantId: 'DEFAULT', txtp: 'pacs.002.001.12', config };
const coreMap = (): NetworkMap => ({
  active: true,
  cfg: '4.0.0',
  tenantId: 'DEFAULT',
  name: 'Public Network Map',
  messages: [
    {
      id: '004@4.0.0',
      cfg: '4.0.0',
      txTp: 'pacs.002.001.12',
      typologies: [
        { id: 'typology-processor', cfg: '999-901-902@4.0.0', rules: [{ id: 'EFRuP@4.0.0', cfg: 'none' }, { id: '901@4.0.0', cfg: '4.0.0' }] },
        { id: 'typology-processor', cfg: 'trs-021@3.0.0', rules: [{ id: '021@3.0.0', cfg: '3.0.0' }] },
      ],
    },
  ],
});

describe('rule typology and network map', () => {
  it('weighs exit conditions at zero and outcomes in order, and joins the event-flow processor of the map', () => {
    const typology = ruleTypology(target, flowProcessorOf(coreMap(), target.txtp));

    expect(typology).toMatchObject({ id: 'typology-processor', cfg: 'trs-021@4.0.0', tenantId: 'DEFAULT', expression: ['Add', 'v021at400at400'] });
    expect(typology.rules[0].wghts).toEqual([
      { ref: '.err', wght: 0 },
      { ref: '.x00', wght: 0 },
      { ref: '.x01', wght: 0 },
      { ref: '.01', wght: 100 },
      { ref: '.02', wght: 200 },
    ]);
    expect(typology.rules[1]).toMatchObject({ id: 'EFRuP@4.0.0', cfg: 'none', termId: 'vEFRuPat400atnone' });
    expect(typology.workflow).toEqual({ alertThreshold: 200, interdictionThreshold: 400, flowProcessor: 'EFRuP@4.0.0' });
    expect(ruleTypology({ ...target, config: { id: 'c@1.0.0', cfg: '1.0.0', config: { cases: { alternative: { subRuleRef: '.00' }, expressions: [{ subRuleRef: '.01' }] } } } }).rules).toHaveLength(1);
  });

  it("replaces the rule's earlier typology in the map and keeps everything else", () => {
    const { map, replaced } = withRuleTypology(coreMap(), target, ruleTypology(target, flowProcessorOf(coreMap(), target.txtp)));

    expect(replaced).toEqual(['trs-021@3.0.0']);
    expect(map.messages[0].typologies.map((t) => t.cfg)).toEqual(['999-901-902@4.0.0', 'trs-021@4.0.0']);
    expect(map.messages[0].typologies[1].rules).toEqual([
      { id: '021@4.0.0', cfg: '4.0.0' },
      { id: 'EFRuP@4.0.0', cfg: 'none' },
    ]);
    expect(map).toMatchObject({ name: 'Public Network Map', cfg: '4.0.0' });
  });

  it('adds a message for a transaction type the map does not route yet', () => {
    const pacs008 = { ...target, txtp: 'pacs.008.001.10' };
    const { map } = withRuleTypology(coreMap(), pacs008, ruleTypology(pacs008));

    expect(map.messages.map((m) => m.txTp)).toEqual(['pacs.002.001.12', 'pacs.008.001.10']);
    expect(map.messages[0].typologies.map((t) => t.cfg)).toEqual(['999-901-902@4.0.0']);
  });

  it("explains a result with the rule config's reason when the rule sent none", () => {
    expect(reasonOf(config, { subRuleRef: '.x01' })).toBe('Insufficient transaction history');
    expect(reasonOf(config, { subRuleRef: '.err', reason: 'boom' })).toBe('boom');
    expect(reasonOf(config, { subRuleRef: '.99' })).toBeUndefined();
  });

  it('replays to just this rule under a typology that Tazama has no config for, so no evaluation follows', () => {
    expect(replayNetworkMap(target).messages).toEqual([
      { id: 'pacs.002.001.12@1.0.0', cfg: '1.0.0', txTp: 'pacs.002.001.12', typologies: [{ id: 'typology-processor', cfg: 'trs-run-021@4.0.0', rules: [{ id: '021@4.0.0', cfg: '4.0.0' }] }] },
    ]);
    expect(containerName({ ruleId: '021', tenantId: 'tenant 001' })).toBe('trs-tenant-001-rule-021');
  });

  it('builds a pacs.008 and the pacs.002 that settles it', () => {
    const messages = sampleTransactions(new Date('2026-01-01T00:00:00.000Z'));
    const [pacs008, pacs002] = messages as Array<Record<string, any>>;

    expect(messages.map((m) => m.TxTp)).toEqual(['pacs.008.001.10', 'pacs.002.001.12']);
    expect(pacs002.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId).toBe(pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf.PmtId.EndToEndId);
    expect(pacs002.FIToFIPmtSts.TxInfAndSts.TxSts).toBe('ACCC');
    expect(pacs002.FIToFIPmtSts.GrpHdr.CreDtTm).toBe('2026-01-01T00:00:01.000Z');
    expect(msgIdOf(messages[1])).toBe(pacs002.FIToFIPmtSts.GrpHdr.MsgId);
  });
});

describe('RuleDeployer', () => {
  const profile = {
    network: 'tazama-core_default',
    adminUrl: 'http://admin:3100',
    authUrl: 'http://auth:3020/v1/auth',
    tmsUrl: 'http://tms:3000',
    natsUtilsUrl: 'http://nats-utilities:4000',
    username: 'api@tazama.org',
    password: 'secret',
  };
  const image = { build: true, registry: 'localhost:5055', namespace: 'tazama' };
  const calls: Array<{ method: string; url: string; body?: unknown }> = [];
  let routes: Record<string, (body?: unknown) => { status: number; body?: unknown }>;
  const realFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContainer.start.mockResolvedValue(undefined);
    mockContainer.logs.mockResolvedValue(Buffer.from('Connected to nats'));
    mockContainer.inspect.mockResolvedValue({ State: { Running: true, ExitCode: 0 } });
    mockRemove.mockResolvedValue(undefined);
    mockDockerode.pull.mockResolvedValue({});
    mockInspectDeployed.mockResolvedValue({
      Config: { Labels: { 'tazama.trs.rule': '021@4.0.0' }, Image: 'localhost:5055/tazama/default-rule-021@sha256:abc' },
      RestartCount: 0,
      State: { Running: true, Restarting: false, ExitCode: 0, StartedAt: '2026-11-10T10:00:00Z' },
    });
    mockLogsDeployed.mockResolvedValue(Buffer.from('Connected to nats'));
    mockDockerode.getContainer.mockReturnValue({ remove: mockRemove, inspect: mockInspectDeployed, logs: mockLogsDeployed });
    mockDockerode.createContainer.mockResolvedValue(mockContainer);
    calls.length = 0;
    routes = {
      'POST http://auth:3020/v1/auth/login': () => ({ status: 200, body: 'aaa.bbb.ccc' }),
      'GET http://admin:3100/v1/admin/configuration/rule/021%404.0.0/4.0.0': () => ({ status: 200, body: config }),
      'GET http://admin:3100/v1/admin/configuration/network_map': () => ({ status: 200, body: { data: [{ ...coreMap(), active: false, cfg: '3.0.0' }, coreMap()] } }),
      'GET http://admin:3100/v1/admin/configuration/typology/typology-processor/trs-021%404.0.0': () => ({ status: 404 }),
      'POST http://admin:3100/v1/admin/configuration/typology': (body) => ({ status: 201, body }),
      'PUT http://admin:3100/v1/admin/configuration/network_map/4.0.0': (body) => ({ status: 200, body }),
      'DELETE http://admin:3100/v1/admin/configuration/typology/typology-processor/trs-021%403.0.0': () => ({ status: 200 }),
      'POST http://admin:3100/v1/admin/configuration/network_map/reload': () => ({ status: 200, body: { dispatched: true } }),
    };
    global.fetch = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      const url = String(input).replace(/\?.*$/, '');
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ method, url, body });
      const route = routes[`${method} ${url}`];
      const { status, body: reply } = route ? route(body) : { status: 404, body: { message: 'no route' } };
      return new Response(reply === undefined ? '' : typeof reply === 'string' ? reply : JSON.stringify(reply), { status });
    }) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  it('runs the image pinned to its digest in the Tazama network, then adds its typology to the active map and reloads it', async () => {
    const result = await new RuleDeployer(profile, image).deploy(target, { ref: 'localhost:5055/tazama/default-rule-021:4.0.0', digest: 'sha256:abc' });

    const pinned = 'localhost:5055/tazama/default-rule-021@sha256:abc';
    expect(mockDockerode.pull).toHaveBeenCalledWith(pinned, { authconfig: {} });
    expect(mockRemove).toHaveBeenCalledWith({ force: true });
    expect(mockDockerode.createContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'trs-default-rule-021',
        Image: pinned,
        Env: expect.arrayContaining(['RULE_NAME=021', 'RULE_VERSION=4.0.0', 'FUNCTION_NAME=rule-021']),
        HostConfig: { NetworkMode: 'tazama-core_default', RestartPolicy: { Name: 'unless-stopped' } },
      }),
    );
    expect(result).toEqual({ ok: true, container: 'trs-default-rule-021', network: 'tazama-core_default', image: pinned, typology: 'trs-021@4.0.0', networkMap: '4.0.0' });
    const put = calls.find((c) => c.method === 'PUT') as { body: NetworkMap };
    expect(put.body.messages[0].typologies.map((t) => t.cfg)).toEqual(['999-901-902@4.0.0', 'trs-021@4.0.0']);
    expect(calls.map((c) => `${c.method} ${c.url.replace('http://admin:3100/v1/admin', '')}`).slice(-4)).toEqual([
      'POST /configuration/typology',
      'PUT /configuration/network_map/4.0.0',
      'DELETE /configuration/typology/typology-processor/trs-021%403.0.0',
      'POST /configuration/network_map/reload',
    ]);
  });

  it('refuses an image that was never pushed, and a container that does not reach NATS', async () => {
    const deployer = new RuleDeployer(profile, image);
    await expect(deployer.deploy(target, { ref: 'x:1' })).rejects.toThrow('no registry digest');

    mockContainer.logs.mockResolvedValueOnce(Buffer.from('Error: connect ECONNREFUSED'));
    mockContainer.inspect.mockResolvedValueOnce({ State: { Running: false, ExitCode: 1 } });
    await expect(deployer.deploy(target, { ref: 'x:1', digest: 'sha256:abc' })).rejects.toThrow('trs-default-rule-021 stopped (exit 1)');
  });

  it('reports this version as deployed once its container runs and has connected to NATS, and what runs instead', async () => {
    const deployer = new RuleDeployer(profile, image);

    await expect(deployer.status(target)).resolves.toEqual({
      enabled: true,
      deployed: true,
      state: 'deployed',
      restarts: 0,
      current: true,
      container: 'trs-default-rule-021',
      network: 'tazama-core_default',
      rule: '021@4.0.0',
      image: 'localhost:5055/tazama/default-rule-021@sha256:abc',
      startedAt: '2026-11-10T10:00:00Z',
    });
    const since = Date.parse('2026-11-10T10:00:00Z') / 1000;
    expect(mockLogsDeployed).toHaveBeenCalledWith({ stdout: true, stderr: true, since, until: since + 300 });
    await expect(deployer.status({ ...target, version: '5.0.0' })).resolves.toMatchObject({ deployed: true, current: false });
    mockInspectDeployed.mockRejectedValueOnce(new Error('no such container'));
    await expect(deployer.status(target)).resolves.toEqual({ enabled: true, deployed: false, network: 'tazama-core_default' });
  });

  it('tells a container that has not connected yet, restarts or stopped from a deployed one, and runs nothing on it', async () => {
    const deployer = new RuleDeployer(profile, image);
    const inspected = (state: Record<string, unknown>, restarts = 0) => ({
      Config: { Labels: { 'tazama.trs.rule': '021@4.0.0' }, Image: 'x' },
      RestartCount: restarts,
      State: { Running: true, Restarting: false, ExitCode: 0, StartedAt: '2026-11-10T10:00:00Z', ...state },
    });

    mockLogsDeployed.mockResolvedValueOnce(Buffer.from('starting rule-executer'));
    await expect(deployer.status(target)).resolves.toMatchObject({ state: 'starting' });
    mockLogsDeployed.mockRejectedValueOnce(new Error('logs unavailable'));
    await expect(deployer.status(target)).resolves.toMatchObject({ state: 'starting' });

    mockInspectDeployed.mockResolvedValueOnce(inspected({ Restarting: true, Running: false, ExitCode: 1 }, 4));
    await expect(deployer.status(target)).resolves.toMatchObject({ state: 'restarting', restarts: 4, exitCode: 1 });
    mockInspectDeployed.mockResolvedValueOnce(inspected({ Running: false, ExitCode: 137 }));
    await expect(deployer.status(target)).resolves.toMatchObject({ state: 'stopped', exitCode: 137 });

    mockInspectDeployed.mockResolvedValueOnce(inspected({ Running: false, ExitCode: 137 }));
    await expect(deployer.runRule(target, 'm1')).rejects.toThrow('trs-default-rule-021 is stopped; redeploy it or check its logs');
    expect(calls).toHaveLength(0);
  });

  it('replays an evaluated message, with its data cache, to the deployed rule and returns its result', async () => {
    const transaction = { TxTp: 'pacs.002.001.12', TenantId: 'DEFAULT', FIToFIPmtSts: { GrpHdr: { MsgId: 'm1' } } };
    routes['GET http://admin:3100/v1/admin/reports/getreportbymsgid'] = () => ({ status: 200, body: { data: { transaction, dataCache: { cdtrAcctId: 'c1' } } } });
    routes['POST http://nats-utilities:4000/natsPublish'] = () => ({
      status: 200,
      body: { message: 'Transaction is valid', data: { transaction, ruleResult: { id: '021@4.0.0', subRuleRef: '.x01', prcgTm: 7 } } },
    });

    const result = await new RuleDeployer(profile, image).runRule(target, 'm1');

    expect(result).toMatchObject({ kind: 'rule', ok: true, msgId: 'm1', reason: 'Insufficient transaction history' });
    expect(result.result).toEqual({ id: '021@4.0.0', subRuleRef: '.x01', prcgTm: 7 });
    const published = calls.find((c) => c.url.endsWith('/natsPublish'))?.body as Record<string, any>;
    expect(published).toMatchObject({ awaitReply: true, destination: 'sub-rule-021@4.0.0', consumer: 'pub-rule-021@4.0.0', functionName: 'trs-run-021' });
    expect(published.message).toMatchObject({ transaction, DataCache: { cdtrAcctId: 'c1' }, networkMap: replayNetworkMap(target) });
  });

  it('first puts a sample transaction through Tazama when there is no evaluated message to replay', async () => {
    const tms = (): Array<{ TxTp: string }> => calls.filter((c) => c.url.startsWith('http://tms')).map((c) => c.body as { TxTp: string });
    routes['POST http://tms:3000/v1/evaluate/iso20022/pacs.008.001.10'] = () => ({ status: 200 });
    routes['POST http://tms:3000/v1/evaluate/iso20022/pacs.002.001.12'] = () => ({ status: 200 });
    routes['GET http://admin:3100/v1/admin/reports/getreportbymsgid'] = () => ({
      status: 200,
      body: { data: { transaction: tms()[1], dataCache: {}, report: { status: 'NALT', tadpResult: { typologyResult: [] } } } },
    });
    routes['POST http://nats-utilities:4000/natsPublish'] = (body) => ({
      status: 200,
      body: { data: { transaction: (body as { message: { transaction: unknown } }).message.transaction, ruleResult: { subRuleRef: '.x01' } } },
    });

    const result = await new RuleDeployer(profile, image).runRule(target);

    expect(tms().map((m) => m.TxTp)).toEqual(['pacs.008.001.10', 'pacs.002.001.12']);
    expect(result).toMatchObject({ kind: 'rule', ok: true, msgId: msgIdOf(tms()[1] as never), result: { subRuleRef: '.x01' } });
  });

  it('refuses to replay a message Tazama never evaluated, of another type, or answered by another transaction', async () => {
    const deployer = new RuleDeployer(profile, image);
    routes['GET http://admin:3100/v1/admin/reports/getreportbymsgid'] = () => ({ status: 404 });
    await expect(deployer.runRule(target, 'nope')).rejects.toThrow('Tazama has not evaluated a message with id nope');

    routes['GET http://admin:3100/v1/admin/reports/getreportbymsgid'] = () => ({ status: 200, body: { data: { transaction: { TxTp: 'pacs.008.001.10' } } } });
    await expect(deployer.runRule(target, 'm8')).rejects.toThrow('m8 is a pacs.008.001.10; rule 021@4.0.0 handles pacs.002.001.12');

    const transaction = { TxTp: 'pacs.002.001.12', FIToFIPmtSts: { GrpHdr: { MsgId: 'm1' } } };
    routes['GET http://admin:3100/v1/admin/reports/getreportbymsgid'] = () => ({ status: 200, body: { data: { transaction } } });
    routes['POST http://nats-utilities:4000/natsPublish'] = () => ({
      status: 200,
      body: { data: { transaction: { FIToFIPmtSts: { GrpHdr: { MsgId: 'other' } } }, ruleResult: { subRuleRef: '.01' } } },
    });
    await expect(deployer.runRule(target, 'm1')).rejects.toThrow('another transaction arrived first');
  });

  it('runs nothing against a rule that is not deployed or runs another version', async () => {
    const deployer = new RuleDeployer(profile, image);
    mockInspectDeployed.mockRejectedValueOnce(new Error('no such container'));
    await expect(deployer.runRule(target, 'm1')).rejects.toThrow('021@4.0.0 is not deployed');

    await expect(deployer.endToEnd({ ...target, version: '5.0.0' })).rejects.toThrow('trs-default-rule-021 runs 021@4.0.0; deploy 021@5.0.0 first');
    expect(calls).toHaveLength(0);
  });

  it('sends a pacs.008 and pacs.002 through TMS and finds the rule in the evaluation', async () => {
    let polls = 0;
    routes['POST http://tms:3000/v1/evaluate/iso20022/pacs.008.001.10'] = () => ({ status: 200, body: { message: 'Transaction is valid' } });
    routes['POST http://tms:3000/v1/evaluate/iso20022/pacs.002.001.12'] = () => ({ status: 200, body: { message: 'Transaction is valid' } });
    routes['GET http://admin:3100/v1/admin/reports/getreportbymsgid'] = () => {
      polls += 1;
      if (polls === 1) return { status: 404 };
      return {
        status: 200,
        body: {
          data: {
            report: {
              status: 'NALT',
              tadpResult: { typologyResult: [{ cfg: 'trs-021@4.0.0', result: 0, ruleResults: [{ id: '021@4.0.0', subRuleRef: '.x01' }] }] },
            },
          },
        },
      };
    };

    const result = await new RuleDeployer(profile, image).endToEnd(target, 10_000);

    const sent = calls.filter((c) => c.url.startsWith('http://tms'));
    expect(sent.map((c) => (c.body as { TxTp: string }).TxTp)).toEqual(['pacs.008.001.10', 'pacs.002.001.12']);
    expect(result).toMatchObject({
      kind: 'e2e',
      ok: true,
      result: { id: '021@4.0.0', subRuleRef: '.x01' },
      reason: 'Insufficient transaction history',
      alert: { report: { status: 'NALT', tadpResult: { typologyResult: [{ cfg: 'trs-021@4.0.0', result: 0 }] } } },
    });
    expect(result.msgId).toBe(msgIdOf(sent[1].body as never));
  });

  it('fails the end-to-end check when TMS rejects the message or the rule is missing from the evaluation', async () => {
    routes['POST http://tms:3000/v1/evaluate/iso20022/pacs.008.001.10'] = () => ({ status: 401, body: 'Unauthorized' });
    await expect(new RuleDeployer(profile, image).endToEnd(target, 10_000)).rejects.toThrow('TMS rejected the pacs.008.001.10: HTTP 401');

    routes['POST http://tms:3000/v1/evaluate/iso20022/pacs.008.001.10'] = () => ({ status: 200 });
    routes['POST http://tms:3000/v1/evaluate/iso20022/pacs.002.001.12'] = () => ({ status: 200 });
    routes['GET http://admin:3100/v1/admin/reports/getreportbymsgid'] = () => ({
      status: 200,
      body: { data: { report: { status: 'NALT', tadpResult: { typologyResult: [{ cfg: '999-901-902@4.0.0', ruleResults: [] }] } } } },
    });
    await expect(new RuleDeployer(profile, image).endToEnd(target, 10_000)).rejects.toThrow('has no result from 021@4.0.0 (typologies: 999-901-902@4.0.0)');
  });
});

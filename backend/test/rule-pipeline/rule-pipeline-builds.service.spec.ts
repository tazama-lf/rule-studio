import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockStatus = jest.fn<(target: unknown) => Promise<unknown>>();
const mockDeploy = jest.fn<(target: unknown, image: unknown) => Promise<unknown>>();
const mockRunRule = jest.fn<(target: unknown, msgId?: string) => Promise<unknown>>();
const mockEndToEnd = jest.fn<(target: unknown) => Promise<unknown>>();
const deployerMock = () => ({ status: mockStatus, deploy: mockDeploy, runRule: mockRunRule, endToEnd: mockEndToEnd });
jest.mock('../../src/services/rule-pipeline/rule-deployment', () => ({
  RuleDeployer: jest.fn().mockImplementation(() => deployerMock()),
}));

import type { FeatureFlagsService } from '../../src/common/feature-flags/feature-flags.service';
import type { AuthenticatedUser } from '../../src/services/auth/auth.types';
import type { RulesService } from '../../src/services/rules/rules.service';
import { loadArtifactProfile } from '../../src/services/rule-pipeline/artifact-profile';
import { RuleDeployer } from '../../src/services/rule-pipeline/rule-deployment';
import { RulePipelineBuildsService } from '../../src/services/rule-pipeline/rule-pipeline-builds.service';
import type { RuleBuildJobResult } from '../../src/services/rule-pipeline/rule-pipeline.types';

const b64 = (s: string): string => Buffer.from(s).toString('base64');
const user = { userId: 'u1', tenantId: 'DEFAULT', actorEmail: 'trs-editor@tazama.org' } as unknown as AuthenticatedUser;

const getRuleById = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getRuleFlow = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getRuleConfiguration = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const rules = { getRuleById, getRuleFlow, getRuleConfiguration } as unknown as RulesService;
const ruleConfig = { id: 'amount102@1.0.0', cfg: '1.0.0', config: { bands: [{ subRuleRef: '.01' }] } };
const target = { ruleId: 'amount102', version: '1.0.0', tenantId: 'DEFAULT', txtp: 'pacs.002.001.12', config: ruleConfig };
const deployEnv = {
  RULE_DEPLOY_NETWORK: 'tazama-core_default',
  ADMIN_SERVICE_URL: 'http://admin:3100',
  TAZAMA_AUTH_URL: 'http://auth:3020/v1/auth',
  TAZAMA_TMS_URL: 'http://tms:3000',
  TAZAMA_NATS_UTILS_URL: 'http://nats-utilities:4000',
  TAZAMA_API_USERNAME: 'api@tazama.org',
  TAZAMA_API_PASSWORD: 'secret',
};

interface FakeJob {
  id: string;
  data: Record<string, unknown> & { ruleDbId: number; source: { ruleId: string; version: string } };
  timestamp: number;
  finishedOn?: number;
  progress?: unknown;
  failedReason?: string;
  returnvalue?: RuleBuildJobResult;
  state: string;
  getState: () => Promise<string>;
}
let jobs: FakeJob[];
const job = (over: Omit<Partial<FakeJob>, 'data'> & { data?: Partial<FakeJob['data']> }): FakeJob => {
  const j: FakeJob = {
    id: String(jobs.length + 1),
    timestamp: 1_000 + jobs.length,
    state: 'waiting',
    ...over,
    data: { ruleDbId: 50, ruleConfigId: 'amount102@1.0.0', source: { ruleId: 'amount102', version: '1.0.0' }, ...over.data },
    getState: async () => j.state,
  };
  jobs.push(j);
  return j;
};
const queue = {
  add: jest.fn<(name: string, data: FakeJob['data']) => Promise<FakeJob>>(),
  getJob: jest.fn<(id: string) => Promise<FakeJob | undefined>>(),
  getJobs: jest.fn<() => Promise<FakeJob[]>>(),
};

const result = (over: Partial<RuleBuildJobResult['build']> = {}): RuleBuildJobResult => ({
  build: {
    ruleId: 'amount102',
    version: '1.0.0',
    tests: { total: 4, passed: 4, failed: 0, success: true, coverageThresholdMet: false },
    durationsMs: { test: 3000 },
    package: { file: 'tazama-lf-rule-amount102-1.0.0.tgz', integrity: 'sha512-abc', shasum: 'def', size: 3 },
    image: { ref: 'localhost:5000/tazama/rule-amount102:1.0.0', id: 'sha256:img', digest: 'sha256:man' },
    gitRepo: 'http://gitea/tazama-rules/rule-amount102',
    ...over,
  },
  reportHtml: '<html>report</html>',
  packageTgz: b64('tgz'),
});

const baseEnv = { IMAGE_REGISTRY: 'localhost:5000', IMAGE_NAMESPACE: 'tazama', RULE_GIT_KIND: 'gitea', RULE_GIT_API_URL: 'http://gitea:3000', RULE_GIT_TOKEN: 'secret' };

function service(enabled = true, env: NodeJS.ProcessEnv = baseEnv) {
  const features = { isRulePipelineEnabled: () => enabled } as unknown as FeatureFlagsService;
  return new RulePipelineBuildsService(queue as never, loadArtifactProfile(env), rules, features);
}

describe('RulePipelineBuildsService', () => {
  beforeEach(() => {
    jobs = [];
    (RuleDeployer as unknown as jest.Mock).mockImplementation(() => deployerMock());
    queue.add.mockImplementation(async (_name, data) => job({ data }));
    queue.getJob.mockImplementation(async (id) => jobs.find((j) => j.id === id));
    queue.getJobs.mockImplementation(async () => jobs);
    getRuleById.mockResolvedValue({ id: 50, rule_config_id: 'Amount102@1.0.0', txtp: 'pacs.002.001.12' });
    getRuleConfiguration.mockResolvedValue({ configuration: ruleConfig });
    getRuleFlow.mockResolvedValue({ status: 'ok', result: { ts_file_base64_rule_builder: b64('export const rule = 1;'), ts_file_base64_test_case: `data:application/typescript;base64,${b64('test("x", () => {});')}` } });
  });

  it('refuses every call when the pipeline is switched off', async () => {
    const s = service(false);
    await expect(s.start(50, user)).rejects.toThrow(ServiceUnavailableException);
    await expect(s.get('1')).rejects.toThrow(ServiceUnavailableException);
    await expect(s.latest(50)).rejects.toThrow(ServiceUnavailableException);
    await expect(s.deployment(50, user)).rejects.toThrow(ServiceUnavailableException);
    await expect(s.deploy(50, user)).rejects.toThrow(ServiceUnavailableException);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("queues the rule's current code and tests, read through RulesService with the flow permission", async () => {
    const view = await service().start(50, user);

    expect(getRuleFlow).toHaveBeenCalledWith('50', user, 'GET /rules/api/:ruleId/flow');
    expect(getRuleConfiguration).not.toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalledWith('build', {
      ruleDbId: 50,
      ruleConfigId: 'Amount102@1.0.0',
      source: { ruleId: 'amount102', version: '1.0.0', ruleCode: 'export const rule = 1;', testCode: 'test("x", () => {});', tenantId: 'DEFAULT' },
      requestedBy: 'trs-editor@tazama.org',
    });
    expect(view).toMatchObject({ buildId: '1', ruleId: 'amount102', version: '1.0.0', status: 'queued', hasReport: false });
  });

  it('rejects rules without a config, without generated code, or with an unusable id', async () => {
    getRuleById.mockResolvedValueOnce({ id: 50, rule_config_id: undefined });
    await expect(service().start(50, user)).rejects.toThrow('has no rule config');

    getRuleFlow.mockResolvedValueOnce({ result: { ts_file_base64_rule_builder: b64('x') } });
    await expect(service().start(50, user)).rejects.toThrow('no generated unit tests');

    getRuleById.mockResolvedValueOnce({ id: 50, rule_config_id: 'bad id@1.0.0' });
    await expect(service().start(50, user)).rejects.toThrow(BadRequestException);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('reports running builds with their current stage, and broken ones with the reason', async () => {
    job({ state: 'active', progress: { stage: 'test' } });
    job({ state: 'failed', failedReason: '[rule-amount102@1.0.0] npm ci failed (exit 1)' });

    await expect(service().get('1')).resolves.toMatchObject({ status: 'running', stage: 'test', hasReport: false });
    await expect(service().get('2')).resolves.toMatchObject({ status: 'error', error: '[rule-amount102@1.0.0] npm ci failed (exit 1)' });
  });

  it('offers the tests and the report of a running build as soon as the tests ran', async () => {
    const tests = { total: 13, passed: 13, failed: 0, success: true, coverageThresholdMet: true };
    job({ state: 'active', progress: { stage: 'image', tests, reportHtml: '<html>early</html>' } });

    const view = await service().get('1');
    expect(view).toMatchObject({ status: 'running', stage: 'image', tests, hasReport: true });
    expect(JSON.stringify(view)).not.toContain('<html>');
    await expect(service().report('1')).resolves.toBe('<html>early</html>');
  });

  it('marks completed builds passed or failed (tests), without the package bytes', async () => {
    job({ state: 'completed', finishedOn: 2_000, returnvalue: result() });
    job({ state: 'completed', returnvalue: result({ tests: { total: 13, passed: 4, failed: 9, success: false, coverageThresholdMet: false }, package: undefined, image: undefined }) });

    const passed = await service().get('1');
    expect(passed).toMatchObject({ status: 'passed', hasReport: true, package: { integrity: 'sha512-abc' }, image: { digest: 'sha256:man' }, gitRepo: expect.any(String) });
    expect(JSON.stringify(passed)).not.toContain(b64('tgz'));
    await expect(service().get('2')).resolves.toMatchObject({ status: 'failed', tests: { failed: 9 } });
  });

  it('shows a broken build with the stage it broke at, its tests, report and source', async () => {
    job({ state: 'completed', returnvalue: { ...result({ package: undefined, image: undefined }), error: '[rule-021@4.0.0] npm build failed (exit 2)', failedStage: 'package' } });

    await expect(service().get('1')).resolves.toMatchObject({
      status: 'error',
      stage: 'package',
      error: '[rule-021@4.0.0] npm build failed (exit 2)',
      tests: { passed: 4 },
      hasReport: true,
      gitRepo: 'http://gitea/tazama-rules/rule-amount102',
    });
  });

  it('serves the report and the package of a finished build', async () => {
    job({ state: 'completed', returnvalue: result() });
    job({ state: 'completed', returnvalue: { ...result({ package: undefined }), reportHtml: undefined, packageTgz: undefined } });

    await expect(service().report('1')).resolves.toBe('<html>report</html>');
    await expect(service().package('1')).resolves.toEqual({ file: 'tazama-lf-rule-amount102-1.0.0.tgz', integrity: 'sha512-abc', data: Buffer.from('tgz') });
    await expect(service().report('2')).rejects.toThrow(NotFoundException);
    await expect(service().package('2')).rejects.toThrow(NotFoundException);
    await expect(service().get('99')).rejects.toThrow('Build 99 not found');
  });

  it("finds a rule's most recent build", async () => {
    job({ state: 'completed', returnvalue: result() });
    job({ state: 'completed', data: { ruleDbId: 51 }, returnvalue: result() });
    job({ state: 'active', progress: { stage: 'image' } });

    await expect(service().latest(50)).resolves.toMatchObject({ buildId: '3', status: 'running' });
    await expect(service().latest(52)).resolves.toBeUndefined();
  });

  it('shows whether the rule is deployed, with the latest run of each kind', async () => {
    await expect(service().deployment(50, user)).resolves.toEqual({ enabled: false, deployed: false });

    mockStatus.mockResolvedValue({ enabled: true, deployed: true, running: true, current: true, container: 'trs-default-rule-amount102' });
    const s = service(true, { ...baseEnv, ...deployEnv });
    await expect(s.deployment(50, user)).resolves.toEqual({ enabled: true, deployed: true, running: true, current: true, container: 'trs-default-rule-amount102', runs: {} });
    expect(mockStatus).toHaveBeenCalledWith({ ruleId: 'amount102', version: '1.0.0', tenantId: 'DEFAULT' });
  });

  it('deploys the image of the latest passed build with the rule config', async () => {
    const s = service(true, { ...baseEnv, ...deployEnv });
    const deployed = { ok: true, container: 'trs-default-rule-amount102', typology: 'trs-amount102@1.0.0' };
    mockDeploy.mockResolvedValue(deployed);
    job({ state: 'completed', returnvalue: result() });

    await expect(s.deploy(50, user)).resolves.toEqual(deployed);
    expect(getRuleConfiguration).toHaveBeenCalledWith('Amount102@1.0.0', user, 'GET /rules/api/configuration/:ruleId');
    expect(mockDeploy).toHaveBeenCalledWith(target, { ref: 'localhost:5000/tazama/rule-amount102:1.0.0', id: 'sha256:img', digest: 'sha256:man' });

    mockDeploy.mockRejectedValueOnce(new Error('Updating network map 4.0.0 failed: HTTP 400'));
    await expect(s.deploy(50, user)).resolves.toEqual({ ok: false, error: 'Updating network map 4.0.0 failed: HTTP 400' });
  });

  it('deploys nothing without a passed, pushed build of the current version or a rule config', async () => {
    const s = service(true, { ...baseEnv, ...deployEnv });
    await expect(s.deploy(50, user)).rejects.toThrow('There is no passed build with a pushed image');

    job({ state: 'completed', returnvalue: result({ image: { ref: 'localhost:5000/tazama/rule-amount102:1.0.0', id: 'sha256:img' } }) });
    await expect(s.deploy(50, user)).rejects.toThrow('There is no passed build with a pushed image');

    job({ state: 'completed', returnvalue: result() });
    job({ state: 'active', progress: { stage: 'test' } });
    await expect(s.deploy(50, user)).rejects.toThrow('There is no passed build with a pushed image');

    job({ state: 'completed', data: { source: { ruleId: 'amount102', version: '0.9.0' } }, returnvalue: result() });
    await expect(s.deploy(50, user)).rejects.toThrow('The last build is of amount102@0.9.0; run Build & Test for amount102@1.0.0 first.');

    job({ state: 'completed', returnvalue: result() });
    getRuleConfiguration.mockRejectedValue(new Error('Configuration not found'));
    await expect(s.deploy(50, user)).rejects.toThrow('Rule config Amount102@1.0.0 was not found');
    expect(mockDeploy).not.toHaveBeenCalled();
  });

  it('runs the rule on the latest evaluated transaction and keeps the latest result of each kind', async () => {
    const s = service(true, { ...baseEnv, ...deployEnv });
    const evaluation = { status: 'NALT', tadpResult: { typologyResult: [] } };
    mockRunRule.mockImplementation(async (_t, msgId) => ({ kind: 'rule', ok: true, msgId: msgId ?? 'sample', ranAt: 't', tookMs: 20, result: { subRuleRef: '.x01' } }));
    mockEndToEnd.mockResolvedValue({ kind: 'e2e', ok: true, msgId: 'e2e-1', ranAt: 't', tookMs: 1200, result: { subRuleRef: '.x01' }, evaluation });
    mockStatus.mockResolvedValue({ enabled: true, deployed: true });

    await expect(s.runRule(50, user)).resolves.toMatchObject({ ok: true, msgId: 'sample', result: { subRuleRef: '.x01' } });
    expect(mockRunRule).toHaveBeenLastCalledWith(target, undefined);
    await s.runRule(50, user);
    expect(mockRunRule).toHaveBeenLastCalledWith(target, 'sample');

    await expect(s.runEndToEnd(50, user)).resolves.toMatchObject({ kind: 'e2e', evaluation });
    expect(mockEndToEnd).toHaveBeenCalledWith(target);
    await s.runRule(50, user);
    expect(mockRunRule).toHaveBeenLastCalledWith(target, 'e2e-1');

    const { runs } = await s.deployment(50, user);
    expect(runs).toEqual({ rule: expect.objectContaining({ kind: 'rule', msgId: 'e2e-1' }), e2e: expect.objectContaining({ kind: 'e2e', evaluation }) });
  });

  it('reports a run that fails and starts the next rule run from a new transaction', async () => {
    const s = service(true, { ...baseEnv, ...deployEnv });
    mockEndToEnd.mockResolvedValueOnce({ kind: 'e2e', ok: true, msgId: 'e2e-1', ranAt: 't', tookMs: 1 });
    await s.runEndToEnd(50, user);
    mockRunRule.mockRejectedValueOnce(new Error('Tazama has not evaluated a message with id e2e-1'));

    await expect(s.runRule(50, user)).resolves.toMatchObject({ kind: 'rule', ok: false, error: 'Tazama has not evaluated a message with id e2e-1' });
    mockRunRule.mockResolvedValueOnce({ kind: 'rule', ok: true, msgId: 'm2', ranAt: 't', tookMs: 1 });
    await s.runRule(50, user);
    expect(mockRunRule).toHaveBeenLastCalledWith(target, undefined);
  });

  it('refuses runs when deployment is not configured', async () => {
    await expect(service().runRule(50, user)).rejects.toThrow(ServiceUnavailableException);
    await expect(service().runEndToEnd(50, user)).rejects.toThrow(ServiceUnavailableException);
    await expect(service().deploy(50, user)).rejects.toThrow(ServiceUnavailableException);
  });

  it('describes the configuration without credentials', () => {
    const config = service().config();

    expect(config).toEqual({
      enabled: true,
      npm: { source: 'public', registry: 'https://registry.npmjs.org', scopeRegistry: 'https://npm.pkg.github.com' },
      image: { build: true, registry: 'localhost:5000', namespace: 'tazama' },
      git: { kind: 'gitea', url: 'http://gitea:3000', owner: 'tazama-rules', branch: 'staging' },
      deploy: { enabled: false },
    });
    expect(service(true, { ...baseEnv, ...deployEnv }).config().deploy).toEqual({ enabled: true, network: 'tazama-core_default' });
    expect(JSON.stringify(service(true, { ...baseEnv, ...deployEnv }).config())).not.toContain('secret');
  });
});

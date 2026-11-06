import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { FeatureFlagsService } from '../../src/common/feature-flags/feature-flags.service';
import type { AuthenticatedUser } from '../../src/services/auth/auth.types';
import type { RulesService } from '../../src/services/rules/rules.service';
import { loadArtifactProfile } from '../../src/services/rule-pipeline/artifact-profile';
import { RulePipelineBuildsService } from '../../src/services/rule-pipeline/rule-pipeline-builds.service';
import type { RuleBuildJobResult } from '../../src/services/rule-pipeline/rule-pipeline.types';

const b64 = (s: string): string => Buffer.from(s).toString('base64');
const user = { userId: 'u1', actorEmail: 'trs-editor@tazama.org' } as unknown as AuthenticatedUser;

const getRuleById = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getRuleFlow = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const rules = { getRuleById, getRuleFlow } as unknown as RulesService;

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
    data: { ruleDbId: 50, ruleConfigId: 'amount102@1.0.0', simulate: false, source: { ruleId: 'amount102', version: '1.0.0' }, ...over.data },
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

const result = (over: Partial<RuleBuildJobResult['build']> = {}, simulation?: RuleBuildJobResult['simulation']): RuleBuildJobResult => ({
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
  simulation,
});

function service(enabled = true, env: NodeJS.ProcessEnv = { DOCKER_PUBLISH: 'true', IMAGE_REGISTRY: 'localhost:5000', IMAGE_NAMESPACE: 'tazama', RULE_GIT_KIND: 'gitea', RULE_GIT_API_URL: 'http://gitea:3000', RULE_GIT_TOKEN: 'secret' }) {
  const features = { isRulePipelineEnabled: () => enabled } as unknown as FeatureFlagsService;
  return new RulePipelineBuildsService(queue as never, loadArtifactProfile(env), rules, features);
}

describe('RulePipelineBuildsService', () => {
  beforeEach(() => {
    jobs = [];
    queue.add.mockImplementation(async (_name, data) => job({ data }));
    queue.getJob.mockImplementation(async (id) => jobs.find((j) => j.id === id));
    queue.getJobs.mockImplementation(async () => jobs);
    getRuleById.mockResolvedValue({ id: 50, rule_config_id: 'Amount102@1.0.0' });
    getRuleFlow.mockResolvedValue({ status: 'ok', result: { ts_file_base64_rule_builder: b64('export const rule = 1;'), ts_file_base64_test_case: `data:application/typescript;base64,${b64('test("x", () => {});')}` } });
  });

  it('refuses every call when the pipeline is switched off', async () => {
    const s = service(false);
    await expect(s.start(50, user, false)).rejects.toThrow(ServiceUnavailableException);
    await expect(s.get('1')).rejects.toThrow(ServiceUnavailableException);
    await expect(s.latest(50)).rejects.toThrow(ServiceUnavailableException);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("queues the rule's current code and tests, read through RulesService with the flow permission", async () => {
    const view = await service().start(50, user, true);

    expect(getRuleFlow).toHaveBeenCalledWith('50', user, 'GET /rules/api/:ruleId/flow');
    expect(queue.add).toHaveBeenCalledWith('build', {
      ruleDbId: 50,
      ruleConfigId: 'Amount102@1.0.0',
      source: { ruleId: 'amount102', version: '1.0.0', ruleCode: 'export const rule = 1;', testCode: 'test("x", () => {});' },
      simulate: true,
      requestedBy: 'trs-editor@tazama.org',
    });
    expect(view).toMatchObject({ buildId: '1', ruleId: 'amount102', version: '1.0.0', status: 'queued', simulate: true, hasReport: false });
  });

  it('does not ask for a simulation when images are switched off', async () => {
    await service(true, { RULE_IMAGE_BUILD: 'false' }).start(50, user, true);
    expect(queue.add).toHaveBeenCalledWith('build', expect.objectContaining({ simulate: false }));
  });

  it('rejects rules without a config, without generated code, or with an unusable id', async () => {
    getRuleById.mockResolvedValueOnce({ id: 50, rule_config_id: undefined });
    await expect(service().start(50, user, false)).rejects.toThrow('has no rule config');

    getRuleFlow.mockResolvedValueOnce({ result: { ts_file_base64_rule_builder: b64('x') } });
    await expect(service().start(50, user, false)).rejects.toThrow('no generated unit tests');

    getRuleById.mockResolvedValueOnce({ id: 50, rule_config_id: 'bad id@1.0.0' });
    await expect(service().start(50, user, false)).rejects.toThrow(BadRequestException);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('reports running builds with their current stage, and broken ones with the reason', async () => {
    job({ state: 'active', progress: { stage: 'test' } });
    job({ state: 'failed', failedReason: '[rule-amount102@1.0.0] npm ci failed (exit 1)' });

    await expect(service().get('1')).resolves.toMatchObject({ status: 'running', stage: 'test' });
    await expect(service().get('2')).resolves.toMatchObject({ status: 'error', error: '[rule-amount102@1.0.0] npm ci failed (exit 1)' });
  });

  it('marks completed builds passed, failed (tests) or error (simulation), without the package bytes', async () => {
    job({ state: 'completed', finishedOn: 2_000, returnvalue: result() });
    job({ state: 'completed', returnvalue: result({ tests: { total: 13, passed: 4, failed: 9, success: false, coverageThresholdMet: false }, package: undefined, image: undefined }) });
    job({ state: 'completed', data: { simulate: true }, returnvalue: result({}, { ok: false, error: 'rule processor did not start' }) });
    job({ state: 'completed', data: { simulate: true }, returnvalue: result({}, { ok: true, upMs: 17_000, subject: 'sub-rule-amount102@1.0.0' }) });

    const passed = await service().get('1');
    expect(passed).toMatchObject({ status: 'passed', hasReport: true, package: { integrity: 'sha512-abc' }, image: { digest: 'sha256:man' }, gitRepo: expect.any(String) });
    expect(JSON.stringify(passed)).not.toContain(b64('tgz'));
    await expect(service().get('2')).resolves.toMatchObject({ status: 'failed', tests: { failed: 9 } });
    await expect(service().get('3')).resolves.toMatchObject({ status: 'error', error: 'Simulation failed: rule processor did not start' });
    await expect(service().get('4')).resolves.toMatchObject({ status: 'passed', simulation: { ok: true, upMs: 17_000 } });
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

  it('describes the configuration without credentials', () => {
    const config = service().config();

    expect(config).toEqual({
      enabled: true,
      npm: { source: 'public', registry: 'https://registry.npmjs.org', scopeRegistry: 'https://npm.pkg.github.com' },
      image: { build: true, registry: 'localhost:5000', namespace: 'tazama' },
      git: { kind: 'gitea', url: 'http://gitea:3000', owner: 'tazama-rules', branch: 'staging' },
    });
    expect(JSON.stringify(config)).not.toContain('secret');
  });
});

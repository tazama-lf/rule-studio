import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { loadArtifactProfile } from '../../src/services/rule-pipeline/artifact-profile';
import type { RuleBuildJobData } from '../../src/services/rule-pipeline/rule-pipeline.types';

const mockBuild = jest.fn<(source: unknown, options: { onStage?: (s: string) => void }) => Promise<unknown>>();
jest.mock('../../src/services/rule-pipeline/rule-pipeline.service', () => ({
  ...jest.requireActual<object>('../../src/services/rule-pipeline/rule-pipeline.service'),
  RulePipelineService: jest.fn().mockImplementation(() => ({ build: mockBuild })),
}));
const mockSpawn = jest.fn<(name: string, options: unknown) => Promise<unknown>>();
const mockDestroy = jest.fn<(name: string) => Promise<void>>();
jest.mock('../../src/services/simulation-studio/ephemeral-env/ephemeral-env.service', () => ({
  EphemeralEnvService: jest.fn().mockImplementation(() => ({ spawn: mockSpawn, destroy: mockDestroy })),
}));

import { RuleBuildError, RulePipelineService } from '../../src/services/rule-pipeline/rule-pipeline.service';
import { EphemeralEnvService } from '../../src/services/simulation-studio/ephemeral-env/ephemeral-env.service';
import { RulePipelineProcessor } from '../../src/services/rule-pipeline/rule-pipeline.processor';

const source = { ruleId: '903', version: '4.0.0', ruleCode: 'x', testCode: 'y' };
const built = {
  ruleId: '903',
  version: '4.0.0',
  tests: { total: 4, passed: 4, failed: 0, success: true, coverageThresholdMet: false },
  durationsMs: {},
  reportHtml: '<html/>',
  package: { file: 'tazama-lf-rule-903-4.0.0.tgz', integrity: 'sha512-abc', shasum: 'def', size: 3, tgz: Buffer.from('tgz') },
  image: { ref: 'localhost:5000/tazama/rule-903:4.0.0', id: 'sha256:img' },
};

function fakeJob(simulate: boolean) {
  const progress: unknown[] = [];
  return {
    progress,
    job: {
      id: '7',
      data: { ruleDbId: 1, ruleConfigId: '903@4.0.0', source, simulate } as RuleBuildJobData,
      updateProgress: jest.fn(async (p: unknown) => {
        progress.push(p);
      }),
    },
  };
}

describe('RulePipelineProcessor', () => {
  beforeEach(() => {
    (RulePipelineService as unknown as jest.Mock).mockImplementation(() => ({ build: mockBuild }));
    (EphemeralEnvService as unknown as jest.Mock).mockImplementation(() => ({ spawn: mockSpawn, destroy: mockDestroy }));
    mockBuild.mockImplementation(async (_s, options) => {
      options.onStage?.('test');
      return built;
    });
    mockSpawn.mockResolvedValue({ natsSubject: 'sub-rule-903@4.0.0' });
    mockDestroy.mockResolvedValue(undefined);
  });

  it('stores the package as base64 next to the build, reports stages, and skips simulation unless asked', async () => {
    const { job, progress } = fakeJob(false);

    const result = await new RulePipelineProcessor(loadArtifactProfile({})).process(job as never);

    expect(result.packageTgz).toBe(Buffer.from('tgz').toString('base64'));
    expect(result.build.package).toEqual({ file: 'tazama-lf-rule-903-4.0.0.tgz', integrity: 'sha512-abc', shasum: 'def', size: 3 });
    expect(result.reportHtml).toBe('<html/>');
    expect(progress).toEqual([{ stage: 'test' }]);
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('simulates the image it just built and always tears the environment down', async () => {
    const { job, progress } = fakeJob(true);

    const result = await new RulePipelineProcessor(loadArtifactProfile({})).process(job as never);

    expect(mockSpawn).toHaveBeenCalledWith('pipeline-7', { ruleName: 'rule-903', version: '4.0.0', image: 'localhost:5000/tazama/rule-903:4.0.0' });
    expect(result.simulation).toMatchObject({ ok: true, subject: 'sub-rule-903@4.0.0' });
    expect(progress.at(-1)).toEqual({ stage: 'simulate' });
    expect(mockDestroy).toHaveBeenCalledWith('pipeline-7');
  });

  it('reports a simulation that does not start instead of failing the build', async () => {
    mockSpawn.mockRejectedValue(new Error('rule processor did not start'));

    const result = await new RulePipelineProcessor(loadArtifactProfile({})).process(fakeJob(true).job as never);

    expect(result.simulation).toEqual({ ok: false, error: 'rule processor did not start' });
    expect(mockDestroy).toHaveBeenCalledWith('pipeline-7');
  });

  it('does not simulate when the build produced no image', async () => {
    mockBuild.mockResolvedValue({ ...built, image: undefined });

    const result = await new RulePipelineProcessor(loadArtifactProfile({})).process(fakeJob(true).job as never);

    expect(result.simulation).toBeUndefined();
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('keeps what a failed build did and the stage it failed at, and does not simulate', async () => {
    mockBuild.mockRejectedValue(new RuleBuildError('npm build failed (exit 2)', { ...built, package: undefined, image: undefined }, 'package'));
    const { job } = fakeJob(true);

    const result = await new RulePipelineProcessor(loadArtifactProfile({})).process(job as never);

    expect(result).toMatchObject({ error: 'npm build failed (exit 2)', failedStage: 'package', reportHtml: '<html/>', build: { tests: built.tests } });
    expect(result.packageTgz).toBeUndefined();
    expect(mockSpawn).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { loadArtifactProfile } from '../../src/services/rule-pipeline/artifact-profile';
import type { RuleBuildJobData } from '../../src/services/rule-pipeline/rule-pipeline.types';

const mockBuild = jest.fn<(source: unknown, options: { onStage?: (s: string) => void; onTests?: (tests: unknown, html?: string) => void }) => Promise<unknown>>();
jest.mock('../../src/services/rule-pipeline/rule-pipeline.service', () => ({
  ...jest.requireActual<object>('../../src/services/rule-pipeline/rule-pipeline.service'),
  RulePipelineService: jest.fn().mockImplementation(() => ({ build: mockBuild })),
}));

import { RuleBuildError, RulePipelineService } from '../../src/services/rule-pipeline/rule-pipeline.service';
import { RulePipelineProcessor } from '../../src/services/rule-pipeline/rule-pipeline.processor';

const source = { ruleId: '903', version: '4.0.0', ruleCode: 'x', testCode: 'y', tenantId: 'DEFAULT' };
const built = {
  ruleId: '903',
  version: '4.0.0',
  tests: { total: 4, passed: 4, failed: 0, success: true, coverageThresholdMet: false },
  durationsMs: {},
  reportHtml: '<html/>',
  package: { file: 'tazama-lf-rule-903-4.0.0.tgz', integrity: 'sha512-abc', shasum: 'def', size: 3, tgz: Buffer.from('tgz') },
  image: { ref: 'localhost:5000/tazama/default-rule-903:4.0.0', id: 'sha256:img', digest: 'sha256:man' },
};

function fakeJob() {
  const progress: unknown[] = [];
  return {
    progress,
    job: {
      id: '7',
      data: { ruleDbId: 1, ruleConfigId: '903@4.0.0', source } as RuleBuildJobData,
      updateProgress: jest.fn(async (p: unknown) => {
        progress.push(p);
      }),
    },
  };
}

const processor = (): RulePipelineProcessor => new RulePipelineProcessor(loadArtifactProfile({}));

describe('RulePipelineProcessor', () => {
  beforeEach(() => {
    (RulePipelineService as unknown as jest.Mock).mockImplementation(() => ({ build: mockBuild }));
    mockBuild.mockImplementation(async (_s, options) => {
      options.onStage?.('test');
      options.onTests?.(built.tests, '<html/>');
      options.onStage?.('package');
      return built;
    });
  });

  it('stores the package as base64 next to the build and reports stages, with the tests and report once they ran', async () => {
    const { job, progress } = fakeJob();

    const result = await processor().process(job as never);

    expect(result.packageTgz).toBe(Buffer.from('tgz').toString('base64'));
    expect(result.build.package).toEqual({ file: 'tazama-lf-rule-903-4.0.0.tgz', integrity: 'sha512-abc', shasum: 'def', size: 3 });
    expect(result.build.image).toEqual(built.image);
    expect(result.reportHtml).toBe('<html/>');
    expect(progress).toEqual([
      { stage: 'test' },
      { stage: 'test', tests: built.tests, reportHtml: '<html/>' },
      { stage: 'package', tests: built.tests, reportHtml: '<html/>' },
    ]);
  });

  it('keeps what a broken build produced, with the stage it broke at', async () => {
    mockBuild.mockRejectedValueOnce(new RuleBuildError('npm build failed (exit 2)', { ...built, package: undefined, image: undefined }, 'package'));

    const result = await processor().process(fakeJob().job as never);

    expect(result).toMatchObject({ error: 'npm build failed (exit 2)', failedStage: 'package', reportHtml: '<html/>', build: { tests: built.tests } });
    expect(result.packageTgz).toBeUndefined();
  });

  it('fails the job on anything but a build error', async () => {
    mockBuild.mockRejectedValueOnce(new Error('docker socket gone'));

    await expect(processor().process(fakeJob().job as never)).rejects.toThrow('docker socket gone');
  });
});

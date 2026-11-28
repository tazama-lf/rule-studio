import { ConfigService } from '@nestjs/config';
import { FeatureFlagsService } from '../../src/common/feature-flags/feature-flags.service';

const mkConfig = (value: boolean | undefined, rulePipeline?: boolean): ConfigService =>
  ({
    get: <T,>(key: string): T | undefined =>
      (({ DOCKER_PUBLISH: value, RULE_PIPELINE_ENABLED: rulePipeline }) as Record<string, unknown>)[key] as T | undefined,
  }) as ConfigService;

describe('FeatureFlagsService', () => {
  it('reports enabled when ConfigService returns true', () => {
    const s = new FeatureFlagsService(mkConfig(true));
    expect(s.isDockerPublishEnabled()).toBe(true);
    expect(s.isSimStudioEnabled()).toBe(true);
  });

  it('reports disabled when ConfigService returns false', () => {
    const s = new FeatureFlagsService(mkConfig(false));
    expect(s.isDockerPublishEnabled()).toBe(false);
    expect(s.isSimStudioEnabled()).toBe(false);
  });

  it('reports disabled when ConfigService returns undefined (no validate wiring)', () => {
    const s = new FeatureFlagsService(mkConfig(undefined));
    expect(s.isDockerPublishEnabled()).toBe(false);
    expect(s.isSimStudioEnabled()).toBe(false);
  });

  it('reports the rule pipeline separately from Docker Hub publishing', () => {
    expect(new FeatureFlagsService(mkConfig(false, true)).isRulePipelineEnabled()).toBe(true);
    expect(new FeatureFlagsService(mkConfig(false, true)).isSimStudioEnabled()).toBe(false);
    expect(new FeatureFlagsService(mkConfig(true, undefined)).isRulePipelineEnabled()).toBe(false);
  });
});

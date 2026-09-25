import { ConfigService } from '@nestjs/config';
import { FeatureFlagsService } from '../../src/common/feature-flags/feature-flags.service';

const mkConfig = (value: boolean | undefined): ConfigService =>
  ({
    get: <T,>(key: string): T | undefined => (key === 'DOCKER_PUBLISH' ? (value as unknown as T) : undefined),
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
});

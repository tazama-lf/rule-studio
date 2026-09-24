import { FeatureFlagsService } from '../../src/common/feature-flags/feature-flags.service';

describe('FeatureFlagsService', () => {
  const withEnv = (value: string | undefined, fn: () => void) => {
    const prev = process.env.DOCKER_PUBLISH;
    if (value === undefined) delete process.env.DOCKER_PUBLISH;
    else process.env.DOCKER_PUBLISH = value;
    try {
      fn();
    } finally {
      if (prev === undefined) delete process.env.DOCKER_PUBLISH;
      else process.env.DOCKER_PUBLISH = prev;
    }
  };

  it.each(['true', 'TRUE', '  true  ', '1', 'yes', 'on', 'ON'])('parses %j as enabled', (v) => {
    withEnv(v, () => {
      const s = new FeatureFlagsService();
      expect(s.isDockerPublishEnabled()).toBe(true);
      expect(s.isSimStudioEnabled()).toBe(true);
    });
  });

  it.each([undefined, '', 'false', '0', 'no', 'off', 'FALSE', 'random'])('parses %j as disabled', (v) => {
    withEnv(v, () => {
      const s = new FeatureFlagsService();
      expect(s.isDockerPublishEnabled()).toBe(false);
      expect(s.isSimStudioEnabled()).toBe(false);
    });
  });
});

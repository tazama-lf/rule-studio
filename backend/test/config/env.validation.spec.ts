import { validate } from '../../src/services/config/env.validation';

const baseValid = {
  NODE_ENV: 'development',
  MAX_CPU: '2',
  FUNCTION_NAME: 'rule-studio-backend',
  TAZAMA_AUTH_URL: 'http://localhost:3020/v1/auth',
  AUTH_PUBLIC_KEY_PATH: 'public-key.pem',
  CERT_PATH_PUBLIC: 'public-key.pem',
};

describe('validate() — env.validation', () => {
  it('passes with DOCKER_PUBLISH unset (defaults to false)', () => {
    const result = validate({ ...baseValid });
    expect(result.DOCKER_PUBLISH).toBe(false);
  });

  it('passes with DOCKER_PUBLISH=false and no DOCKERHUB_* set', () => {
    const result = validate({ ...baseValid, DOCKER_PUBLISH: 'false' });
    expect(result.DOCKER_PUBLISH).toBe(false);
  });

  it('passes with DOCKER_PUBLISH=true and the full DOCKERHUB_* trio', () => {
    const result = validate({
      ...baseValid,
      DOCKER_PUBLISH: 'true',
      DOCKERHUB_TOKEN: 'dckr_pat_x',
      DOCKERHUB_USERNAME: 'user',
      DOCKERHUB_NAMESPACE: 'ns',
    });
    expect(result.DOCKER_PUBLISH).toBe(true);
  });

  it('does NOT throw when DOCKER_PUBLISH=true and the DOCKERHUB_* trio is missing (feature stays disabled at runtime instead)', () => {
    expect(() => validate({ ...baseValid, DOCKER_PUBLISH: 'true' })).not.toThrow();
  });

  it('still throws on unrelated required-var misconfiguration (e.g. missing MAX_CPU)', () => {
    const { MAX_CPU: _drop, ...withoutMaxCpu } = baseValid;
    expect(() => validate({ ...withoutMaxCpu })).toThrow();
  });

  it('coerces truthy strings for DOCKER_PUBLISH', () => {
    for (const v of ['true', 'TRUE', '1', 'yes', 'on']) {
      const result = validate({
        ...baseValid,
        DOCKER_PUBLISH: v,
        DOCKERHUB_TOKEN: 'x',
        DOCKERHUB_USERNAME: 'y',
        DOCKERHUB_NAMESPACE: 'z',
      });
      expect(result.DOCKER_PUBLISH).toBe(true);
    }
  });
});

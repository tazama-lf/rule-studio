import { Logger } from '@nestjs/common';
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

  it('keeps the rule pipeline off unless RULE_PIPELINE_ENABLED is true, independent of Docker Hub', () => {
    expect(validate({ ...baseValid }).RULE_PIPELINE_ENABLED).toBe(false);
    expect(validate({ ...baseValid, RULE_PIPELINE_ENABLED: 'true' }).RULE_PIPELINE_ENABLED).toBe(true);
    expect(validate({ ...baseValid, RULE_PIPELINE_ENABLED: 'true' }).DOCKER_PUBLISH).toBe(false);
  });

  it('passes with DOCKER_PUBLISH=false and no IMAGE_* set', () => {
    const result = validate({ ...baseValid, DOCKER_PUBLISH: 'false' });
    expect(result.DOCKER_PUBLISH).toBe(false);
  });

  it('passes with DOCKER_PUBLISH=true and Docker Hub with its namespace and credentials', () => {
    const result = validate({
      ...baseValid,
      DOCKER_PUBLISH: 'true',
      IMAGE_REGISTRY_TOKEN: 'dckr_pat_x',
      IMAGE_REGISTRY_USERNAME: 'user',
      IMAGE_NAMESPACE: 'ns',
    });
    expect(result.DOCKER_PUBLISH).toBe(true);
  });

  it('needs only IMAGE_NAMESPACE for a registry other than Docker Hub', () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const result = validate({ ...baseValid, DOCKER_PUBLISH: 'true', IMAGE_REGISTRY: 'localhost:5000', IMAGE_NAMESPACE: 'ns' });
    expect(result.IMAGE_REGISTRY).toBe('localhost:5000');
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns, without throwing, when Docker Hub credentials are missing', () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    expect(() => validate({ ...baseValid, DOCKER_PUBLISH: 'true', IMAGE_NAMESPACE: 'ns' })).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('IMAGE_REGISTRY_USERNAME, IMAGE_REGISTRY_TOKEN'));
    warn.mockRestore();
  });

  it('does NOT throw when DOCKER_PUBLISH=true and the IMAGE_* settings are missing (feature stays disabled at runtime instead)', () => {
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
        IMAGE_REGISTRY_TOKEN: 'x',
        IMAGE_REGISTRY_USERNAME: 'y',
        IMAGE_NAMESPACE: 'z',
      });
      expect(result.DOCKER_PUBLISH).toBe(true);
    }
  });
});

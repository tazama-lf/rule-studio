import { ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { SimStudioDisabledGuard } from '../../src/common/feature-flags/simstudio-disabled.guard';
import { FeatureFlagsService } from '../../src/common/feature-flags/feature-flags.service';

const mkHttpContext = (url: string): ExecutionContext =>
  ({
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => ({ baseUrl: '', path: url, url }),
    }),
  }) as unknown as ExecutionContext;

const mkWsContext = (): ExecutionContext =>
  ({
    getType: () => 'ws',
    switchToHttp: () => {
      throw new Error('switchToHttp should not be called for ws contexts');
    },
  }) as unknown as ExecutionContext;

const enabled = { isSimStudioEnabled: () => true, isDockerPublishEnabled: () => true } as unknown as FeatureFlagsService;
const disabled = { isSimStudioEnabled: () => false, isDockerPublishEnabled: () => false } as unknown as FeatureFlagsService;

describe('SimStudioDisabledGuard', () => {
  it('allows any route when SimStudio is enabled', () => {
    const guard = new SimStudioDisabledGuard(enabled);
    expect(guard.canActivate(mkHttpContext('/simulation-studio/foo'))).toBe(true);
    expect(guard.canActivate(mkHttpContext('/rules'))).toBe(true);
  });

  it('allows non-SimStudio routes when disabled', () => {
    const guard = new SimStudioDisabledGuard(disabled);
    expect(guard.canActivate(mkHttpContext('/rules'))).toBe(true);
    expect(guard.canActivate(mkHttpContext('/config/api/features'))).toBe(true);
    expect(guard.canActivate(mkHttpContext('/masking'))).toBe(true);
  });

  it('throws ServiceUnavailableException on /simulation-studio/* when disabled', () => {
    const guard = new SimStudioDisabledGuard(disabled);
    expect(() => guard.canActivate(mkHttpContext('/simulation-studio/dockerhub/api/rules'))).toThrow(ServiceUnavailableException);
    expect(() => guard.canActivate(mkHttpContext('/simulation-studio/ephemeral/spawn'))).toThrow(ServiceUnavailableException);
    expect(() => guard.canActivate(mkHttpContext('/simulation-studio/generations'))).toThrow(ServiceUnavailableException);
  });

  it('throws on the exact /simulation-studio path (no trailing segment) when disabled', () => {
    const guard = new SimStudioDisabledGuard(disabled);
    expect(() => guard.canActivate(mkHttpContext('/simulation-studio'))).toThrow(ServiceUnavailableException);
  });

  it('is case-insensitive — matches uppercase and mixed-case SimStudio paths when disabled', () => {
    const guard = new SimStudioDisabledGuard(disabled);
    expect(() => guard.canActivate(mkHttpContext('/SIMULATION-STUDIO/dockerhub/api/rules'))).toThrow(ServiceUnavailableException);
    expect(() => guard.canActivate(mkHttpContext('/Simulation-Studio/generations'))).toThrow(ServiceUnavailableException);
  });

  it('does not false-positive on paths that merely have the prefix as a substring', () => {
    const guard = new SimStudioDisabledGuard(disabled);
    expect(guard.canActivate(mkHttpContext('/simulation-studiox'))).toBe(true);
    expect(guard.canActivate(mkHttpContext('/some-simulation-studio-adjacent'))).toBe(true);
  });

  it('skips non-HTTP execution contexts (WebSocket / microservice)', () => {
    const guard = new SimStudioDisabledGuard(disabled);
    expect(guard.canActivate(mkWsContext())).toBe(true);
  });
});

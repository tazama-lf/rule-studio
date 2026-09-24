import { ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { SimStudioDisabledGuard } from '../../src/common/feature-flags/simstudio-disabled.guard';
import { FeatureFlagsService } from '../../src/common/feature-flags/feature-flags.service';

const mkContext = (url: string): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ baseUrl: '', path: url, url }),
    }),
  } as unknown as ExecutionContext);

const enabled = { isSimStudioEnabled: () => true, isDockerPublishEnabled: () => true } as unknown as FeatureFlagsService;
const disabled = { isSimStudioEnabled: () => false, isDockerPublishEnabled: () => false } as unknown as FeatureFlagsService;

describe('SimStudioDisabledGuard', () => {
  it('allows any route when SimStudio is enabled', () => {
    const guard = new SimStudioDisabledGuard(enabled);
    expect(guard.canActivate(mkContext('/simulation-studio/foo'))).toBe(true);
    expect(guard.canActivate(mkContext('/rules'))).toBe(true);
  });

  it('allows non-SimStudio routes when disabled', () => {
    const guard = new SimStudioDisabledGuard(disabled);
    expect(guard.canActivate(mkContext('/rules'))).toBe(true);
    expect(guard.canActivate(mkContext('/config/api/features'))).toBe(true);
    expect(guard.canActivate(mkContext('/masking'))).toBe(true);
  });

  it('throws ServiceUnavailableException on /simulation-studio/* when disabled', () => {
    const guard = new SimStudioDisabledGuard(disabled);
    expect(() => guard.canActivate(mkContext('/simulation-studio/dockerhub/api/rules'))).toThrow(
      ServiceUnavailableException,
    );
    expect(() => guard.canActivate(mkContext('/simulation-studio/ephemeral/spawn'))).toThrow(
      ServiceUnavailableException,
    );
    expect(() => guard.canActivate(mkContext('/simulation-studio/generations'))).toThrow(
      ServiceUnavailableException,
    );
  });

  it('does not match paths that merely contain "simulation-studio" as a substring', () => {
    const guard = new SimStudioDisabledGuard(disabled);
    // Ensures the prefix check requires the leading slash + full segment
    expect(guard.canActivate(mkContext('/some-simulation-studio-adjacent'))).toBe(true);
  });
});

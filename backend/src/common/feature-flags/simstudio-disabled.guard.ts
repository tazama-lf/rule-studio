import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Request } from 'express';
import { FeatureFlagsService } from './feature-flags.service';

const SIMSTUDIO_PATH_PREFIX = '/simulation-studio';

@Injectable()
export class SimStudioDisabledGuard implements CanActivate {
  constructor(private readonly features: FeatureFlagsService) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.features.isSimStudioEnabled()) return true;
    // Skip non-HTTP contexts (WebSocket gateways, microservice handlers). The
    // request object below only exists for HTTP; other transports would blow up
    // on baseUrl/path access.
    if (context.getType() !== 'http') return true;

    const req = context.switchToHttp().getRequest<Request>();
    const pathname = `${req.baseUrl}${req.path}`.toLowerCase();
    // Express routing is case-insensitive by default; also guard against a
    // false-positive on paths that merely start with `simulation-studio` as a
    // substring (e.g. `/simulation-studiox`).
    const isSimStudio = pathname === SIMSTUDIO_PATH_PREFIX || pathname.startsWith(`${SIMSTUDIO_PATH_PREFIX}/`);
    if (!isSimStudio) return true;

    throw new ServiceUnavailableException({
      feature: 'sim-studio',
      enabled: false,
      message:
        'SimStudio (and Docker Hub publishing) is disabled on this deployment. ' +
        'Set DOCKER_PUBLISH=true and configure DOCKERHUB_TOKEN / DOCKERHUB_USERNAME / DOCKERHUB_NAMESPACE to enable.',
    });
  }
}

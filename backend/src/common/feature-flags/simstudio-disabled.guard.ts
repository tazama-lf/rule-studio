import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Request } from 'express';
import { FeatureFlagsService } from './feature-flags.service';

const SIMSTUDIO_PATH_PREFIX = '/simulation-studio';

@Injectable()
export class SimStudioDisabledGuard implements CanActivate {
  constructor(private readonly features: FeatureFlagsService) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.features.isSimStudioEnabled()) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const pathname = req.baseUrl + req.path;
    if (!pathname.startsWith(SIMSTUDIO_PATH_PREFIX)) return true;

    throw new ServiceUnavailableException({
      feature: 'sim-studio',
      enabled: false,
      message:
        'SimStudio (and Docker Hub publishing) is disabled on this deployment. ' +
        'Set DOCKER_PUBLISH=true and configure DOCKERHUB_TOKEN / DOCKERHUB_USERNAME / DOCKERHUB_NAMESPACE to enable.',
    });
  }
}

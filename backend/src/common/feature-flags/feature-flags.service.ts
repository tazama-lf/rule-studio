import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);
  private readonly dockerPublish: boolean;

  constructor(config: ConfigService) {
    // `env.validation.ts` already coerces DOCKER_PUBLISH to a real boolean via
    // `@Transform(toBool)`; keeping a single source of truth avoids drift
    // between validation and runtime parsing.
    this.dockerPublish = config.get<boolean>('DOCKER_PUBLISH') === true;
    this.logger.log(`Feature flags: DOCKER_PUBLISH=${this.dockerPublish} (governs Docker Hub publishing and the whole SimStudio surface)`);
  }

  isDockerPublishEnabled(): boolean {
    return this.dockerPublish;
  }

  // Separate accessor so the two features can be split later without touching
  // every call site.
  isSimStudioEnabled(): boolean {
    return this.dockerPublish;
  }
}

import { Injectable, Logger } from '@nestjs/common';

const TRUTHY = new Set(['true', '1', 'yes', 'on']);

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);
  private readonly dockerPublish: boolean;

  constructor() {
    this.dockerPublish = TRUTHY.has((process.env.DOCKER_PUBLISH ?? '').trim().toLowerCase());
    this.logger.log(
      `Feature flags: DOCKER_PUBLISH=${this.dockerPublish} (governs Docker Hub publishing and the whole SimStudio surface)`,
    );
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

import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';

export interface TenantDockerHubCredentials {
  tenantId: string;
  token: string;
  username: string;
  namespace: string;
}

/**
 * Scans process.env at startup for all tenant Docker Hub configurations.
 *
 * Expected env-var pattern (PREFIX is any alphanumeric+underscore string):
 *   <PREFIX>_TENANT_NAME      = <tenantId>
 *   <PREFIX>_DOCKERHUB_TOKEN  = <PAT>
 *   <PREFIX>_DOCKERHUB_USERNAME = <username>
 *   <PREFIX>_DOCKERHUB_NAMESPACE = <namespace>
 *
 * Example:
 *   CBE_TENANT_NAME=cbe
 *   CBE_DOCKERHUB_TOKEN=dckr_pat_...
 *   CBE_DOCKERHUB_USERNAME=sohaib1083
 *   CBE_DOCKERHUB_NAMESPACE=pslcopilot
 *
 *   TENANT_001_TENANT_NAME=tenant_001
 *   TENANT_001_DOCKERHUB_TOKEN=dckr_pat_...
 *   TENANT_001_DOCKERHUB_USERNAME=org2user
 *   TENANT_001_DOCKERHUB_NAMESPACE=org2namespace
 */
@Injectable()
export class TenantConfigService implements OnModuleInit {
  private readonly logger = new Logger(TenantConfigService.name);

  /** Map of tenantId → credentials, populated on module init. */
  private readonly credentialsMap = new Map<string, TenantDockerHubCredentials>();

  onModuleInit(): void {
    this.loadTenantConfigs();
  }

  private loadTenantConfigs(): void {
    const { env } = process;

    // Collect all keys that end with _TENANT_NAME to discover prefixes
    const tenantNameKeys = Object.keys(env).filter((k) => k.endsWith('_TENANT_NAME'));

    for (const key of tenantNameKeys) {
      const prefix = key.slice(0, key.length - '_TENANT_NAME'.length); // e.g. "CBE"
      const tenantId = env[key]?.trim();

      if (!tenantId) {
        this.logger.warn(`${key} is set but empty — skipping`);
        continue;
      }

      const token = env[`${prefix}_DOCKERHUB_TOKEN`]?.trim();
      const username = env[`${prefix}_DOCKERHUB_USERNAME`]?.trim();
      const namespace = env[`${prefix}_DOCKERHUB_NAMESPACE`]?.trim();

      if (!token || !username || !namespace) {
        this.logger.warn(
          `Tenant "${tenantId}" (prefix: ${prefix}) is missing one or more Docker Hub vars ` +
          '(TOKEN/USERNAME/NAMESPACE) — skipping',
        );
        continue;
      }

      this.credentialsMap.set(tenantId.toLowerCase(), { tenantId, token, username, namespace });
      this.logger.log(`Registered Docker Hub config for tenant "${tenantId}" → namespace "${namespace}"`);
    }

    if (this.credentialsMap.size === 0) {
      this.logger.warn('No tenant Docker Hub configurations found in environment variables');
    }
  }

  /**
   * Returns the Docker Hub credentials for the given tenantId.
   * Throws UnauthorizedException if the tenant is not configured.
   */
  getCredentials(tenantId: string): TenantDockerHubCredentials {
    const creds = this.credentialsMap.get(tenantId.toLowerCase());
    if (!creds) {
      throw new UnauthorizedException(
        `No Docker Hub configuration found for tenant "${tenantId}". ` +
        `Ensure the corresponding env vars are set (e.g. <PREFIX>_TENANT_NAME=${tenantId}).`,
      );
    }
    return creds;
  }

  /** Returns all registered tenant IDs (for diagnostics/admin use). */
  getRegisteredTenants(): string[] {
    return [...this.credentialsMap.keys()];
  }
}

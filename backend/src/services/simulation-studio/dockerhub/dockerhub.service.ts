import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { TenantConfigService } from './tenant-config.service';
import type { DockerHubRepositoriesResponseDto, DockerHubTagsResponseDto } from './dto/dockerhub.dto';
import type { DhLoginResponse, DhRepository, DhRepositoriesPage, DhTagResult, DhTagsPage } from '../../../interfaces/dockerhub.interfaces';

const DOCKERHUB_API = 'https://hub.docker.com/v2';

@Injectable()
export class DockerHubService {
  private readonly logger = new Logger(DockerHubService.name);

  constructor(private readonly tenantConfigService: TenantConfigService) { }

  private getTenantRulePrefix(tenantId: string): string {
    return `${tenantId.toLowerCase()}-`;
  }

  private toTenantRuleName(tenantId: string, ruleName: string): string {
    const trimmedRuleName = ruleName.trim();
    const prefix = this.getTenantRulePrefix(tenantId);
    const normalized = trimmedRuleName.toLowerCase();

    return normalized.startsWith(prefix) ? trimmedRuleName : `${prefix}${trimmedRuleName}`;
  }

  /**
   * Exchange the tenant's PAT for a short-lived Docker Hub JWT.
   * The PAT is read from env via TenantConfigService — never from the request.
   */
  private async getAuthToken(tenantId: string): Promise<{ authToken: string; namespace: string }> {
    const creds = this.tenantConfigService.getCredentials(tenantId);

    const response = await fetch(`${DOCKERHUB_API}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: creds.username, password: creds.token }),
    });

    if (!response.ok) {
      this.logger.error(`Docker Hub login failed for tenant "${tenantId}": ${response.status} ${response.statusText}`);
      throw new InternalServerErrorException('Failed to authenticate with Docker Hub');
    }

    const data = (await response.json()) as DhLoginResponse;
    return { authToken: data.token, namespace: creds.namespace };
  }

  /**
   * Recursively fetches all pages of repositories for a namespace.
   * Avoids await-in-loop by using recursion instead of a while loop.
   */
  private async fetchRepoPage(url: string, authToken: string, tenantId: string): Promise<DhRepository[]> {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${authToken}` } });

    if (!response.ok) {
      this.logger.error(`Docker Hub repositories fetch failed for tenant "${tenantId}": ${response.status} ${response.statusText}`);
      throw new InternalServerErrorException('Failed to fetch rules from Docker Hub');
    }

    const page = (await response.json()) as DhRepositoriesPage;
    const remaining = page.next ? await this.fetchRepoPage(page.next, authToken, tenantId) : [];
    return [...page.results, ...remaining];
  }

  /**
   * Recursively fetches all pages of tags for a repository.
   * Avoids await-in-loop by using recursion instead of a while loop.
   */
  private async fetchTagPage(
    url: string,
    authToken: string,
    tenantId: string,
    ruleName: string,
    namespace: string,
  ): Promise<DhTagResult[]> {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${authToken}` } });

    if (response.status === 404) {
      throw new NotFoundException(`Rule "${ruleName}" not found in Docker Hub namespace "${namespace}" for tenant "${tenantId}"`);
    }

    if (!response.ok) {
      this.logger.error(`Docker Hub tags fetch failed for tenant "${tenantId}": ${response.status} ${response.statusText}`);
      throw new InternalServerErrorException(`Failed to fetch tags for rule "${ruleName}" from Docker Hub`);
    }

    const page = (await response.json()) as DhTagsPage;
    const remaining = page.next ? await this.fetchTagPage(page.next, authToken, tenantId, ruleName, namespace) : [];
    return [...page.results, ...remaining];
  }

  /** Fetch all repositories for the tenant's namespace. */
  async getPublishedRules(tenantId: string): Promise<DockerHubRepositoriesResponseDto> {
    const { authToken, namespace } = await this.getAuthToken(tenantId);
    const firstUrl = `${DOCKERHUB_API}/namespaces/${namespace}/repositories?page_size=100`;
    const repos = await this.fetchRepoPage(firstUrl, authToken, tenantId);
    const tenantRulePrefix = this.getTenantRulePrefix(tenantId);
    const tenantRepos = repos.filter((r) => r.name.toLowerCase().startsWith(tenantRulePrefix));

    this.logger.log(
      `Fetched ${tenantRepos.length}/${repos.length} rules for tenant "${tenantId}" with prefix "${tenantRulePrefix}" from namespace "${namespace}"`,
    );

    return {
      rules: tenantRepos.map((r) => ({
        name: r.name,
        namespace: r.namespace,
        repository_type: r.repository_type,
        pull_count: r.pull_count,
        last_updated: r.last_updated,
      })),
      count: tenantRepos.length,
    };
  }

  /** Fetch all tags for a given rule in the tenant's namespace. */
  async getTagsForRule(tenantId: string, ruleName: string): Promise<DockerHubTagsResponseDto> {
    const { authToken, namespace } = await this.getAuthToken(tenantId);
    const tenantRuleName = this.toTenantRuleName(tenantId, ruleName);
    const firstUrl = `${DOCKERHUB_API}/namespaces/${namespace}/repositories/${encodeURIComponent(tenantRuleName)}/tags?page_size=100`;
    const tags = await this.fetchTagPage(firstUrl, authToken, tenantId, tenantRuleName, namespace);

    this.logger.log(
      `Fetched ${tags.length} tags for rule "${tenantRuleName}" (tenant "${tenantId}", namespace "${namespace}")`,
    );

    return {
      rule: tenantRuleName,
      tags: tags.map((t) => ({
        name: t.name,
        last_updated: t.last_updated,
        digest: t.digest,
      })),
      count: tags.length,
    };
  }
}


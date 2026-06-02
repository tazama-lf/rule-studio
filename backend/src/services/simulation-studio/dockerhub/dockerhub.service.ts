import { Injectable, Logger, OnModuleInit, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DockerHubRepositoriesResponseDto, DockerHubTagsResponseDto } from './dto/dockerhub.dto';
import type { DhLoginResponse, DhRepository, DhRepositoriesPage, DhTagResult, DhTagsPage } from '../../../interfaces/dockerhub.interfaces';

const DOCKERHUB_API = 'https://hub.docker.com/v2';

@Injectable()
export class DockerHubService implements OnModuleInit {
  private readonly logger = new Logger(DockerHubService.name);
  private username: string;
  private token: string;
  private namespace: string;

  constructor(private readonly configService: ConfigService) { }

  onModuleInit(): void {
    const token = this.configService.get<string>('DOCKERHUB_TOKEN');
    const username = this.configService.get<string>('DOCKERHUB_USERNAME');
    const namespace = this.configService.get<string>('DOCKERHUB_NAMESPACE');

    if (!token || !username || !namespace) {
      throw new Error(
        'Missing required Docker Hub environment variables: DOCKERHUB_TOKEN, DOCKERHUB_USERNAME, DOCKERHUB_NAMESPACE',
      );
    }

    this.token = token;
    this.username = username;
    this.namespace = namespace;

    this.logger.log(`Docker Hub configured for namespace "${this.namespace}"`);
  }

  private getTenantRulePrefix(tenantId: string): string {
    return `${tenantId.toLowerCase()}-`;
  }

  private toTenantRuleName(tenantId: string, ruleName: string): string {
    const trimmedRuleName = ruleName.trim();
    const prefix = this.getTenantRulePrefix(tenantId);
    const normalized = trimmedRuleName.toLowerCase();

    return normalized.startsWith(prefix) ? trimmedRuleName : `${prefix}${trimmedRuleName}`;
  }

  private async getAuthToken(): Promise<string> {
    const response = await fetch(`${DOCKERHUB_API}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.username, password: this.token }),
    });

    if (!response.ok) {
      this.logger.error(`Docker Hub login failed: ${response.status} ${response.statusText}`);
      throw new InternalServerErrorException('Failed to authenticate with Docker Hub');
    }

    const data = (await response.json()) as DhLoginResponse;
    return data.token;
  }

  private async fetchRepoPage(url: string, authToken: string): Promise<DhRepository[]> {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${authToken}` } });

    if (!response.ok) {
      this.logger.error(`Docker Hub repositories fetch failed: ${response.status} ${response.statusText}`);
      throw new InternalServerErrorException('Failed to fetch rules from Docker Hub');
    }

    const page = (await response.json()) as DhRepositoriesPage;
    const remaining = page.next ? await this.fetchRepoPage(page.next, authToken) : [];
    return [...page.results, ...remaining];
  }

  private async fetchTagPage(url: string, authToken: string, ruleName: string): Promise<DhTagResult[]> {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${authToken}` } });

    if (response.status === 404) {
      throw new NotFoundException(`Rule "${ruleName}" not found in Docker Hub namespace "${this.namespace}"`);
    }

    if (!response.ok) {
      this.logger.error(`Docker Hub tags fetch failed: ${response.status} ${response.statusText}`);
      throw new InternalServerErrorException(`Failed to fetch tags for rule "${ruleName}" from Docker Hub`);
    }

    const page = (await response.json()) as DhTagsPage;
    const remaining = page.next ? await this.fetchTagPage(page.next, authToken, ruleName) : [];
    return [...page.results, ...remaining];
  }

  /** Fetch all repositories in the configured namespace, filtered by tenant prefix. */
  async getPublishedRules(tenantId: string): Promise<DockerHubRepositoriesResponseDto> {
    const authToken = await this.getAuthToken();
    const firstUrl = `${DOCKERHUB_API}/namespaces/${this.namespace}/repositories?page_size=100`;
    const repos = await this.fetchRepoPage(firstUrl, authToken);
    const tenantRulePrefix = this.getTenantRulePrefix(tenantId);
    const tenantRepos = repos.filter((r) => r.name.toLowerCase().startsWith(tenantRulePrefix));

    this.logger.log(
      `Fetched ${tenantRepos.length} rules for tenant "${tenantId}" `,
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

  /** Fetch all tags for a given rule in the configured namespace. */
  async getTagsForRule(tenantId: string, ruleName: string): Promise<DockerHubTagsResponseDto> {
    const authToken = await this.getAuthToken();
    const tenantRuleName = this.toTenantRuleName(tenantId, ruleName);
    const firstUrl = `${DOCKERHUB_API}/namespaces/${this.namespace}/repositories/${encodeURIComponent(tenantRuleName)}/tags?page_size=100`;
    const tags = await this.fetchTagPage(firstUrl, authToken, tenantRuleName);

    this.logger.log(
      `Fetched ${tags.length} tags for rule "${tenantRuleName}" (tenant "${tenantId}", namespace "${this.namespace}")`,
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


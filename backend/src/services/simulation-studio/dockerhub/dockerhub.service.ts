import {
  Injectable,
  Logger,
  OnModuleInit,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureFlagsService } from '../../../common/feature-flags/feature-flags.service';
import type { DockerHubRepositoriesResponseDto, DockerHubTagsResponseDto } from './dto/dockerhub.dto';
import type { DhRepository, DhRepositoriesPage, DhTagResult, DhTagsPage } from '../../../interfaces/dockerhub.interfaces';
import { type ImageRegistry, loadImageRegistry, registryApiUrl, tenantRepository } from '../../../common/image-registry';

const DOCKERHUB_API = 'https://hub.docker.com/v2';

@Injectable()
export class DockerHubService implements OnModuleInit {
  private readonly logger = new Logger(DockerHubService.name);
  private readonly timeoutMs = 10_000;
  private namespace: string;
  private token: string;
  private username: string;
  private jwt: string;
  private registry: ImageRegistry;
  // Runtime state — stays false until a successful login has completed.
  private ready = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly features: FeatureFlagsService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.features.isDockerPublishEnabled()) {
      this.logger.warn('DOCKER_PUBLISH is false — Docker Hub publishing (and SimStudio) are disabled. Skipping Docker Hub login at boot.');
      return;
    }

    const namespace = this.configService.get<string>('IMAGE_NAMESPACE');
    this.registry = loadImageRegistry({
      IMAGE_REGISTRY: this.configService.get<string>('IMAGE_REGISTRY'),
      IMAGE_NAMESPACE: namespace,
      IMAGE_REGISTRY_USERNAME: this.configService.get<string>('IMAGE_REGISTRY_USERNAME'),
      IMAGE_REGISTRY_TOKEN: this.configService.get<string>('IMAGE_REGISTRY_TOKEN'),
    });
    const { username, token, dockerHub } = this.registry;

    // Env-validation should already have caught missing values; this defensive
    // check keeps the service usable if the ConfigModule wiring is ever changed.
    if (!namespace || (dockerHub && (!token || !username))) {
      this.logger.error(
        'DOCKER_PUBLISH=true but required image registry environment variables are missing: ' +
          (dockerHub ? 'IMAGE_NAMESPACE, IMAGE_REGISTRY_USERNAME, IMAGE_REGISTRY_TOKEN. ' : 'IMAGE_NAMESPACE. ') +
          'Feature will remain disabled at runtime.',
      );
      return;
    }

    this.token = token ?? '';
    this.username = username ?? '';
    this.namespace = namespace;

    try {
      if (dockerHub) await this.login();
      else await this.pingRegistry();
      this.ready = true;
      this.logger.log(`Image registry ${this.registry.registry} configured for namespace "${this.namespace}"`);
    } catch (err) {
      this.logger.error(`Image registry login failed at boot; feature will remain disabled at runtime. Error: ${(err as Error).message}`);
    }
  }

  /** True when Docker publishing is both enabled by config and successfully authenticated. */
  isReady(): boolean {
    return this.features.isDockerPublishEnabled() && this.ready;
  }

  private assertReady(): void {
    if (!this.isReady()) {
      throw new ServiceUnavailableException({
        feature: 'docker-publish',
        enabled: false,
        message:
          'Docker Hub publishing is disabled on this deployment. ' +
          'Set DOCKER_PUBLISH=true and configure IMAGE_REGISTRY / IMAGE_NAMESPACE (and IMAGE_REGISTRY_USERNAME / IMAGE_REGISTRY_TOKEN for Docker Hub) to enable.',
      });
    }
  }

  private async login(): Promise<void> {
    const response = await fetch(`${DOCKERHUB_API}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.username, password: this.token }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      this.logger.error(`Docker Hub login failed: ${response.status} ${response.statusText}`);
      throw new InternalServerErrorException('Docker Hub login failed');
    }

    const { token } = (await response.json()) as { token: string };
    this.jwt = token;
  }

  private getTenantRulePrefix(tenantId: string): string {
    return `${tenantId.toLowerCase()}-`;
  }

  private toTenantRuleName(tenantId: string, ruleName: string): string {
    return tenantRepository(tenantId, ruleName.trim());
  }

  private async fetchRegistry(path: string): Promise<Response> {
    const { username, token } = this.registry;
    const headers: Record<string, string> =
      username && token ? { Authorization: `Basic ${Buffer.from(`${username}:${token}`).toString('base64')}` } : {};
    const url = /^https?:\/\//.test(path) ? path : `${registryApiUrl(this.registry)}${path}`;
    return await fetch(url, { headers, signal: AbortSignal.timeout(this.timeoutMs) });
  }

  private async pingRegistry(): Promise<void> {
    const response = await this.fetchRegistry('/v2/');
    if (!response.ok) throw new InternalServerErrorException(`Image registry ${this.registry.registry} answered ${response.status}`);
  }

  private async fetchCatalogPage(path: string): Promise<string[]> {
    const response = await this.fetchRegistry(path);
    if (!response.ok) {
      this.logger.error(`Image registry catalog fetch failed: ${response.status} ${response.statusText}`);
      throw new InternalServerErrorException(`Failed to fetch rules from ${this.registry.registry}`);
    }
    const { repositories } = (await response.json()) as { repositories?: string[] };
    const next = /<([^>]+)>;\s*rel="next"/.exec(response.headers.get('link') ?? '')?.[1];
    return [...(repositories ?? []), ...(next ? await this.fetchCatalogPage(next) : [])];
  }

  private async fetchRegistryRepos(): Promise<DhRepository[]> {
    const repositories = await this.fetchCatalogPage('/v2/_catalog?n=1000');
    const prefix = `${this.namespace}/`;
    return repositories
      .filter((repo) => repo.startsWith(prefix))
      .map((repo) => ({
        name: repo.slice(prefix.length),
        namespace: this.namespace,
        repository_type: 'image',
        pull_count: 0,
        last_updated: '',
      }));
  }

  private async fetchRegistryTags(ruleName: string): Promise<DhTagResult[]> {
    const response = await this.fetchRegistry(`/v2/${this.namespace}/${encodeURIComponent(ruleName)}/tags/list`);
    if (response.status === 404) {
      throw new NotFoundException(`Rule "${ruleName}" not found in ${this.registry.registry} namespace "${this.namespace}"`);
    }
    if (!response.ok) {
      this.logger.error(`Image registry tags fetch failed: ${response.status} ${response.statusText}`);
      throw new InternalServerErrorException(`Failed to fetch tags for rule "${ruleName}" from ${this.registry.registry}`);
    }
    const { tags } = (await response.json()) as { tags?: string[] | null };
    return (tags ?? []).map((name) => ({ name, last_updated: '', digest: '' }));
  }

  private async fetchDockerHub(url: string): Promise<Response> {
    const doFetch = async (): Promise<Response> =>
      await fetch(url, {
        headers: { Authorization: `Bearer ${this.jwt}` },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

    let response = await doFetch();
    if (response.status === 401) {
      await this.login();
      response = await doFetch();
    }
    return response;
  }

  private async fetchRepoPage(url: string): Promise<DhRepository[]> {
    const response = await this.fetchDockerHub(url);

    if (!response.ok) {
      this.logger.error(`Docker Hub repositories fetch failed: ${response.status} ${response.statusText}`);
      throw new InternalServerErrorException('Failed to fetch rules from Docker Hub');
    }

    const page = (await response.json()) as DhRepositoriesPage;
    const remaining = page.next ? await this.fetchRepoPage(page.next) : [];
    return [...page.results, ...remaining];
  }

  private async fetchTagPage(url: string, ruleName: string): Promise<DhTagResult[]> {
    const response = await this.fetchDockerHub(url);

    if (response.status === 404) {
      throw new NotFoundException(`Rule "${ruleName}" not found in Docker Hub namespace "${this.namespace}"`);
    }

    if (!response.ok) {
      this.logger.error(`Docker Hub tags fetch failed: ${response.status} ${response.statusText}`);
      throw new InternalServerErrorException(`Failed to fetch tags for rule "${ruleName}" from Docker Hub`);
    }

    const page = (await response.json()) as DhTagsPage;
    const remaining = page.next ? await this.fetchTagPage(page.next, ruleName) : [];
    return [...page.results, ...remaining];
  }

  /** Fetch all repositories in the configured namespace, filtered by tenant prefix. */
  async getPublishedRules(tenantId: string): Promise<DockerHubRepositoriesResponseDto> {
    this.assertReady();
    const repos = this.registry.dockerHub
      ? await this.fetchRepoPage(`${DOCKERHUB_API}/namespaces/${this.namespace}/repositories?page_size=100`)
      : await this.fetchRegistryRepos();
    const tenantRulePrefix = this.getTenantRulePrefix(tenantId);
    const tenantRepos = repos.filter((r) => r.name.toLowerCase().startsWith(tenantRulePrefix));

    this.logger.log(`Fetched ${tenantRepos.length} rules for tenant "${tenantId}" `);

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
    this.assertReady();
    const tenantRuleName = this.toTenantRuleName(tenantId, ruleName);
    const tags = this.registry.dockerHub
      ? await this.fetchTagPage(
          `${DOCKERHUB_API}/namespaces/${this.namespace}/repositories/${encodeURIComponent(tenantRuleName)}/tags?page_size=100`,
          tenantRuleName,
        )
      : await this.fetchRegistryTags(tenantRuleName);

    this.logger.log(`Fetched ${tags.length} tags for rule "${tenantRuleName}" (tenant "${tenantId}", namespace "${this.namespace}")`);

    return {
      rule: tenantRuleName,
      tags: tags
        .filter((t) => t.name !== 'latest')
        .map((t) => ({
          name: t.name,
          last_updated: t.last_updated,
          digest: t.digest,
        })),
      count: tags.filter((t) => t.name !== 'latest').length,
    };
  }
}

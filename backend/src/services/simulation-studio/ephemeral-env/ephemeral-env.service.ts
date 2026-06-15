import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { GenericContainer, Network, StartedNetwork, StartedTestContainer, Wait } from 'testcontainers';
import { SimulationInfo, SimulationPorts, SimulationStatus, SpawnOptions } from './interfaces/ephemeral-env.interfaces';

interface SimulationInstance {
  info: SimulationInfo;
  network: StartedNetwork;
  postgres: StartedTestContainer;
  nats: StartedTestContainer;
  valkey: StartedTestContainer;
  ruleProcessor: StartedTestContainer;
  natsUtilities: StartedTestContainer;
}

const GITHUB_REPO = 'tazama-lf/Full-Stack-Docker-Tazama';
const REPO_BRANCH = process.env.TAZAMA_REPO_BRANCH ?? 'dev';
const DOCKERHUB_NAMESPACE = process.env.DOCKERHUB_NAMESPACE ?? 'tazamaorg';

interface GithubEntry {
  type: string;
  name: string;
  download_url: string;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return await res.text();
}

async function listGithubDir(dirPath: string): Promise<GithubEntry[]> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${dirPath}?ref=${REPO_BRANCH}`;
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${url}`);
  const entries = (await res.json()) as GithubEntry[];
  return entries.filter((e) => e.type === 'file');
}

@Injectable()
export class EphemeralEnvService implements OnModuleDestroy {
  private readonly logger = new Logger(EphemeralEnvService.name);
  private readonly simulations = new Map<string, SimulationInstance>();

  async onModuleDestroy(): Promise<void> {
    await this.destroyAll();
  }

  private async assertImageExists(image: string): Promise<void> {
    const colonIdx = image.lastIndexOf(':');
    const nameTag = colonIdx === -1 ? image : image.slice(0, colonIdx);
    const tag = colonIdx === -1 ? 'latest' : image.slice(colonIdx + 1);
    const registryUrl = `https://hub.docker.com/v2/repositories/${nameTag}/tags/${tag}`;
    this.logger.log(`Checking Docker Hub for image: ${image}`);
    const res = await fetch(registryUrl);
    if (res.status === 404) {
      throw new BadRequestException(
        `Image '${image}' was not found on Docker Hub. ` +
        `Check that '${nameTag}' exists and the tag '${tag}' is published.`,
      );
    }
    if (!res.ok) {
      this.logger.warn(`Could not verify image '${image}' on Docker Hub (HTTP ${res.status}), proceeding anyway.`);
    }
  }

  async spawn(name: string, options: SpawnOptions = {}): Promise<SimulationInfo> {
    if (this.simulations.has(name)) {
      throw new BadRequestException(`Simulation '${name}' already exists. Destroy it first.`);
    }

    const ruleName = options.ruleName ?? 'rule-901';
    const version = options.version ?? 'rc';
    // rule-executer builds streams as sub-rule-${RULE_NAME}@${VERSION} — strip any existing 'rule-' prefix
    // so RULE_NAME env stays clean and subjects don't double up (e.g. sub-rule-rule-901@rc)
    const ruleBaseName = ruleName.replace(/^rule-/, '');
    const functionName = `${ruleName}-rel-${version}`;
    const natsSubject = `sub-rule-${ruleBaseName}@${version}`;
    const natsConsumer = `pub-rule-${ruleBaseName}@${version}`;
    const ruleImage = `${DOCKERHUB_NAMESPACE}/${ruleName}:${version}`;

    this.logger.log(`Spawning '${name}': ${ruleImage}`);

    await this.assertImageExists(ruleImage);

    this.logger.log('Fetching SQL migration files from GitHub...');

    const baseSqlEntries = await listGithubDir('core/postgres/migration/base');
    this.logger.log(`[${name}] Fetched ${baseSqlEntries.length} base SQL entries from GitHub`);
    const baseSqlContents = await Promise.all(
      baseSqlEntries.map(async (entry) => ({
        content: await fetchText(entry.download_url),
        target: `/docker-entrypoint-initdb.d/${entry.name}`,
      })),
    );
    this.logger.log(`[${name}] Downloaded ${baseSqlContents.length} base SQL files`);

    const [publicBaseSql, dockerhubSql] = await Promise.all([
      fetchText(
        `https://raw.githubusercontent.com/${GITHUB_REPO}/${REPO_BRANCH}/core/postgres/migration/config/00-public-base.sql`,
      ),
      fetchText(
        `https://raw.githubusercontent.com/${GITHUB_REPO}/${REPO_BRANCH}/core/postgres/migration/config/02-public-dockerhub.sql`,
      ),
    ]);
    this.logger.log(`[${name}] Downloaded config SQL files (public-base: ${publicBaseSql.length} chars, dockerhub: ${dockerhubSql.length} chars)`);

    this.logger.log(`[${name}] Starting Docker network...`);
    const network = await new Network().start();
    this.logger.log(`[${name}] Docker network started`);

    try {
      this.logger.log(`[${name}] Starting postgres...`);
      const postgres = await new GenericContainer('postgres:18')
        .withNetwork(network)
        .withNetworkAliases('postgres')
        .withEnvironment({
          POSTGRES_USER: 'postgres',
          POSTGRES_PASSWORD: 'unused',
        })
        .withCopyContentToContainer([
          ...baseSqlContents,
          { content: publicBaseSql, target: '/docker-entrypoint-initdb.d/01-DATA.sql' },
          { content: dockerhubSql, target: '/docker-entrypoint-initdb.d/02-DATA.sql' },
        ])
        .withExposedPorts(5432)
        .withHealthCheck({
          test: ['CMD-SHELL', 'pg_isready -U postgres'],
          interval: 10_000,
          timeout: 5_000,
          retries: 20,
          startPeriod: 120_000,
        })
        .withWaitStrategy(Wait.forHealthCheck())
        .withStartupTimeout(180_000)
        .start();

      this.logger.log(`[${name}] Starting NATS...`);
      const nats = await new GenericContainer('nats:2')
        .withNetwork(network)
        .withNetworkAliases('nats')
        .withCommand(['--jetstream', '-m', '8222', '-DVV'])
        .withExposedPorts(4222, 8222)
        .withWaitStrategy(Wait.forLogMessage(/Server is ready/))
        .start();

      this.logger.log(`[${name}] Starting Valkey...`);
      const valkey = await new GenericContainer('valkey/valkey:7.2.5')
        .withNetwork(network)
        .withNetworkAliases('valkey')
        .withCommand(['valkey-server', '--port', '6379', '--loglevel', 'verbose'])
        .withExposedPorts(6379)
        .withHealthCheck({
          test: ['CMD-SHELL', 'valkey-cli -p 6379 ping | grep PONG'],
          interval: 1_000,
          timeout: 3_000,
          retries: 5,
        })
        .withWaitStrategy(Wait.forHealthCheck())
        .start();

      this.logger.log(`[${name}] Starting rule-processor (${ruleImage})...`);
      const ruleProcessor = await new GenericContainer(ruleImage)
        .withNetwork(network)
        .withNetworkAliases('rule-processor')
        .withEnvironment({
          NODE_ENV: 'dev',
          MAX_CPU: '1',
          SUPPRESS_ALERTS: 'true',
          APM_ACTIVE: 'false',
          APM_URL: 'http://apm:8200',
          APM_SECRET_TOKEN: '',
          APM_SERVICE_NAME: ruleName,
          LOCAL_CACHETTL: '300',
          LOCAL_CACHE_ENABLED: 'true',
          DISTRIBUTED_CACHE_ENABLED: 'false',
          DISTRIBUTED_CACHETTL: '300',
          REDIS_DATABASE: '0',
          REDIS_IS_CLUSTER: 'false',
          REDIS_AUTH: '',
          REDIS_SERVERS: JSON.stringify([{ host: 'valkey', port: 6379 }]),
          RAW_HISTORY_DATABASE: 'raw_history',
          RAW_HISTORY_DATABASE_HOST: 'postgres',
          RAW_HISTORY_DATABASE_PORT: '5432',
          RAW_HISTORY_DATABASE_USER: 'postgres',
          RAW_HISTORY_DATABASE_PASSWORD: 'unused',
          RAW_HISTORY_DATABASE_CERT_PATH: '',
          CONFIGURATION_DATABASE: 'configuration',
          CONFIGURATION_DATABASE_HOST: 'postgres',
          CONFIGURATION_DATABASE_PORT: '5432',
          CONFIGURATION_DATABASE_USER: 'postgres',
          CONFIGURATION_DATABASE_PASSWORD: 'unused',
          CONFIGURATION_DATABASE_CERT_PATH: '',
          EVENT_HISTORY_DATABASE: 'event_history',
          EVENT_HISTORY_DATABASE_HOST: 'postgres',
          EVENT_HISTORY_DATABASE_PORT: '5432',
          EVENT_HISTORY_DATABASE_USER: 'postgres',
          EVENT_HISTORY_DATABASE_PASSWORD: 'unused',
          EVENT_HISTORY_DATABASE_CERT_PATH: '',
          LOG_LEVEL: 'info',
          STARTUP_TYPE: 'nats',
          SERVER_URL: 'nats:4222',
          FUNCTION_NAME: functionName,
          RULE_VERSION: version,
          RULE_NAME: ruleBaseName,
        })
        .withLogConsumer((stream) => {
          stream.on('data', (line: string) => { this.logger.log(`[${name}][rule-processor] ${line.trim()}`); });
          stream.on('err', (line: string) => { this.logger.warn(`[${name}][rule-processor] ${line.trim()}`); });
        })
        .withWaitStrategy(Wait.forLogMessage('Connected to nats'))
        .withStartupTimeout(60_000)
        .start();

      this.logger.log(`[${name}] Starting nats-utilities...`);
      const natsUtilities = await new GenericContainer('tazamaorg/nats-utilities:latest')
        .withNetwork(network)
        .withNetworkAliases('nats-utilities')
        .withEnvironment({
          FUNCTION_NAME: 'nats-utilities',
          NODE_ENV: 'dev',
          PORT: '4000',
          APM_ACTIVE: 'false',
          APM_SECRET_TOKEN: '',
          APM_URL: 'http://apm:8200',
          APM_SERVICE_NAME: 'nats-utilities',
          STARTUP_TYPE: 'nats',
          SERVER_URL: 'nats:4222',
        })
        .withExposedPorts(4000)
        .withWaitStrategy(
          Wait.forHttp('/', 4000)
            .forStatusCodeMatching((s) => s < 500)
            .withStartupTimeout(90_000),
        )
        .withLogConsumer((stream) => {
          stream.on('data', (line: string) => { this.logger.log(`[${name}][nats-utilities] ${line.trim()}`); });
          stream.on('err', (line: string) => { this.logger.warn(`[${name}][nats-utilities] ${line.trim()}`); });
        })
        .start();

      const ports: SimulationPorts = {
        pg: postgres.getMappedPort(5432),
        nats: nats.getMappedPort(4222),
        natsMonitor: nats.getMappedPort(8222),
        valkey: valkey.getMappedPort(6379),
        natsUtils: natsUtilities.getMappedPort(4000),
      };

      const info: SimulationInfo = {
        name,
        ruleName,
        version,
        functionName,
        natsSubject,
        natsConsumer,
        ports,
        startedAt: new Date(),
        status: SimulationStatus.UP,
      };

      this.simulations.set(name, { info, network, postgres, nats, valkey, ruleProcessor, natsUtilities });

      this.logger.log(
        `[${name}] Ready — nats-utilities: http://localhost:${ports.natsUtils}, ` +
        `postgres: localhost:${ports.pg}, nats: localhost:${ports.nats}`,
      );

      return info;
    } catch (err) {
      await network.stop().catch((_e: unknown) => undefined);
      throw err;
    }
  }

  async destroy(name: string): Promise<void> {
    const sim = this.simulations.get(name);
    if (!sim) throw new NotFoundException(`Simulation '${name}' not found`);

    this.logger.log(`Destroying simulation '${name}'...`);

    await Promise.allSettled([
      sim.natsUtilities.stop(),
      sim.ruleProcessor.stop(),
      sim.valkey.stop(),
      sim.nats.stop(),
      sim.postgres.stop(),
    ]);
    await sim.network.stop().catch((_e: unknown) => undefined);

    this.simulations.delete(name);
    this.logger.log(`Simulation '${name}' destroyed`);
  }

  async destroyAll(): Promise<void> {
    const names = [...this.simulations.keys()];
    if (names.length === 0) return;
    this.logger.log(`Destroying all ${names.length} simulation(s)...`);
    await Promise.allSettled(names.map(async (n) => { await this.destroy(n); }));
  }

  list(): SimulationInfo[] {
    return [...this.simulations.values()].map((s) => s.info);
  }

  get(name: string): SimulationInfo | undefined {
    return this.simulations.get(name)?.info;
  }

  getNatsUtilsUrl(name: string): string {
    const sim = this.simulations.get(name);
    if (!sim) throw new NotFoundException(`Simulation '${name}' not found`);
    return `http://localhost:${sim.info.ports.natsUtils}`;
  }
}

import { Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { promisify } from 'node:util';
import { type ExecResult, GenericContainer, getContainerRuntimeClient, type StartedTestContainer } from 'testcontainers';
import { type ArtifactProfile, ruleImageRef } from './artifact-profile';
import { createGitProvider } from './git-provider';
import { assertValidRuleSource, prepareExecuter, prepareWorkspace, type RuleSource } from './rule-workspace';

export type { RuleSource } from './rule-workspace';

export interface RuleBuildOptions {
  templateDir?: string;
  executerDir?: string;
  networkMode?: string;
  allowFailingTests?: boolean;
  stepTimeoutMs?: number;
  onStage?: (stage: string) => void;
}

export interface UnitTestSummary {
  total: number;
  passed: number;
  failed: number;
  success: boolean;
  coverageThresholdMet: boolean;
}

export interface RulePackage {
  file: string;
  integrity: string;
  shasum: string;
  size: number;
  tgz: Buffer;
}

export interface RuleImage {
  ref: string;
  id: string;
  digest?: string;
}

export interface RuleBuildResult {
  ruleId: string;
  version: string;
  tests: UnitTestSummary;
  reportHtml?: string;
  gitRepo?: string;
  package?: RulePackage;
  image?: RuleImage;
  durationsMs: Record<string, number>;
}

const BUILDER_USER = 'node';
const BUILDER_HOME = '/home/node';
const BUILDER_MEMORY_GB = 2;
const BUILDER_CPUS = 2;
const DEFAULT_STEP_TIMEOUT_MS = 10 * 60_000;

export class RuleBuildError extends Error {
  constructor(
    message: string,
    readonly partial: RuleBuildResult,
    readonly stage?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'RuleBuildError';
  }
}

export class RulePipelineService {
  private readonly logger = new Logger(RulePipelineService.name);

  constructor(private readonly profile: ArtifactProfile) {}

  async build(source: RuleSource, options: RuleBuildOptions): Promise<RuleBuildResult> {
    assertValidRuleSource(source);
    const { npm, image, sources, builder: settings } = this.profile;
    const templateDir = options.templateDir ?? sources.templateDir;
    const executerDir = options.executerDir ?? sources.executerDir;
    assertInputsExist({ 'npm cache': npm.cacheDir, 'rule template': templateDir, 'rule-executer': executerDir });
    const tag = `rule-${source.ruleId}@${source.version}`;
    const timeoutMs = options.stepTimeoutMs ?? settings.stepTimeoutMs ?? DEFAULT_STEP_TIMEOUT_MS;
    const durationsMs: Record<string, number> = {};
    let current: string | undefined;
    const timed = async <T>(stage: string, fn: () => Promise<T>): Promise<T> => {
      current = stage;
      options.onStage?.(stage);
      const start = Date.now();
      try {
        return await fn();
      } finally {
        durationsMs[stage] = Date.now() - start;
      }
    };

    const tmp = mkdtempSync(join(tmpdir(), `rule-${source.ruleId}-`));
    const result: RuleBuildResult = { ruleId: source.ruleId, version: source.version, tests: emptySummary(), durationsMs };
    let builder: StartedTestContainer | undefined;
    try {
      const workDir = join(tmp, 'work');
      const execDir = join(tmp, 'exec');
      prepareWorkspace(source, templateDir, workDir, npm);
      prepareExecuter(executerDir, execDir, npm);

      result.gitRepo = await timed('git', async () => await this.pushSource(source, workDir));

      const networkMode = options.networkMode ?? settings.network ?? (npm.source === 'offline' ? 'none' : undefined);
      builder = await timed('start', async () => await this.startBuilder(workDir, execDir, networkMode));
      const container = builder;
      const step = async (name: string, command: string): Promise<string> => await this.run(container, tag, name, command, timeoutMs);

      await timed('install', async () => await step('npm ci', 'cd /work && npm ci --ignore-scripts --no-audit --no-fund'));
      result.tests = await timed('test', async () => await this.runTests(container, tag, timeoutMs));
      result.reportHtml = await this.readFile(container, '/work/reports/unit-tests/latest/index.html');
      if (!result.tests.success && !options.allowFailingTests) {
        this.logger.warn(`[${tag}] ${result.tests.failed} of ${result.tests.total} unit tests failed; nothing packaged`);
        return result;
      }

      const rulePackage = await timed('package', async () => {
        await step('npm build', 'cd /work && npm run build');
        return await this.pack(container, tag, step);
      });
      result.package = rulePackage;
      if (!image.build) return result;

      await timed('assemble', async () => {
        await step('rule-executer build', ASSEMBLE_EXECUTER);
        await container.copyContentToContainer([{ content: this.dockerfile(source, rulePackage.integrity), target: '/ctx/Dockerfile' }]);
      });
      const ruleImage = await timed('image', async () => await this.buildImage(container, tag, source));
      result.image = ruleImage;
      if (image.registry) {
        ruleImage.digest = await timed('push', async () => await this.pushImage(ruleImage.ref));
      }
      return result;
    } catch (err) {
      throw new RuleBuildError((err as Error).message, result, current, { cause: err });
    } finally {
      await builder?.stop();
      rmSync(tmp, { recursive: true, force: true });
    }
  }

  private async pushSource(source: RuleSource, workDir: string): Promise<string | undefined> {
    const git = createGitProvider(this.profile.git);
    if (!git) return undefined;

    const repo = `rule-${source.ruleId}`;
    const { url } = await git.ensureRepo(repo);
    await git.pushFiles(
      repo,
      [
        { path: 'src/rule.ts', content: source.ruleCode },
        { path: '__tests__/unit/rule.test.ts', content: source.testCode },
        { path: 'package.json', content: readFileSync(join(workDir, 'package.json'), 'utf8') },
      ],
      `chore: sync rule ${source.ruleId}@${source.version} from Rule Studio`,
    );
    return url;
  }

  private async startBuilder(workDir: string, execDir: string, networkMode?: string): Promise<StartedTestContainer> {
    const { cacheDir } = this.profile.npm;
    let container = new GenericContainer(this.profile.baseImages.node)
      .withCommand(['sleep', 'infinity'])
      .withResourcesQuota({ memory: BUILDER_MEMORY_GB, cpu: BUILDER_CPUS })
      .withCopyDirectoriesToContainer([
        { source: workDir, target: '/work' },
        { source: execDir, target: '/exec' },
        ...(cacheDir ? [{ source: cacheDir, target: `${BUILDER_HOME}/.npm` }] : []),
      ]);
    container = networkMode
      ? container.withNetworkMode(networkMode)
      : container.withExtraHosts([{ host: 'host.docker.internal', ipAddress: 'host-gateway' }]);
    const started = await container.start();
    const owned = ['/work', '/exec', '/out', '/ctx', ...(cacheDir ? [`${BUILDER_HOME}/.npm`] : [])].join(' ');
    const setup = await started.exec(['sh', '-c', `mkdir -p /out /ctx && chown -R ${BUILDER_USER} ${owned}`]);
    if (setup.exitCode !== 0) {
      await started.stop();
      throw new Error(`Builder setup failed (exit ${setup.exitCode}): ${setup.output}`);
    }
    return started;
  }

  private async exec(container: StartedTestContainer, command: string, timeoutMs: number, what: string): Promise<ExecResult> {
    const env: Record<string, string> = { HOME: BUILDER_HOME };
    if (this.profile.npm.token) env.NPM_TOKEN = this.profile.npm.token;
    const abort = new AbortController();
    const timeout = sleep(timeoutMs, undefined, { signal: abort.signal }).then(() => {
      throw new Error(`${what} timed out after ${Math.round(timeoutMs / 1000)}s`);
    });
    try {
      return await Promise.race([container.exec(['sh', '-c', command], { user: BUILDER_USER, env }), timeout]);
    } finally {
      abort.abort();
    }
  }

  private async run(container: StartedTestContainer, tag: string, step: string, command: string, timeoutMs: number): Promise<string> {
    this.logger.log(`[${tag}] ${step}`);
    const res = await this.exec(container, command, timeoutMs, `[${tag}] ${step}`);
    if (res.exitCode !== 0) {
      throw new Error(`[${tag}] ${step} failed (exit ${res.exitCode}):\n${this.explainFailure(res.output)}`);
    }
    return res.stdout;
  }

  private explainFailure(output: string): string {
    const lines = output.split('\n').filter((line) => !line.startsWith('npm warn'));
    let text = lines.join('\n').slice(-4000);
    if (this.profile.npm.source === 'offline' && output.includes('ENOTCACHED')) {
      text +=
        '\nThe offline npm cache does not hold every package the rule template and rule-executer lock. ' +
        'Rebuild it from the sources bundled in this backend image (rule-pipeline/sources.json).';
    }
    return text;
  }

  private async readFile(container: StartedTestContainer, path: string): Promise<string | undefined> {
    const res = await container.exec(['cat', path]);
    return res.exitCode === 0 ? res.stdout : undefined;
  }

  private async runTests(container: StartedTestContainer, tag: string, timeoutMs: number): Promise<UnitTestSummary> {
    this.logger.log(`[${tag}] unit tests`);
    const res = await this.exec(
      container,
      'cd /work && npx jest --config=jest.config.ts --coverage --passWithNoTests --runInBand --ci; code=$?; node generate-report.js; exit $code',
      timeoutMs,
      `[${tag}] unit tests`,
    );
    const json = await this.readFile(container, '/work/coverage/test-results.json');
    if (!json) throw new Error(`[${tag}] jest produced no results:\n${res.output.slice(-4000)}`);
    const jest = JSON.parse(json) as {
      numTotalTests: number;
      numPassedTests: number;
      numFailedTests: number;
      numTotalTestSuites: number;
      numPassedTestSuites: number;
    };
    const ran = jest.numTotalTests > 0 && jest.numFailedTests === 0 && jest.numPassedTestSuites === jest.numTotalTestSuites;
    const summary = {
      total: jest.numTotalTests,
      passed: jest.numPassedTests,
      failed: jest.numFailedTests,
      success: ran,
      coverageThresholdMet: ran && res.exitCode === 0,
    };
    this.logger.log(
      `[${tag}] ${summary.passed}/${summary.total} unit tests passed, coverage threshold ${summary.coverageThresholdMet ? 'met' : 'not met'}`,
    );
    return summary;
  }

  private async pack(
    container: StartedTestContainer,
    tag: string,
    step: (name: string, command: string) => Promise<string>,
  ): Promise<RulePackage> {
    await step('npm pack', 'cd /work && npm pack --ignore-scripts --pack-destination /out');
    const file = (await step('find package', 'cd /out && ls *.tgz')).trim();
    if (!/^[\w.@-]+\.tgz$/.test(file)) throw new Error(`[${tag}] expected one package in /out, found: ${file}`);
    const [sha512InBuilder] = (await step('hash package', `sha512sum /out/${file}`)).split(' ');
    const tgz = Buffer.from(await step('read package', `base64 -w0 /out/${file}`), 'base64');
    const sha512 = createHash('sha512').update(tgz);
    if (sha512.copy().digest('hex') !== sha512InBuilder) {
      throw new Error(`[${tag}] ${file} changed while copying out of the builder`);
    }
    const integrity = `sha512-${sha512.digest('base64')}`;
    this.logger.log(`[${tag}] packed ${file} ${integrity}`);
    return { file, integrity, shasum: createHash('sha1').update(tgz).digest('hex'), size: tgz.length, tgz };
  }

  private dockerfile(source: RuleSource, packageIntegrity: string): string {
    return [
      `FROM ${this.profile.baseImages.runtime}`,
      `LABEL tazama.rule.id="${source.ruleId}" tazama.rule.version="${source.version}" tazama.rule.integrity="${packageIntegrity}" tazama.build="rule-studio-ephemeral"`,
      'USER nonroot',
      'WORKDIR /home/app',
      'COPY ctx/node_modules ./node_modules',
      'COPY ctx/build ./build',
      'COPY ctx/package.json ./',
      `ENV FUNCTION_NAME=rule-executer RULE_NAME=${source.ruleId} RULE_VERSION=${source.version} NODE_ENV=production MAX_CPU=1 STARTUP_TYPE=nats`,
      'CMD ["build/index.js"]',
      '',
    ].join('\n');
  }

  private registryAuth(): { username: string; password: string; serveraddress: string } | undefined {
    const { registry, username, password } = this.profile.image;
    if (!username || !registry) return undefined;
    return { username, password: password ?? '', serveraddress: registry === 'docker.io' ? 'https://index.docker.io/v1/' : registry };
  }

  private async buildImage(container: StartedTestContainer, tag: string, source: RuleSource): Promise<RuleImage> {
    const ref = ruleImageRef(this.profile.image, source.ruleId, source.version, source.tenantId);
    this.logger.log(`[${tag}] docker build ${ref}`);
    const { dockerode } = (await getContainerRuntimeClient()).container;
    const context = await container.copyArchiveFromContainer('/ctx');
    const auth = this.registryAuth();
    const stream = await dockerode.buildImage(context, {
      t: ref,
      dockerfile: 'ctx/Dockerfile',
      registryconfig: auth ? { [auth.serveraddress]: { username: auth.username, password: auth.password } } : undefined,
    });
    await followDockerStream(dockerode.modem, stream, `docker build ${ref}`);
    const { Id } = await dockerode.getImage(ref).inspect();
    return { ref, id: Id };
  }

  private async pushImage(ref: string): Promise<string | undefined> {
    this.logger.log(`docker push ${ref}`);
    const { dockerode } = (await getContainerRuntimeClient()).container;
    const stream = await dockerode.getImage(ref).push({ authconfig: this.registryAuth() ?? {} });
    const events = await followDockerStream(dockerode.modem, stream, `docker push ${ref}`);
    return events.find((event) => event.aux?.Digest)?.aux?.Digest;
  }
}

const ASSEMBLE_EXECUTER = [
  'cd /exec',
  'cp /out/*.tgz rule.tgz',
  'npm pkg set dependencies.rule=file:./rule.tgz',
  'npm install --ignore-scripts --no-audit --no-fund',
  'npm run build',
  'npm prune --omit=dev --ignore-scripts',
  'cp -r build node_modules package.json /ctx/',
].join(' && ');

function assertInputsExist(dirs: Record<string, string | undefined>): void {
  for (const [what, dir] of Object.entries(dirs)) {
    if (dir && !existsSync(dir)) throw new Error(`${what} ${dir} does not exist`);
  }
}

function emptySummary(): UnitTestSummary {
  return { total: 0, passed: 0, failed: 0, success: false, coverageThresholdMet: false };
}

interface DockerEvent {
  error?: string;
  aux?: { Digest?: string };
}

interface DockerModem {
  followProgress: (stream: NodeJS.ReadableStream, onFinished: (err: Error | null, output: DockerEvent[]) => void) => void;
}

async function followDockerStream(modem: DockerModem, stream: NodeJS.ReadableStream, action: string): Promise<DockerEvent[]> {
  const follow = promisify(modem.followProgress.bind(modem));
  const output = await follow(stream);
  const failure = output.find((event) => event.error);
  if (failure) throw new Error(`${action} failed: ${failure.error}`);
  return output;
}

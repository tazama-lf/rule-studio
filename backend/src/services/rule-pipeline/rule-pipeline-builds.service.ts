import { BadRequestException, Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Job, Queue } from 'bullmq';
import { FeatureFlagsService } from '../../common/feature-flags/feature-flags.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { RulesService } from '../rules/rules.service';
import type { ArtifactProfile } from './artifact-profile';
import { type RuleConfiguration, RuleDeployer, type RuleTarget } from './rule-deployment';
import { assertValidRuleSource } from './rule-workspace';
import {
  ARTIFACT_PROFILE,
  RULE_PIPELINE_QUEUE,
  type RuleBuildJobData,
  type RuleBuildJobResult,
  type RuleBuildProgress,
  type RuleBuildView,
  type RuleDeploymentStatus,
  type RuleDeployResult,
  type RulePipelineConfigView,
  type RuleRunResult,
} from './rule-pipeline.types';

type BuildJob = Job<RuleBuildJobData, RuleBuildJobResult>;

const resultOf = (job: BuildJob): RuleBuildJobResult | undefined => job.returnvalue;

type RuleRuns = NonNullable<RuleDeploymentStatus['runs']>;

function completedView(base: RuleBuildView, { build }: RuleBuildJobResult): RuleBuildView {
  return {
    ...base,
    status: build.tests.success ? 'passed' : 'failed',
    tests: build.tests,
    package: build.package,
    image: build.image,
    gitRepo: build.gitRepo,
    durationsMs: build.durationsMs,
  };
}

function failedView(base: RuleBuildView, { build, error, failedStage }: RuleBuildJobResult): RuleBuildView {
  return {
    ...base,
    status: 'error',
    stage: failedStage,
    error,
    tests: build.tests.total > 0 ? build.tests : undefined,
    package: build.package,
    image: build.image,
    gitRepo: build.gitRepo,
    durationsMs: build.durationsMs,
  };
}

function ruleConfigIdOf(ruleDbId: number, ruleConfigId?: string): [string, string] {
  const [name, version] = (ruleConfigId ?? '').split('@');
  if (!name || !version) throw new BadRequestException(`Rule ${ruleDbId} has no rule config (expected name@version).`);
  return [name, version];
}

function decode(base64: string | undefined, what: string): string {
  if (!base64) throw new BadRequestException(`The rule has no generated ${what} yet; build it in Rule Studio first.`);
  return Buffer.from(base64.replace(/^data:[^,]*,/, ''), 'base64').toString('utf8');
}

@Injectable()
export class RulePipelineBuildsService {
  private readonly logger = new Logger(RulePipelineBuildsService.name);
  private readonly deployer?: RuleDeployer;
  private readonly runs = new Map<string, RuleRuns>();
  private readonly messages = new Map<string, string>();

  constructor(
    @InjectQueue(RULE_PIPELINE_QUEUE) private readonly queue: Queue<RuleBuildJobData, RuleBuildJobResult>,
    @Inject(ARTIFACT_PROFILE) private readonly profile: ArtifactProfile,
    private readonly rulesService: RulesService,
    private readonly features: FeatureFlagsService,
  ) {
    this.deployer = profile.deploy && new RuleDeployer(profile.deploy, profile.image);
  }

  private assertEnabled(): void {
    if (!this.features.isRulePipelineEnabled()) {
      throw new ServiceUnavailableException({
        feature: 'rule-pipeline',
        enabled: false,
        message: 'The rule pipeline is disabled on this deployment. Set RULE_PIPELINE_ENABLED=true and give the backend access to Docker.',
      });
    }
  }

  config(): RulePipelineConfigView {
    const { npm, image, git } = this.profile;
    return {
      enabled: this.features.isRulePipelineEnabled(),
      npm:
        npm.source === 'offline'
          ? { source: npm.source, cache: npm.cacheDir }
          : { source: npm.source, registry: npm.url, scopeRegistry: npm.scopeUrl },
      image: { build: image.build, registry: image.registry, namespace: image.namespace },
      git: git.kind === 'none' ? { kind: git.kind } : { kind: git.kind, url: git.apiUrl, owner: git.owner, branch: git.branch },
      deploy: this.profile.deploy ? { enabled: image.build, network: this.profile.deploy.network } : { enabled: false },
    };
  }

  async start(ruleDbId: number, user: AuthenticatedUser): Promise<RuleBuildView> {
    this.assertEnabled();
    const rule = await this.rulesService.getRuleById(ruleDbId, user);
    const [name, version] = ruleConfigIdOf(ruleDbId, rule.rule_config_id);
    const flow = await this.rulesService.getRuleFlow(String(ruleDbId), user, 'GET /rules/api/:ruleId/flow');
    const source = {
      ruleId: name.toLowerCase(),
      version,
      ruleCode: decode(flow.result.ts_file_base64_rule_builder, 'rule code'),
      testCode: decode(flow.result.ts_file_base64_test_case, 'unit tests'),
      tenantId: user.tenantId,
    };
    try {
      assertValidRuleSource(source);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
    const job = await this.queue.add('build', {
      ruleDbId,
      ruleConfigId: rule.rule_config_id ?? '',
      source,
      requestedBy: user.actorEmail ?? user.actorName ?? user.userId,
    });
    return await this.view(job);
  }

  async get(buildId: string): Promise<RuleBuildView> {
    this.assertEnabled();
    return await this.view(await this.job(buildId));
  }

  async latest(ruleDbId: number): Promise<RuleBuildView | undefined> {
    this.assertEnabled();
    const jobs = await this.queue.getJobs(['active', 'waiting', 'delayed', 'completed', 'failed'], 0, 500);
    const job = jobs
      .filter((j) => j.data.ruleDbId === ruleDbId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .at(0);
    return job ? await this.view(job) : undefined;
  }

  async report(buildId: string): Promise<string> {
    this.assertEnabled();
    const job = await this.job(buildId);
    const html = resultOf(job)?.reportHtml ?? (job.progress as RuleBuildProgress | undefined)?.reportHtml;
    if (!html) throw new NotFoundException(`Build ${buildId} has no test report`);
    return html;
  }

  async package(buildId: string): Promise<{ file: string; integrity: string; data: Buffer }> {
    this.assertEnabled();
    const result = resultOf(await this.job(buildId));
    if (!result?.packageTgz || !result.build.package) throw new NotFoundException(`Build ${buildId} produced no package`);
    return { file: result.build.package.file, integrity: result.build.package.integrity, data: Buffer.from(result.packageTgz, 'base64') };
  }

  async deployment(ruleDbId: number, user: AuthenticatedUser): Promise<RuleDeploymentStatus> {
    this.assertEnabled();
    if (!this.deployer) return { enabled: false, deployed: false };
    const rule = await this.rulesService.getRuleById(ruleDbId, user);
    const [name, version] = ruleConfigIdOf(ruleDbId, rule.rule_config_id);
    const status = await this.deployer.status({ ruleId: name.toLowerCase(), version, tenantId: user.tenantId });
    return { ...status, runs: this.runs.get(this.runKey(ruleDbId, user)) ?? {} };
  }

  async deploy(ruleDbId: number, user: AuthenticatedUser): Promise<RuleDeployResult> {
    const deployer = this.requireDeployer();
    const build = await this.latest(ruleDbId);
    if (build?.status !== 'passed' || !build.image?.digest) {
      throw new BadRequestException('There is no passed build with a pushed image to deploy; run Build & Test first.');
    }
    const target = await this.target(ruleDbId, user);
    if (build.ruleId !== target.ruleId || build.version !== target.version) {
      throw new BadRequestException(`The last build is of ${build.ruleId}@${build.version}; run Build & Test for ${target.ruleId}@${target.version} first.`);
    }
    return await deployer.deploy(target, build.image).catch((err: unknown): RuleDeployResult => {
      this.logger.error(`Deploying ${target.ruleId}@${target.version} failed: ${(err as Error).message}`);
      return { ok: false, error: (err as Error).message };
    });
  }

  async runRule(ruleDbId: number, user: AuthenticatedUser): Promise<RuleRunResult> {
    return await this.run(ruleDbId, user, 'rule', async (deployer, target, msgId) => await deployer.runRule(target, msgId));
  }

  async runEndToEnd(ruleDbId: number, user: AuthenticatedUser): Promise<RuleRunResult> {
    return await this.run(ruleDbId, user, 'e2e', async (deployer, target) => await deployer.endToEnd(target));
  }

  private async run(
    ruleDbId: number,
    user: AuthenticatedUser,
    kind: RuleRunResult['kind'],
    work: (deployer: RuleDeployer, target: RuleTarget, msgId?: string) => Promise<RuleRunResult>,
  ): Promise<RuleRunResult> {
    const deployer = this.requireDeployer();
    const target = await this.target(ruleDbId, user);
    const key = this.runKey(ruleDbId, user);
    const message = `${key}:${target.txtp}`;
    const ranAt = new Date();
    const result = await work(deployer, target, this.messages.get(message)).catch(
      (err: unknown): RuleRunResult => ({ kind, ok: false, ranAt: ranAt.toISOString(), tookMs: Date.now() - ranAt.getTime(), error: (err as Error).message }),
    );
    if (result.msgId) {
      this.messages.set(message, result.msgId);
    } else {
      this.messages.delete(message);
    }
    this.runs.set(key, { ...this.runs.get(key), [kind]: result });
    return result;
  }

  private requireDeployer(): RuleDeployer {
    this.assertEnabled();
    if (!this.deployer) throw new ServiceUnavailableException('Deployment is not configured on this deployment (RULE_DEPLOY_NETWORK).');
    return this.deployer;
  }

  private runKey(ruleDbId: number, user: AuthenticatedUser): string {
    return `${user.tenantId}:${ruleDbId}`;
  }

  private async target(ruleDbId: number, user: AuthenticatedUser): Promise<RuleTarget> {
    const rule = await this.rulesService.getRuleById(ruleDbId, user);
    const [name, version] = ruleConfigIdOf(ruleDbId, rule.rule_config_id);
    if (!rule.txtp) throw new BadRequestException(`Rule ${ruleDbId} has no transaction type.`);
    const config = await this.ruleConfig(rule.rule_config_id ?? '', user);
    return { ruleId: name.toLowerCase(), version, tenantId: user.tenantId, txtp: rule.txtp, config };
  }

  private async ruleConfig(ruleConfigId: string, user: AuthenticatedUser): Promise<RuleConfiguration> {
    const found = (await this.rulesService.getRuleConfiguration(ruleConfigId, user, 'GET /rules/api/configuration/:ruleId').catch(
      () => undefined,
    )) as { configuration?: RuleConfiguration } | undefined;
    if (!found?.configuration?.id) throw new BadRequestException(`Rule config ${ruleConfigId} was not found; save the rule config before deploying or running the rule.`);
    return found.configuration;
  }

  private async job(buildId: string): Promise<BuildJob> {
    const job = await this.queue.getJob(buildId);
    if (!job) throw new NotFoundException(`Build ${buildId} not found`);
    return job;
  }

  private async view(job: BuildJob): Promise<RuleBuildView> {
    const state = await job.getState();
    const result = resultOf(job);
    const base: RuleBuildView = {
      buildId: String(job.id),
      ruleDbId: job.data.ruleDbId,
      ruleConfigId: job.data.ruleConfigId,
      ruleId: job.data.source.ruleId,
      version: job.data.source.version,
      status: 'queued',
      requestedBy: job.data.requestedBy,
      createdAt: new Date(job.timestamp).toISOString(),
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
      hasReport: Boolean(result?.reportHtml),
    };
    if (state === 'active') {
      const progress = job.progress as RuleBuildProgress | undefined;
      return { ...base, status: 'running', stage: progress?.stage, tests: progress?.tests, hasReport: Boolean(progress?.reportHtml) };
    }
    if (state === 'failed') return { ...base, status: 'error', error: job.failedReason };
    if (state !== 'completed' || !result) return base;
    return result.error ? failedView(base, result) : completedView(base, result);
  }
}

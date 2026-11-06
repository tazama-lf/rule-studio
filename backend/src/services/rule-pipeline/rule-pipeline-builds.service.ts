import { BadRequestException, Inject, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Job, Queue } from 'bullmq';
import { FeatureFlagsService } from '../../common/feature-flags/feature-flags.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { RulesService } from '../rules/rules.service';
import type { ArtifactProfile } from './artifact-profile';
import { assertValidRuleSource } from './rule-workspace';
import {
  ARTIFACT_PROFILE,
  RULE_PIPELINE_QUEUE,
  type RuleBuildJobData,
  type RuleBuildJobResult,
  type RuleBuildProgress,
  type RuleBuildView,
  type RulePipelineConfigView,
} from './rule-pipeline.types';

type BuildJob = Job<RuleBuildJobData, RuleBuildJobResult>;

const resultOf = (job: BuildJob): RuleBuildJobResult | undefined => job.returnvalue;

function completedView(base: RuleBuildView, { build, simulation }: RuleBuildJobResult, simulate: boolean): RuleBuildView {
  const ok = build.tests.success && (!simulate || simulation?.ok === true);
  return {
    ...base,
    status: build.tests.success ? (ok ? 'passed' : 'error') : 'failed',
    error: simulation && !simulation.ok ? `Simulation failed: ${simulation.error}` : undefined,
    tests: build.tests,
    package: build.package,
    image: build.image,
    gitRepo: build.gitRepo,
    durationsMs: build.durationsMs,
    simulation,
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

function decode(base64: string | undefined, what: string): string {
  if (!base64) throw new BadRequestException(`The rule has no generated ${what} yet; build it in Rule Studio first.`);
  return Buffer.from(base64.replace(/^data:[^,]*,/, ''), 'base64').toString('utf8');
}

@Injectable()
export class RulePipelineBuildsService {
  constructor(
    @InjectQueue(RULE_PIPELINE_QUEUE) private readonly queue: Queue<RuleBuildJobData, RuleBuildJobResult>,
    @Inject(ARTIFACT_PROFILE) private readonly profile: ArtifactProfile,
    private readonly rulesService: RulesService,
    private readonly features: FeatureFlagsService,
  ) {}

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
    };
  }

  async start(ruleDbId: number, user: AuthenticatedUser, simulate: boolean): Promise<RuleBuildView> {
    this.assertEnabled();
    const rule = await this.rulesService.getRuleById(ruleDbId, user);
    const [name, version] = (rule.rule_config_id ?? '').split('@');
    if (!name || !version) throw new BadRequestException(`Rule ${ruleDbId} has no rule config (expected name@version).`);
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
      simulate: simulate && this.profile.image.build,
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
    const html = resultOf(await this.job(buildId))?.reportHtml;
    if (!html) throw new NotFoundException(`Build ${buildId} has no test report`);
    return html;
  }

  async package(buildId: string): Promise<{ file: string; integrity: string; data: Buffer }> {
    this.assertEnabled();
    const result = resultOf(await this.job(buildId));
    if (!result?.packageTgz || !result.build.package) throw new NotFoundException(`Build ${buildId} produced no package`);
    return { file: result.build.package.file, integrity: result.build.package.integrity, data: Buffer.from(result.packageTgz, 'base64') };
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
      simulate: job.data.simulate,
      requestedBy: job.data.requestedBy,
      createdAt: new Date(job.timestamp).toISOString(),
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
      hasReport: Boolean(result?.reportHtml),
    };
    if (state === 'active') return { ...base, status: 'running', stage: (job.progress as RuleBuildProgress | undefined)?.stage };
    if (state === 'failed') return { ...base, status: 'error', error: job.failedReason };
    if (state !== 'completed' || !result) return base;
    return result.error ? failedView(base, result) : completedView(base, result, job.data.simulate);
  }
}

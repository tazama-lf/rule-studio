import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { FeatureFlagsService } from '../../common/feature-flags/feature-flags.service';
import { EphemeralEnvService } from '../simulation-studio/ephemeral-env/ephemeral-env.service';
import type { ArtifactProfile } from './artifact-profile';
import { RuleBuildError, type RuleBuildResult, RulePipelineService } from './rule-pipeline.service';
import {
  ARTIFACT_PROFILE,
  RULE_PIPELINE_QUEUE,
  type RuleBuildJobData,
  type RuleBuildJobResult,
  type RuleSimulationResult,
} from './rule-pipeline.types';

@Processor(RULE_PIPELINE_QUEUE, { concurrency: 1 })
export class RulePipelineProcessor extends WorkerHost {
  private readonly logger = new Logger(RulePipelineProcessor.name);
  private readonly pipeline: RulePipelineService;
  private readonly simulations = new EphemeralEnvService({ isSimStudioEnabled: () => true } as unknown as FeatureFlagsService);

  constructor(@Inject(ARTIFACT_PROFILE) profile: ArtifactProfile) {
    super();
    this.pipeline = new RulePipelineService(profile);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<RuleBuildJobData>, err: Error): void {
    this.logger.error(`Build ${job.id} of rule-${job.data.source.ruleId}@${job.data.source.version} failed: ${err.message}`);
  }

  async process(job: Job<RuleBuildJobData, RuleBuildJobResult>): Promise<RuleBuildJobResult> {
    const { source, simulate } = job.data;
    const stage = (name: string): void => {
      job.updateProgress({ stage: name }).catch(() => undefined);
    };
    let built: RuleBuildResult;
    let failure: Pick<RuleBuildJobResult, 'error' | 'failedStage'> | undefined;
    try {
      built = await this.pipeline.build(source, { onStage: stage });
    } catch (err) {
      if (!(err instanceof RuleBuildError)) throw err;
      this.logger.error(`Build ${job.id} of rule-${source.ruleId}@${source.version} failed at ${err.stage ?? 'setup'}: ${err.message}`);
      built = err.partial;
      failure = { error: err.message, failedStage: err.stage };
    }
    const { package: rulePackage, reportHtml, ...build } = built;
    const result: RuleBuildJobResult = {
      build: {
        ...build,
        package: rulePackage && {
          file: rulePackage.file,
          integrity: rulePackage.integrity,
          shasum: rulePackage.shasum,
          size: rulePackage.size,
        },
      },
      reportHtml,
      packageTgz: rulePackage?.tgz.toString('base64'),
      ...failure,
    };
    if (!failure && simulate && build.image) {
      stage('simulate');
      result.simulation = await this.simulate(String(job.id), source.ruleId, source.version, build.image.ref);
    }
    return result;
  }

  private async simulate(buildId: string, ruleId: string, version: string, image: string): Promise<RuleSimulationResult> {
    const name = `pipeline-${buildId}`;
    const started = Date.now();
    try {
      const info = await this.simulations.spawn(name, { ruleName: `rule-${ruleId}`, version, image });
      return { ok: true, upMs: Date.now() - started, subject: info.natsSubject };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    } finally {
      await this.simulations.destroy(name).catch(() => undefined);
    }
  }
}

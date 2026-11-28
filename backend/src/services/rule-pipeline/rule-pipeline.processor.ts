import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { ArtifactProfile } from './artifact-profile';
import { RuleBuildError, type RuleBuildResult, RulePipelineService } from './rule-pipeline.service';
import {
  ARTIFACT_PROFILE,
  RULE_PIPELINE_QUEUE,
  type RuleBuildJobData,
  type RuleBuildJobResult,
  type RuleBuildProgress,
} from './rule-pipeline.types';

@Processor(RULE_PIPELINE_QUEUE, { concurrency: 1 })
export class RulePipelineProcessor extends WorkerHost {
  private readonly logger = new Logger(RulePipelineProcessor.name);
  private readonly pipeline: RulePipelineService;

  constructor(@Inject(ARTIFACT_PROFILE) profile: ArtifactProfile) {
    super();
    this.pipeline = new RulePipelineService(profile);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<RuleBuildJobData>, err: Error): void {
    this.logger.error(`Build ${job.id} of rule-${job.data.source.ruleId}@${job.data.source.version} failed: ${err.message}`);
  }

  async process(job: Job<RuleBuildJobData, RuleBuildJobResult>): Promise<RuleBuildJobResult> {
    const { source } = job.data;
    const progress: RuleBuildProgress = { stage: '' };
    const report = (update: Partial<RuleBuildProgress>): void => {
      Object.assign(progress, update);
      job.updateProgress({ ...progress }).catch(() => undefined);
    };
    let built: RuleBuildResult;
    let failure: Pick<RuleBuildJobResult, 'error' | 'failedStage'> | undefined;
    try {
      built = await this.pipeline.build(source, {
        onStage: (stage) => {
          report({ stage });
        },
        onTests: (tests, reportHtml) => {
          report({ tests, reportHtml });
        },
      });
    } catch (err) {
      if (!(err instanceof RuleBuildError)) throw err;
      this.logger.error(`Build ${job.id} of rule-${source.ruleId}@${source.version} failed at ${err.stage ?? 'setup'}: ${err.message}`);
      built = err.partial;
      failure = { error: err.message, failedStage: err.stage };
    }
    const { package: rulePackage, reportHtml, ...build } = built;
    return {
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
  }
}

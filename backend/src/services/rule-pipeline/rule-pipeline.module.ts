import { Module } from '@nestjs/common';
import { QueuesModule } from '../../queues/queues.module';
import { RulesModule } from '../rules/rules.module';
import { loadArtifactProfile } from './artifact-profile';
import { RulePipelineBuildsService } from './rule-pipeline-builds.service';
import { RulePipelineController } from './rule-pipeline.controller';
import { RulePipelineProcessor } from './rule-pipeline.processor';
import { ARTIFACT_PROFILE } from './rule-pipeline.types';

@Module({
  imports: [QueuesModule, RulesModule],
  controllers: [RulePipelineController],
  providers: [{ provide: ARTIFACT_PROFILE, useFactory: () => loadArtifactProfile() }, RulePipelineBuildsService, RulePipelineProcessor],
})
export class RulePipelineModule {}

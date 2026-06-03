import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../admin-service-client';
import { SimulationStudioController } from './simulation-studio.controller';
import { SimulationStudioService } from './simulation-studio.service';
import { DockerHubModule } from './dockerhub/dockerhub.module';
import { EphemeralEnvController } from './ephemeral-env/ephemeral-env.controller';
import { EphemeralEnvService } from './ephemeral-env/ephemeral-env.service';

@Module({
  imports: [HttpModule, DockerHubModule],
  controllers: [SimulationStudioController, EphemeralEnvController],
  providers: [SimulationStudioService, AdminServiceClient, EphemeralEnvService],
  exports: [SimulationStudioService],
})
export class SimulationStudioModule { }

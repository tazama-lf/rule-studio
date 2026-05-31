import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../admin-service-client';
import { SimulationStudioController } from './simulation-studio.controller';
import { SimulationStudioService } from './simulation-studio.service';
import { DockerHubModule } from '../dockerhub/dockerhub.module';

@Module({
  imports: [HttpModule, DockerHubModule],
  controllers: [SimulationStudioController],
  providers: [SimulationStudioService, AdminServiceClient],
  exports: [SimulationStudioService],
})
export class SimulationStudioModule {}

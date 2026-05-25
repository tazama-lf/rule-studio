import { Module } from '@nestjs/common';
import { DockerHubController } from './dockerhub.controller';
import { DockerHubService } from './dockerhub.service';
import { TenantConfigService } from './tenant-config.service';

@Module({
  controllers: [DockerHubController],
  providers: [DockerHubService, TenantConfigService],
  exports: [DockerHubService, TenantConfigService],
})
export class DockerHubModule { }

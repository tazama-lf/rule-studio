import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DockerHubController } from './dockerhub.controller';
import { DockerHubService } from './dockerhub.service';

@Module({
  imports: [ConfigModule],
  controllers: [DockerHubController],
  providers: [DockerHubService],
  exports: [DockerHubService],
})
export class DockerHubModule {}

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FetchEvaluationService } from './fetch-evaluation.service';
import { FetchEvaluationController } from './fetch-evaluation.controller';
import { AdminServiceClient } from '../admin-service-client';

@Module({
  imports: [HttpModule],
  providers: [FetchEvaluationService, AdminServiceClient],
  exports: [FetchEvaluationService],
  controllers: [FetchEvaluationController],
})
export class FetchEvaluationModule {}
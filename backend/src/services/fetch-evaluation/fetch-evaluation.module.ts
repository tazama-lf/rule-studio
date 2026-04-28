import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FetchEvaluationService } from './fetch-evaluation.service';
import { FetchEvaluationController } from './fetch-evaluation.controller';

@Module({
  imports: [HttpModule],
  providers: [FetchEvaluationService],
  exports: [FetchEvaluationService],
  controllers: [FetchEvaluationController],
})
export class FetchEvaluationModule {}

import { Module } from '@nestjs/common';
import { MsgSampleGenerationService } from './msg-sample-generation.service';
import { MsgSampleGenerationController } from './msg-sample-generation.controller';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../admin-service-client';

@Module({
  imports: [HttpModule],
  controllers: [MsgSampleGenerationController],
  providers: [MsgSampleGenerationService, AdminServiceClient],
  exports: [MsgSampleGenerationService],
})
export class MsgSampleGenerationModule {}

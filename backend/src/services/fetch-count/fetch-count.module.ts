import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../admin-service-client';
import { FetchCountService } from './fetch-count.service';
import { FetchCountController } from './fetch-count.controller';

@Module({
  imports: [HttpModule],
  providers: [FetchCountService, AdminServiceClient],
  exports: [FetchCountService],
  controllers: [FetchCountController],
})
export class FetchCountModule {}

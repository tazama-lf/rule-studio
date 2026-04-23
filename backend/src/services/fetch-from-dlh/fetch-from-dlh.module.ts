import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FetchFromDlhController } from './fetch-from-dlh.controller';
import { FetchFromDlhService } from './fetch-from-dlh.service';
import { AdminServiceClient } from '../admin-service-client';

@Module({
  imports: [HttpModule],
  controllers: [FetchFromDlhController],
  providers: [FetchFromDlhService, AdminServiceClient],
  exports: [FetchFromDlhService],
})
export class FetchFromDlhModule {}

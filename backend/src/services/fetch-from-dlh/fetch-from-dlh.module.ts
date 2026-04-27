import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FetchFromDlhController } from './fetch-from-dlh.controller';
import { FetchFromDlhService } from './fetch-from-dlh.service';
import { AdminServiceClient } from '../admin-service-client';
import { SendToDemsModule } from '../send-to-dems/send-to-dems.module';

@Module({
  imports: [HttpModule, SendToDemsModule],
  controllers: [FetchFromDlhController],
  providers: [FetchFromDlhService, AdminServiceClient],
  exports: [FetchFromDlhService],
})
export class FetchFromDlhModule {}

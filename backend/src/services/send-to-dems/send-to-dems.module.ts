import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../admin-service-client';
import { SendToDemsService } from './send-to-dems.service';
import { SendToDemsController } from './send-to-dems.controller';

@Module({
  imports: [HttpModule],
  providers: [SendToDemsService, AdminServiceClient],
  exports: [SendToDemsService],
  controllers: [SendToDemsController],
})
export class SendToDemsModule {}

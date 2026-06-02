import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../../admin-service-client';
import { TriggerTxtpConfigController } from './trigger-txtp-config.controller';
import { TriggerTxtpConfigService } from './trigger-txtp-config.service';

@Module({
  imports: [HttpModule],
  controllers: [TriggerTxtpConfigController],
  providers: [TriggerTxtpConfigService, AdminServiceClient],
  exports: [TriggerTxtpConfigService],
})
export class TriggerTxtpConfigModule {}

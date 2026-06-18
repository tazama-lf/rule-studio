import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../../admin-service-client';
import { ContextTxtpConfigController } from './context-txtp-config.controller';
import { ContextTxtpConfigService } from './context-txtp-config.service';

@Module({
  imports: [HttpModule],
  controllers: [ContextTxtpConfigController],
  providers: [ContextTxtpConfigService, AdminServiceClient],
  exports: [ContextTxtpConfigService],
})
export class ContextTxtpConfigModule {}

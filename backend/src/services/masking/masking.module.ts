import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MaskingController } from './masking.controller';
import { MaskingService } from './masking.service';
import { AdminServiceClient } from '../admin-service-client';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [MaskingController],
  providers: [MaskingService, AdminServiceClient],
  exports: [MaskingService],
})
export class MaskingModule { }

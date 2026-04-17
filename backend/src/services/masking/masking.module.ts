import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MaskingController } from './masking.controller';
import { MaskingService } from './masking.service';
import { AdminServiceClient } from '../admin-service-client';

@Module({
  imports: [HttpModule],
  controllers: [MaskingController],
  providers: [MaskingService, AdminServiceClient],
  exports: [MaskingService],
})
export class MaskingModule {}

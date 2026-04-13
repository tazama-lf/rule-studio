import { Module } from '@nestjs/common';
import { MaskingController } from './masking.controller';
import { MaskingService } from './masking.service';
import { AdminServiceClient } from '../admin-service-client';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [MaskingController],
  providers: [MaskingService, AdminServiceClient]
})
export class MaskingModule { }

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../../admin-service-client';
import { GenerationsController } from './generations.controller';
import { GenerationsService } from './generations.service';

@Module({
  imports: [HttpModule],
  controllers: [GenerationsController],
  providers: [GenerationsService, AdminServiceClient],
  exports: [GenerationsService],
})
export class GenerationsModule {}

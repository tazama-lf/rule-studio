import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../../admin-service-client';
import { FakerSemanticDataService } from './faker_semantic_data.service';
import { FakerSemanticDataController } from './faker_semantic_data.controller';

@Module({
  imports: [HttpModule],
  controllers: [FakerSemanticDataController],
  providers: [FakerSemanticDataService, AdminServiceClient],
  exports: [FakerSemanticDataService],
})
export class FakerSemanticDataModule {}

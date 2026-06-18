import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../../admin-service-client';
import { EnrichmentTableController } from './enrichment-table.controller';
import { EnrichmentTableService } from './enrichment-table.service';

@Module({
  imports: [HttpModule],
  controllers: [EnrichmentTableController],
  providers: [EnrichmentTableService, AdminServiceClient],
  exports: [EnrichmentTableService],
})
export class EnrichmentTableModule {}

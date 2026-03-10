import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../admin-service-client';
import { ParseExtractModule } from '../parse-extract/parse-extract.module';
import { SimulationLogsController } from './simulation-logs.controller';
import { SimulationLogsService } from './simulation-logs.service';

@Module({
  imports: [HttpModule, ParseExtractModule],
  controllers: [SimulationLogsController],
  providers: [SimulationLogsService, AdminServiceClient],
  exports: [SimulationLogsService],
})
export class SimulationLogsModule {}

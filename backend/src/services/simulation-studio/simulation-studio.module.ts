import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../admin-service-client';
import { SimulationStudioController } from './simulation-studio.controller';
import { SimulationStudioService } from './simulation-studio.service';

@Module({
  imports: [HttpModule],
  controllers: [SimulationStudioController],
  providers: [SimulationStudioService, AdminServiceClient],
  exports: [SimulationStudioService],
})
export class SimulationStudioModule {}

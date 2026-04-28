import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './simulation.service';
import { AdminServiceClient } from '../services/admin-service-client';

@Module({
  imports: [HttpModule],
  controllers: [SimulationController],
  providers: [SimulationService, AdminServiceClient],
})
export class SimulationModule {}

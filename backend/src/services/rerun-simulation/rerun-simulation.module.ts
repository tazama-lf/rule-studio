import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RerunSimulationController } from './rerun-simulation.controller';
import { RerunSimulationService } from './rerun-simulation.service';
import { AdminServiceClient } from '../admin-service-client';
import { SendToDemsModule } from '../send-to-dems/send-to-dems.module';

@Module({
  imports: [HttpModule, SendToDemsModule],
  controllers: [RerunSimulationController],
  providers: [RerunSimulationService, AdminServiceClient],
})
export class RerunSimulationModule {}

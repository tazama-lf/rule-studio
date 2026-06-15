import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../../admin-service-client';
import { EphemeralEnvService } from '../ephemeral-env/ephemeral-env.service';
import { RunSimulationController } from './run-simulation.controller';
import { RunSimulationService } from './run-simulation.service';
import { GenerationsService } from '../generations/generations.service';

@Module({
  imports: [HttpModule],
  controllers: [RunSimulationController],
  providers: [RunSimulationService, AdminServiceClient, EphemeralEnvService, GenerationsService],
})
export class RunSimulationModule {}

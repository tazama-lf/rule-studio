import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../../admin-service-client';
import { EphemeralEnvService } from '../ephemeral-env/ephemeral-env.service';
import { RunSimulationController } from './run-simulation.controller';
import { RunSimulationService } from './run-simulation.service';
import { MsgSampleGenerationService } from 'src/services/msg-sample-generation/msg-sample-generation.service';

@Module({
  imports: [HttpModule],
  controllers: [RunSimulationController],
  providers: [RunSimulationService, AdminServiceClient, MsgSampleGenerationService, EphemeralEnvService],
})
export class RunSimulationModule { }

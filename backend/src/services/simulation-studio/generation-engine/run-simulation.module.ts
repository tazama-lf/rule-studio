import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../../admin-service-client';
import { EphemeralEnvModule } from '../ephemeral-env/ephemeral-env.module';
import { RunSimulationController } from './run-simulation.controller';
import { RunSimulationService } from './run-simulation.service';
import { MsgSampleGenerationService } from 'src/services/msg-sample-generation/msg-sample-generation.service';
import { GenerationsService } from '../generations/generations.service';

@Module({
  imports: [HttpModule, EphemeralEnvModule],
  controllers: [RunSimulationController],
  providers: [RunSimulationService, AdminServiceClient, MsgSampleGenerationService, GenerationsService],
})
export class RunSimulationModule {}

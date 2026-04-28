import { Module } from '@nestjs/common';
import { RuleSimulationController } from './rule-simulation.controller';
import { RuleSimulationService } from './rule-simulation.service';
import { AdminServiceClient } from '../admin-service-client';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [RuleSimulationController],
  providers: [RuleSimulationService, AdminServiceClient],
})
export class RuleSimulationModule { }

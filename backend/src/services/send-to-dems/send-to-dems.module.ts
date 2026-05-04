import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../admin-service-client';
import { SendToDemsService } from './send-to-dems.service';
import { SendToDemsController } from './send-to-dems.controller';
import { QueuesModule } from '../../queues/queues.module';
import { GatewaysModule } from '../../gateways/gateways.module';
import { SimulationProcessor } from '../../queues/simulation.processor';
import { FetchEvaluationModule } from '../fetch-evaluation/fetch-evaluation.module';

@Module({
  imports: [HttpModule, QueuesModule, GatewaysModule, FetchEvaluationModule],
  providers: [SendToDemsService, AdminServiceClient, SimulationProcessor],
  exports: [SendToDemsService],
  controllers: [SendToDemsController],
})
export class SendToDemsModule {}

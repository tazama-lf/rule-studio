import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../admin-service-client';
import { SendToDemsService } from './send-to-dems.service';
import { SendToDemsController } from './send-to-dems.controller';
import { QueuesModule } from '../../queues/queues.module';
import { GatewaysModule } from '../../gateways/gateways.module';
import { SimulationProcessor } from '../../queues/simulation.processor';

@Module({
  imports: [HttpModule, QueuesModule, GatewaysModule],
  providers: [SendToDemsService, AdminServiceClient, SimulationProcessor],
  exports: [SendToDemsService],
  controllers: [SendToDemsController],
})
export class SendToDemsModule {}

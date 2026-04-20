import { Module } from '@nestjs/common';
import { SimulationProgressGateway } from './simulation-progress.gateway';

@Module({
  providers: [SimulationProgressGateway],
  exports: [SimulationProgressGateway],
})
export class GatewaysModule {}

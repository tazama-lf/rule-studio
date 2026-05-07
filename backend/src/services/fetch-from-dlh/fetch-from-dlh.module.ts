import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AdminServiceClient } from '../admin-service-client';
import { SendToDemsModule } from '../send-to-dems/send-to-dems.module';
import { SimulationService } from '../simulation/simulation.service';
import { FetchFromDlhController } from './fetch-from-dlh.controller';
import { FetchFromDlhService } from './fetch-from-dlh.service';

@Module({
  imports: [HttpModule, SendToDemsModule],
  controllers: [FetchFromDlhController],
  providers: [FetchFromDlhService, AdminServiceClient, SimulationService],
  exports: [FetchFromDlhService],
})
export class FetchFromDlhModule { }

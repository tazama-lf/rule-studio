import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';
import { AdminServiceClient } from '../admin-service-client';

@Module({
  imports: [HttpModule],
  controllers: [RulesController],
  providers: [RulesService, AdminServiceClient],
  exports: [RulesService],
})
export class RulesModule {}

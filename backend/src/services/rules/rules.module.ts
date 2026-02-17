import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';
import { AdminServiceClient } from '../admin-service-client';
import { ParseExtractModule } from '../parse-extract/parse-extract.module';

@Module({
  imports: [HttpModule, ParseExtractModule],
  controllers: [RulesController],
  providers: [RulesService, AdminServiceClient],
  exports: [RulesService],
})
export class RulesModule {}

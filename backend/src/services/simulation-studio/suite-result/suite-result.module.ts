import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from 'src/services/admin-service-client';
import { SuiteResultService } from './suite-result.service';
import { SuiteResultController } from './suite-result.controller';

@Module({
  imports: [HttpModule],
  controllers: [SuiteResultController],
  providers: [SuiteResultService, AdminServiceClient],
  exports: [SuiteResultService],
})
export class SuiteResultModule {}

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ParseExtractController } from './parse-extract.controller';
import { ParseExtractService } from './parse-extract.service';
import { AdminServiceClient } from '../admin-service-client';

@Module({
  imports: [HttpModule],
  controllers: [ParseExtractController],
  providers: [ParseExtractService, AdminServiceClient],
  exports: [ParseExtractService],
})
export class ParseExtractModule {}

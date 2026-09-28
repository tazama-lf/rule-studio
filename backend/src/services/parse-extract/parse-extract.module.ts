import { Module } from '@nestjs/common';
import { ParseExtractController } from './parse-extract.controller';
import { ParseExtractService } from './parse-extract.service';

@Module({
  controllers: [ParseExtractController],
  providers: [ParseExtractService],
  exports: [ParseExtractService],
})
export class ParseExtractModule {}

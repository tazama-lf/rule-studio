import { Module } from '@nestjs/common';
import { SendToDemsService } from './send-to-dems.service';
import { SendToDemsController } from './send-to-dems.controller';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '../../logger-service/logger-service.module';

@Module({
  imports: [LoggerModule, HttpModule],
  providers: [SendToDemsService],
  exports: [SendToDemsService],
  controllers: [SendToDemsController],
})
export class SendToDemsModule {}

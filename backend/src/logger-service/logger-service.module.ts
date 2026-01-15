import { Module } from '@nestjs/common';
import { LoggerService } from '@tazama-lf/frms-coe-lib';
import { validateProcessorConfig } from '@tazama-lf/frms-coe-lib/lib/config';

@Module({
  providers: [
    {
      provide: LoggerService,
      useFactory: () => {
        const configuration = validateProcessorConfig();
        return new LoggerService(configuration);
      },
    },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}

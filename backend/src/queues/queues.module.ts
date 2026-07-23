import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SIMULATION_QUEUE } from './simulation-queue.constants';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
      prefix: process.env.BULL_PREFIX ?? 'bull',
    }),
    BullModule.registerQueue({
      name: SIMULATION_QUEUE,
      defaultJobOptions: {
        attempts: 1, // No automatic retries — simulation jobs are not idempotent
        removeOnComplete: { age: 3600 }, // Keep completed jobs in Redis for 1 hour
        removeOnFail: { age: 86400 }, // Keep failed jobs for 24 hours for debugging
      },
    }),
  ],
  exports: [BullModule],
})
export class QueuesModule {}

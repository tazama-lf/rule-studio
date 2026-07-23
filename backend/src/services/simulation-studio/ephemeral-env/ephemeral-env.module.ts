import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../../admin-service-client';
import { EphemeralEnvController } from '../ephemeral-env/ephemeral-env.controller';
import { EphemeralEnvService } from '../ephemeral-env/ephemeral-env.service';

@Module({
  imports: [HttpModule],
  controllers: [EphemeralEnvController],
  providers: [AdminServiceClient, EphemeralEnvService],
  exports: [EphemeralEnvService],
})
export class EphemeralEnvModule {}

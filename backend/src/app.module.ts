import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './services/auth/auth.module';
import { LoggerModule } from './logger-service/logger-service.module';
import { RulesModule } from './services/rules/rules.module';
import { ConfigModule } from './services/config/config.module';
import { NodesModule } from './services/nodes/nodes.module';
import { ParseExtractModule } from './services/parse-extract/parse-extract.module';
import { SimulationLogsModule } from './services/simulation-logs/simulation-logs.module';
import { SendToDemsModule } from './services/send-to-dems/send-to-dems.module';
import { AuditModule } from './audit/audit.module';
import { MaskingModule } from './services/masking/masking.module';
import { GatewaysModule } from './gateways/gateways.module';
import { SimulationModule } from './services/simulation/simulation.module';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    LoggerModule,
    RulesModule,
    ConfigModule,
    NodesModule,
    ParseExtractModule,
    SimulationLogsModule,
    SendToDemsModule,
    MaskingModule,
    GatewaysModule,
    SimulationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

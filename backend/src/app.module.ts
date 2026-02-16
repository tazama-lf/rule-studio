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
import { createAuditProvider } from '@tazama-lf/audit-lib';

@Module({
  imports: [
    AuthModule,
    LoggerModule,
    RulesModule,
    ConfigModule,
    NodesModule,
    ParseExtractModule,
    SimulationLogsModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Audit logging provider for tracking critical user actions
    createAuditProvider('rule-studio-backend'),
  ],
})
export class AppModule {}

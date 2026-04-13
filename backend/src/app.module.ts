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
import { AuditModule } from './audit/audit.module';
import { MaskingModule } from './services/masking/masking.module';

@Module({
  imports: [AuditModule, AuthModule, LoggerModule, RulesModule, ConfigModule, NodesModule, ParseExtractModule, SimulationLogsModule, MaskingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

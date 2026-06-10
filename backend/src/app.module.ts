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
import { RerunSimulationModule } from './services/rerun-simulation/rerun-simulation.module';
import { FetchFromDlhModule } from './services/fetch-from-dlh/fetch-from-dlh.module';
import { FetchCountModule } from './services/fetch-count/fetch-count.module';
import { SimulationModule } from './services/simulation/simulation.module';
import { FetchEvaluationModule } from './services/fetch-evaluation/fetch-evaluation.module';
import { SimulationStudioModule } from './services/simulation-studio/suites/simulation-studio.module';
import { GenerationsModule } from './services/simulation-studio/generations/generations.module';
import { ContextTxtpConfigModule } from './services/simulation-studio/context-txtp-config/context-txtp-config.module';
import { TriggerTxtpConfigModule } from './services/simulation-studio/trigger-txtp-config/trigger-txtp-config.module';
import { EnrichmentTableModule } from './services/simulation-studio/enrichment-table/enrichment-table.module';
import { FakerSemanticDataModule } from './services/simulation-studio/faker-semantic-data/faker_semantic_data.module';
import { MsgSampleGenerationModule } from './services/msg-sample-generation/msg-sample-generation.module';

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
    RerunSimulationModule,
    FetchFromDlhModule,
    FetchCountModule,
    FetchFromDlhModule,
    FetchCountModule,
    FetchEvaluationModule,
    SimulationStudioModule,
    GenerationsModule,
    ContextTxtpConfigModule,
    TriggerTxtpConfigModule,
    EnrichmentTableModule,
    FakerSemanticDataModule,
    MsgSampleGenerationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

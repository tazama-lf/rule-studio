import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../admin-service-client';
import {
  GenerateContextQueryDto,
  GenerateContextResponseDto,
  PatchSimulationSuitesDto,
  RegistryReposResponseDto,
  RegistryTagsResponseDto,
  RequestSimulationSuitesDto,
  RunSuiteResponseDto,
  RunSuiteStatusResponseDto,
  TxtpSampleResponseDto,
  TxtpSchemaResponseDto,
  TxtpTypeDto,
  UpdateDraftSuiteDto,
  SimulationSuiteResponseDto,
  SimulationSuitesDto,
  SimulationSuitesListDto,
  SimulationSuitesQueryDto,
} from './dto';
import type { ISimulationSuiteCreatePayload } from './interface/simulation-studio.interface';
import { DockerHubService } from '../dockerhub/dockerhub.service';

@Injectable()
export class SimulationStudioService {
  private readonly logger = new Logger(SimulationStudioService.name);

  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly dockerHubService: DockerHubService,
  ) {}

  private toRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  private extractCreatedSuite(response: unknown): SimulationSuitesDto {
    const normalizedResponse = this.toRecord(response);
    if ('data' in normalizedResponse) {
      return normalizedResponse.data as unknown as SimulationSuitesDto;
    }
    return normalizedResponse as unknown as SimulationSuitesDto;
  }

  /**
   * Fetches simulation suites with optional filters for suite name, status, and associated rule name.
   * Supports pagination through offset and limit parameters.
   * @param token - Authentication token for API access
   * @param query - Query parameters for filtering and pagination
   * @returns A list of simulation suites matching the query criteria along with pagination info
   */
  async getSimulationSuites(token: string, query: SimulationSuitesQueryDto): Promise<SimulationSuitesListDto> {
    try {
      const response = await this.adminServiceClient.getSimulationSuites(token, query);
      this.logger.log('Successfully fetched simulation suites');
      return response;
    } catch (err) {
      const error = err as Error;
      this.logger.error('Error fetching simulation suites', error.stack);
      throw error;
    }
  }

  async getSimulationSuiteById(token: string, id: number): Promise<SimulationSuiteResponseDto> {
    try {
      return await this.adminServiceClient.getSimulationSuiteById(token, id);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error fetching simulation suite by id: ${id}`, error.stack);
      throw error;
    }
  }

  async createSimulationSuites(token: string, suites: RequestSimulationSuitesDto): Promise<SimulationSuitesDto> {
    try {
      const payload: ISimulationSuiteCreatePayload = {
        name: suites.name,
        description: suites.description,
        simulation_type: suites.simulation_type,
        status: suites.status,
        rule_repo: suites.rule_repo,
        rule_version: suites.rule_version,
        clone_source_suite_id: suites.clone_source_suite_id,
        metadata: suites.metadata,
        rule_name: suites.rule_name ?? suites.associated_rule,
        primary_txtp: suites.primary_txtp ?? suites.txtp,
        primary_txtp_version: suites.primary_txtp_version ?? suites.txtp_version ?? suites.version,
        wizard_progress: suites.wizard_progress ?? { step: 1, completed: false },
      };
      const createResponse = await this.adminServiceClient.createSimulationSuite(token, payload);
      return this.extractCreatedSuite(createResponse);
    } catch (err) {
      const error = err as Error;
      this.logger.error('Error creating simulation suite', error.stack);
      throw error;
    }
  }

  async patchSimulationSuite(token: string, id: number, payload: PatchSimulationSuitesDto): Promise<SimulationSuiteResponseDto> {
    try {
      const normalizedPayload: PatchSimulationSuitesDto = {
        name: payload.name,
        description: payload.description,
        simulation_type: payload.simulation_type,
        status: payload.status,
        rule_repo: payload.rule_repo,
        rule_version: payload.rule_version,
        clone_source_suite_id: payload.clone_source_suite_id,
        iteration_count: payload.iteration_count,
        run_count: payload.run_count,
        last_run_at: payload.last_run_at,
        wizard_progress: payload.wizard_progress,
        metadata: payload.metadata,
        rule_name: payload.rule_name ?? payload.associated_rule,
        primary_txtp: payload.primary_txtp ?? payload.txtp,
        primary_txtp_version: payload.primary_txtp_version ?? payload.txtp_version ?? payload.version,
      };
      return await this.adminServiceClient.patchSimulationSuite(token, id, normalizedPayload);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error patching simulation suite with id: ${id}`, error.stack);
      throw error;
    }
  }

  async putSimulationSuiteDraft(token: string, id: number, payload: UpdateDraftSuiteDto): Promise<SimulationSuiteResponseDto> {
    try {
      return await this.adminServiceClient.putSimulationSuiteDraft(token, id, payload);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error saving draft for simulation suite with id: ${id}`, error.stack);
      throw error;
    }
  }

  async getRegistryRepos(tenantId: string): Promise<RegistryReposResponseDto> {
    return await this.dockerHubService.getPublishedRules(tenantId);
  }

  async getRegistryRepoTags(tenantId: string, repo: string): Promise<RegistryTagsResponseDto> {
    return await this.dockerHubService.getTagsForRule(tenantId, repo);
  }

  async getTxtpTypes(token: string): Promise<TxtpTypeDto[]> {
    const transactionTypes = await this.adminServiceClient.getTransactionTypes(token);
    const grouped = new Map<string, string[]>();

    for (const row of transactionTypes) {
      const txtp = row.transaction_type;
      if (!grouped.has(txtp)) {
        grouped.set(txtp, []);
      }
    }

    return Array.from(grouped.entries()).map(([txtp, versions]) => ({ txtp, versions }));
  }

  async getTxtpSchema(token: string, txtp: string, version: string): Promise<TxtpSchemaResponseDto> {
    const configRow = await this.adminServiceClient.getConfigRowByTxTp(txtp, version, token);
    return { schema: configRow.config.schema };
  }

  async getTxtpSample(token: string, txtp: string, version: string): Promise<TxtpSampleResponseDto> {
    const payload = await this.adminServiceClient.getPayloadByTransactionType(txtp, version, token);
    return { payload };
  }

  async generateSimulationContext(token: string, id: number, query: GenerateContextQueryDto): Promise<GenerateContextResponseDto> {
    return await this.adminServiceClient.generateSimulationContext(token, id, query);
  }

  async runSimulationSuite(token: string, id: number): Promise<RunSuiteResponseDto> {
    return await this.adminServiceClient.runSimulationSuite(token, id);
  }

  async getSimulationRunStatus(token: string, id: number, runId: string): Promise<RunSuiteStatusResponseDto> {
    return await this.adminServiceClient.getSimulationRunStatus(token, id, runId);
  }
}

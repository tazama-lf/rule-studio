import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../../admin-service-client';
import {
  PatchSimulationSuitesDto,
  RequestSimulationSuitesDto,
  SimulationSuitesCountsResponseDto,
  SimulationSuiteResponseDto,
  SimulationSuitesDto,
  SimulationSuitesListDto,
  SimulationSuitesQueryDto,
} from './dto';
import type { ISimulationSuiteCreatePayload } from '../interface/simulation-studio.interface';

@Injectable()
export class SimulationStudioService {
  private readonly logger = new Logger(SimulationStudioService.name);

  constructor(private readonly adminServiceClient: AdminServiceClient) {}

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

  async getSimulationSuitesCounts(token: string): Promise<SimulationSuitesCountsResponseDto> {
    try {
      const response = await this.adminServiceClient.getSimulationSuitesCounts(token);
      this.logger.log('Successfully fetched simulation suites counts');
      return response;
    } catch (err) {
      const error = err as Error;
      this.logger.error('Error fetching simulation suites counts', error.stack);
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
        rule_config: suites.rule_config,
        primary_txtp: suites.primary_txtp ?? suites.txtp,
        primary_txtp_version: suites.primary_txtp_version ?? suites.txtp_version ?? suites.version,
      };
      return await this.adminServiceClient.createSimulationSuite(token, payload);
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
        rule_config: payload.rule_config,
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
}

import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../admin-service-client';
import { RequestSimulationLogsDto, SimulationLogsDto } from './dto';

@Injectable()
export class SimulationLogsService {
  private readonly logger = new Logger(SimulationLogsService.name);

  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async getSimulationLogs(token: string, ruleId: string, query: { category: string }): Promise<SimulationLogsDto> {
    try {
      const response = await this.adminServiceClient.getSimulationLogs(token, ruleId, query);
      this.logger.log(`Successfully fetched simulation logs for ruleId: ${ruleId}`);
      return response;
    } catch (error) {
      this.logger.error(`Error fetching simulation logs for ruleId: ${ruleId}`, error.stack);
      throw error;
    }
  }

  async insertSimulationLogs(token: string, ruleId: string, logs: RequestSimulationLogsDto): Promise<SimulationLogsDto> {
    try {
      const logData = {
        rule_id: ruleId,
        old_data: logs.old_data,
        new_data: logs.new_data,
        description: logs.description,
        category: logs.category,
      };
      return await this.adminServiceClient.insertSimulationLogs(token, logData);
    } catch (error) {
      this.logger.error('Error inserting simulation logs', error.stack);
      throw error;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../admin-service-client';
import type { AuthenticatedUser } from '../auth/auth.types';
import type { SimulationListResponseDto, CreateSimulationDto, CreateSimulationResponseDto, ExcludedTypeProps } from './dto/simulation.dto';

@Injectable()
export class SimulationService {
  private readonly logger = new Logger(SimulationService.name);

  constructor(private readonly adminServiceClient: AdminServiceClient) { }

  async getAllSimulations(
    offset: number,
    limit: number,
    user: AuthenticatedUser,
  ): Promise<SimulationListResponseDto> {
    try {
      return await this.adminServiceClient.getAllSimulations(offset, limit, user.token.tokenString);
    } catch (error) {
      this.logger.error(`Error fetching simulations: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async createSimulation(
    body: CreateSimulationDto,
    user: AuthenticatedUser,
  ): Promise<CreateSimulationResponseDto> {
    try {
      return await this.adminServiceClient.createSimulation(body, user.token.tokenString);
    } catch (error) {
      this.logger.error(`Error creating simulation: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async excludedTypes(token: string): Promise<ExcludedTypeProps[]> {
    try {
      const response = await this.adminServiceClient.getExcludedTypes(token);
      return response
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching excluded types: ${err.message}`);
      throw error;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../../admin-service-client';
import type { SuiteGenerationsListDto, SuiteGenerationResponseDto, ContextConfigsListDto } from './dto/generations.dto';

@Injectable()
export class GenerationsService {
  private readonly logger = new Logger(GenerationsService.name);

  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async getGenerationsForSuite(token: string, suiteId: number): Promise<SuiteGenerationsListDto> {
    try {
      return await this.adminServiceClient.getSuiteGenerations(token, suiteId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error fetching generations for suite ${suiteId}`, error.stack);
      throw err;
    }
  }

  async getLatestGenerationForSuite(token: string, suiteId: number): Promise<SuiteGenerationResponseDto> {
    try {
      return await this.adminServiceClient.getLatestSuiteGeneration(token, suiteId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error fetching latest generation for suite ${suiteId}`, error.stack);
      throw err;
    }
  }

  async getContextConfigsForGeneration(token: string, generationId: number): Promise<ContextConfigsListDto> {
    try {
      return await this.adminServiceClient.getGenerationContextConfigs(token, generationId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error fetching context configs for generation ${generationId}`, error.stack);
      throw err;
    }
  }
}

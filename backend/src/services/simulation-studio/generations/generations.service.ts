import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../../admin-service-client';
import type {
  SuiteGenerationsListDto,
  SuiteGenerationResponseDto,
  GenerationSummaryResponseDto,
  SuiteGenerationDto,
} from './dto/generations.dto';
import type { ContextConfigsListDto } from '../context-txtp-config/dto/context-txtp-config.dto';

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

  async getGenerationSummary(token: string, generationId: number): Promise<GenerationSummaryResponseDto> {
    try {
      return await this.adminServiceClient.getGenerationSummary(token, generationId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error fetching summary for generation ${generationId}`, error.stack);
      throw err;
    }
  }

  async updateWizardProgress(
    token: string,
    generationId: number,
    body: { current_step_num: number; completed_step_num: number },
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.adminServiceClient.updateWizardProgress(token, generationId, body);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error updating wizard progress for generation ${generationId}`, error.stack);
      throw err;
    }
  }

  async deleteContextTxtpConfig(token: string, generationId: number, configId: number): Promise<{ success: boolean; message: string }> {
    try {
      return await this.adminServiceClient.deleteContextTxtpConfig(token, generationId, configId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error deleting context txtp config ${configId} for generation ${generationId}`, error.stack);
      throw err;
    }
  }

  async deleteTriggerTxtpConfig(token: string, generationId: number, configId: number): Promise<{ success: boolean; message: string }> {
    try {
      return await this.adminServiceClient.deleteTriggerTxtpConfig(token, generationId, configId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error deleting trigger txtp config ${configId} for generation ${generationId}`, error.stack);
      throw err;
    }
  }

  async resumeGeneration(token: string, suiteId: number): Promise<SuiteGenerationDto> {
    try {
      return await this.adminServiceClient.resumeGeneration(token, suiteId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error resuming generation for suite ${suiteId}`, error.stack);
      throw err;
    }
  }

  async cloneGeneration(token: string, generationId: number): Promise<SuiteGenerationResponseDto> {
    try {
      return await this.adminServiceClient.cloneGeneration(token, generationId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error cloning generation ${generationId}`, error.stack);
      throw err;
    }
  }
}

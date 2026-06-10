import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../../admin-service-client';
import type {
  AddTriggerTxtpConfigDto,
  CreateTriggerMappingDto,
  TriggerMappingResponseDto,
  TriggerMappingsResponseDto,
  TriggerConfigsListDto,
  TriggerConfigWithStrategiesResponseDto,
  BulkTriggerConfigItemDto,
  BulkUpdateTriggerConfigsResponseDto,
} from './dto/trigger-txtp-config.dto';

@Injectable()
export class TriggerTxtpConfigService {
  private readonly logger = new Logger(TriggerTxtpConfigService.name);

  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async getTriggerConfigs(token: string, generationId: number): Promise<TriggerConfigsListDto> {
    try {
      return await this.adminServiceClient.getTriggerConfigs(token, generationId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error fetching trigger configs for generation ${generationId}`, error.stack);
      throw err;
    }
  }

  async addTriggerConfig(
    token: string,
    generationId: number,
    dto: AddTriggerTxtpConfigDto,
  ): Promise<TriggerConfigWithStrategiesResponseDto> {
    try {
      return await this.adminServiceClient.addTriggerTxtpConfig(token, generationId, dto);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error adding trigger config for generation ${generationId}`, error.stack);
      throw err;
    }
  }

  async bulkUpdateTriggerConfigs(
    token: string,
    generationId: number,
    items: BulkTriggerConfigItemDto[],
  ): Promise<BulkUpdateTriggerConfigsResponseDto> {
    try {
      return await this.adminServiceClient.bulkUpdateTriggerConfigs(token, generationId, items);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error bulk updating trigger configs for generation ${generationId}`, error.stack);
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

  async createTriggerMapping(token: string, dto: CreateTriggerMappingDto): Promise<TriggerMappingResponseDto> {
    try {
      return await this.adminServiceClient.createTriggerMapping(token, dto);
    } catch (err) {
      const error = err as Error;
      this.logger.error('Error creating trigger mapping', error.stack);
      throw err;
    }
  }

  async getTriggerMappings(token: string, primaryTxtpId: number, relatedTxtpId: number): Promise<TriggerMappingsResponseDto> {
    try {
      return await this.adminServiceClient.getTriggerMappings(token, primaryTxtpId, relatedTxtpId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error fetching trigger mappings for ${primaryTxtpId}/${relatedTxtpId}`, error.stack);
      throw err;
    }
  }

  async deleteTriggerMapping(token: string, primaryTxtpId: number, relatedTxtpId: number): Promise<{ success: boolean; message: string }> {
    try {
      return await this.adminServiceClient.deleteTriggerMapping(token, primaryTxtpId, relatedTxtpId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error deleting trigger mappings for ${primaryTxtpId}/${relatedTxtpId}`, error.stack);
      throw err;
    }
  }
}

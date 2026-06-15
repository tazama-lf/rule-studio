import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../../admin-service-client';
import type {
  AddContextTxtpConfigDto,
  CreateContextMappingDto,
  ContextMappingResponseDto,
  ContextMappingsResponseDto,
  ContextConfigWithStrategiesResponseDto,
  ContextConfigsWithStrategiesListDto,
  BulkConfigItemDto,
  BulkUpdateContextConfigsResponseDto,
} from './dto/context-txtp-config.dto';

@Injectable()
export class ContextTxtpConfigService {
  private readonly logger = new Logger(ContextTxtpConfigService.name);

  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async getContextConfigs(token: string, generationId: number): Promise<ContextConfigsWithStrategiesListDto> {
    try {
      return await this.adminServiceClient.getContextConfigs(token, generationId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error fetching context configs for generation ${generationId}`, error.stack);
      throw err;
    }
  }

  async addContextConfig(
    token: string,
    generationId: number,
    dto: AddContextTxtpConfigDto,
  ): Promise<ContextConfigWithStrategiesResponseDto> {
    try {
      return await this.adminServiceClient.addContextTxtpConfig(token, generationId, dto);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error adding context config for generation ${generationId}`, error.stack);
      throw err;
    }
  }

  async bulkUpdateContextConfigs(
    token: string,
    generationId: number,
    items: BulkConfigItemDto[],
  ): Promise<BulkUpdateContextConfigsResponseDto> {
    try {
      return await this.adminServiceClient.bulkUpdateContextConfigs(token, generationId, items);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error bulk updating context configs for generation ${generationId}`, error.stack);
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

  async createContextMapping(token: string, dto: CreateContextMappingDto): Promise<ContextMappingResponseDto> {
    try {
      return await this.adminServiceClient.createContextMapping(token, dto);
    } catch (err) {
      const error = err as Error;
      this.logger.error('Error creating context mapping', error.stack);
      throw err;
    }
  }

  async getContextMappings(token: string, primaryTxtpId: number, relatedTxtpId: number): Promise<ContextMappingsResponseDto> {
    try {
      return await this.adminServiceClient.getContextMappings(token, primaryTxtpId, relatedTxtpId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error fetching context mappings for ${primaryTxtpId}/${relatedTxtpId}`, error.stack);
      throw err;
    }
  }

  async deleteContextMapping(token: string, primaryTxtpId: number, relatedTxtpId: number): Promise<{ success: boolean; message: string }> {
    try {
      return await this.adminServiceClient.deleteContextMapping(token, primaryTxtpId, relatedTxtpId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error deleting context mappings for ${primaryTxtpId}/${relatedTxtpId}`, error.stack);
      throw err;
    }
  }
}

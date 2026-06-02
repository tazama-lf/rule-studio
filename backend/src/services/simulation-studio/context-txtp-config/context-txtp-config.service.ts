import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../../admin-service-client';
import type {
  AddContextTxtpConfigDto,
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
}

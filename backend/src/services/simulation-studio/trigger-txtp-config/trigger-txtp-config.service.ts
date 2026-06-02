import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../../admin-service-client';
import type {
  AddTriggerTxtpConfigDto,
  TriggerConfigsListDto,
  TriggerConfigWithOverridesResponseDto,
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
  ): Promise<TriggerConfigWithOverridesResponseDto> {
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
}

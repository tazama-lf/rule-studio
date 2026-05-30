import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../../admin-service-client';
import type {
  UpdateContextTxtpConfigDto,
  ContextTxtpConfigResponseDto,
  UpsertFieldStrategiesDto,
  FieldStrategyResponseDto,
  FieldStrategiesListDto,
} from './dto/context-txtp-config.dto';

@Injectable()
export class ContextTxtpConfigService {
  private readonly logger = new Logger(ContextTxtpConfigService.name);

  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async updateContextConfig(
    token: string,
    suiteId: number,
    configId: number,
    dto: UpdateContextTxtpConfigDto,
  ): Promise<ContextTxtpConfigResponseDto> {
    try {
      return await this.adminServiceClient.updateContextTxtpConfig(token, suiteId, configId, dto);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error updating context config ${configId} for suite ${suiteId}`, error.stack);
      throw err;
    }
  }

  async upsertFieldStrategies(
    token: string,
    suiteId: number,
    configId: number,
    dto: UpsertFieldStrategiesDto,
  ): Promise<FieldStrategyResponseDto> {
    try {
      return await this.adminServiceClient.upsertFieldStrategies(token, suiteId, configId, dto);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error upserting field strategies for config ${configId}`, error.stack);
      throw err;
    }
  }

  async getFieldStrategies(token: string, suiteId: number, configId: number): Promise<FieldStrategiesListDto> {
    try {
      return await this.adminServiceClient.getFieldStrategies(token, suiteId, configId);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error fetching field strategies for config ${configId}`, error.stack);
      throw err;
    }
  }
}

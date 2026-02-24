import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../admin-service-client';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async getTransactionTypes(token: string): Promise<string[]> {
    try {
      return await this.adminServiceClient.getTransactionTypes(token);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching transaction types: ${err.message}`);
      throw error;
    }
  }

  async getPayloadByTransactionType(transactionType: string, token: string): Promise<any> {
    try {
      return await this.adminServiceClient.getPayloadByTransactionType(transactionType, token);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching payload for transaction type ${transactionType}: ${err.message}`);
      throw error;
    }
  }

  async getVersionsOfTransactionType(transactionType: string, token: string): Promise<string[]> {
    try {
      return await this.adminServiceClient.getVersionsOfTransactionType(transactionType, token);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching versions for transaction type ${transactionType}: ${err.message}`);
      throw error;
    }
  }
}

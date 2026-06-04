import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from 'src/services/admin-service-client';
import { FakerSemanticDataListDto } from './dto/faker_semantic_data.dto';

@Injectable()
export class FakerSemanticDataService {
  private readonly logger = new Logger(FakerSemanticDataService.name);
  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async generateFakerSymmetricData(token: string): Promise<FakerSemanticDataListDto> {
    try {
      return await this.adminServiceClient.generateFakerSymmetricData(token);
    } catch (err) {
      const error = err as Error;
      this.logger.error('Error getting faker symmetric data', error.stack);
      throw err;
    }
  }
}

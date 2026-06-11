import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from 'src/services/admin-service-client';
import type { SuiteResultResponseDto } from './dto/suite-result.dto';

@Injectable()
export class SuiteResultService {
  private readonly logger = new Logger(SuiteResultService.name);

  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async getSuiteResult(token: string, suiteId: number): Promise<SuiteResultResponseDto> {
    try {
      const response = await this.adminServiceClient.getSuiteResult<SuiteResultResponseDto>(token, suiteId);
      this.logger.log(`Successfully fetched suite result for suiteId: ${suiteId}`);
      return response;
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error fetching suite result for suiteId: ${suiteId}`, error.stack);
      throw err;
    }
  }
}

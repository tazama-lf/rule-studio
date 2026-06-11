import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from 'src/services/admin-service-client';
import type { SaveRunResultBodyDto, SaveRunResultResponseDto, SuiteResultResponseDto } from './dto/suite-result.dto';

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

  async saveRunResult(token: string, body: SaveRunResultBodyDto): Promise<SaveRunResultResponseDto> {
    try {
      const response = await this.adminServiceClient.saveRunResult<SaveRunResultResponseDto>(token, body);
      this.logger.log(`Successfully saved run result for gen_id: ${body.gen_id}`);
      return response;
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error saving run result for gen_id: ${body.gen_id}`, error.stack);
      throw err;
    }
  }
}

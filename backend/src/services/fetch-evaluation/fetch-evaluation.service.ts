import { Injectable, Logger } from '@nestjs/common';
import type { FetchEvaluationResponseDto } from './dto/fetch-evaluation.dto';

@Injectable()
export class FetchEvaluationService {
  private readonly logger = new Logger(FetchEvaluationService.name);

  async fetchEvaluation(startDtTm: string, endDtTm: string, token: string): Promise<FetchEvaluationResponseDto> {
    this.logger.log(`fetchEvaluation called with startDtTm=${startDtTm}, endDtTm=${endDtTm}`);
    return { success: true };
  }
}

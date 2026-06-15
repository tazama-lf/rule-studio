import { Injectable } from '@nestjs/common';
import { GenerateSampleMessagesResponseDto } from './dto/msg-sample-generation.dto';
import { AdminServiceClient } from '../admin-service-client';

@Injectable()
export class MsgSampleGenerationService {
  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async getSampleMessages(generationId: number, token: string): Promise<GenerateSampleMessagesResponseDto> {
    return await this.adminServiceClient.getSampleMessages(token, generationId);
  }
}

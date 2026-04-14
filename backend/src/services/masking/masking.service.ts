import { Injectable } from '@nestjs/common';
import { AdminServiceClient } from '../admin-service-client';
import type { AuthenticatedUser } from '../auth/auth.types';
import type { MaskingFiltersDto, MaskingListResponseDto } from './dto/masking.dto';

@Injectable()
export class MaskingService {
  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async getAllMask(offset: number, limit: number, filters: MaskingFiltersDto, user: AuthenticatedUser): Promise<MaskingListResponseDto> {
    return await this.adminServiceClient.getAllMaskWithFilters(offset, limit, filters, user.token.tokenString);
  }
}

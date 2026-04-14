import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ISuccess } from '@tazama-lf/tcs-lib';
import { AdminServiceClient } from '../admin-service-client';
import type { AuthenticatedUser } from '../auth/auth.types';
import type { MaskingFiltersDto, MaskingListResponseDto } from './dto/masking.dto';
import { CreateMaskDto } from './dto/mask.dto';

@Injectable()
export class MaskingService {
  private readonly logger = new Logger(MaskingService.name);

  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async getAllMask(offset: number, limit: number, filters: MaskingFiltersDto, user: AuthenticatedUser): Promise<MaskingListResponseDto> {
    return await this.adminServiceClient.getAllMaskWithFilters(offset, limit, filters, user.token.tokenString);
  }

  async create(masking: CreateMaskDto, user: AuthenticatedUser): Promise<ISuccess> {
    try {
      return await this.adminServiceClient.createMask(masking, user.token.tokenString);
    } catch (error) {
      this.logger.error(
        `Error While Creating Masking : ${error instanceof Error ? error.message : String(error)}`,
      );
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('duplicate key value violates unique constraint')) {
        throw new BadRequestException(
          'A masking configuration with this type and version already exists. Please use a different type or version combination.'
        );
      } else {
        throw new BadRequestException(errorMessage);
      }
    }
  }
}

import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ISuccess } from '@tazama-lf/tcs-lib';
import { AdminServiceClient } from '../admin-service-client';
import type { AuthenticatedUser } from '../auth/auth.types';
import type { MaskingFiltersDto, MaskingListResponseDto, UpdateMaskDto, ReviewMaskDto } from './dto/masking.dto';
import type { CreateMaskDto } from './dto/mask.dto';
import { EndpointKey, RbacService } from '../../utils/rbac/rbacHelper';

@Injectable()
export class MaskingService {
  private readonly logger = new Logger(MaskingService.name);
  private readonly rbacService = new RbacService();

  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async getAllMask(offset: number, limit: number, filters: MaskingFiltersDto, user: AuthenticatedUser): Promise<MaskingListResponseDto> {
    const updatedFilters = Object.assign({}, filters);
    const normalizedRole = this.rbacService.getNormalizedRole(user);
    const endpointKey: EndpointKey = 'POST /masking/api/all';
    const tier2 = this.rbacService.getTier2({ role: normalizedRole, endpointKey });
    if (!tier2.allowed) {
      throw new ForbiddenException(tier2.reason ?? 'Not authorized to access masking configurations');
    }
    if (tier2.allowedStatuses && tier2.allowedStatuses.length > 0) {
      if (filters.status && tier2.allowedStatuses.includes(filters.status)) {
        updatedFilters.status = filters.status;
      } else {
        updatedFilters.status = tier2.allowedStatuses.join(',');
      }
    } else {
      delete updatedFilters.status;
    }
    return await this.adminServiceClient.getAllMaskWithFilters(offset, limit, updatedFilters, user.token.tokenString);
  }

  async create(masking: CreateMaskDto, user: AuthenticatedUser): Promise<Partial<ISuccess>> {
    try {
      const payload = {
        txtp: masking.txtp,
        txtp_version: masking.txtpVersion,
      };
      return await this.adminServiceClient.createMask(payload, user.token.tokenString);
    } catch (error) {
      this.logger.error(`Error While Creating Masking : ${error instanceof Error ? error.message : String(error)}`);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('duplicate key value violates unique constraint')) {
        throw new BadRequestException(
          'A masking configuration with this type and version already exists. Please use a different type or version combination.',
        );
      } else {
        throw new BadRequestException(errorMessage);
      }
    }
  }

  async updateMask(id: number, updateData: UpdateMaskDto, user: AuthenticatedUser): Promise<Record<string, unknown>> {
    try {
      const normalizedRole = this.rbacService.getNormalizedRole(user);
      const mask = await this.adminServiceClient.getMaskById(id, user.token.tokenString);
      const currentStatus = mask.status as string;
      const endpointKey: EndpointKey = 'PUT /masking/api/:id';

      const tier2 = this.rbacService.checkTier2({
        role: normalizedRole,
        endpointKey,
        currentStatus,
      });
      if (!tier2.allowed) throw new ForbiddenException(tier2.reason ?? 'Not authorized to update this masking configuration');

      if (updateData.status && updateData.status !== currentStatus) {
        const tier3 = this.rbacService.checkTier3({
          role: normalizedRole,
          endpointKey,
          currentStatus,
          targetStatus: updateData.status,
        });
        if (!tier3.allowed) throw new ForbiddenException(tier3.reason ?? 'Status transition not permitted');
      }

      return await this.adminServiceClient.updateMask(id, updateData as Record<string, unknown>, user.token.tokenString);
    } catch (error) {
      this.logger.error(`Error While Updating Masking : ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getMaskById(id: number, user: AuthenticatedUser): Promise<Record<string, unknown>> {
    try {
      const normalizedRole = this.rbacService.getNormalizedRole(user);
      const mask = await this.adminServiceClient.getMaskById(id, user.token.tokenString);
      const currentStatus = mask.status as string;
      const endpointKey: EndpointKey = 'GET /masking/api/:id';

      const tier2 = this.rbacService.checkTier2({
        role: normalizedRole,
        endpointKey,
        currentStatus,
      });
      if (!tier2.allowed) throw new ForbiddenException(tier2.reason ?? 'Not authorized to access this masking configuration');

      return mask;
    } catch (error) {
      this.logger.error(`Error While Getting Masking By Id : ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async reviewMask(id: number, reviewData: ReviewMaskDto, user: AuthenticatedUser): Promise<Record<string, unknown>> {
    try {
      const normalizedRole = this.rbacService.getNormalizedRole(user);
      const mask = await this.adminServiceClient.getMaskById(id, user.token.tokenString);
      const currentStatus = mask.status as string;
      const endpointKey: EndpointKey = 'PATCH /masking/api/:id/review';

      const tier2 = this.rbacService.checkTier2({
        role: normalizedRole,
        endpointKey,
        currentStatus,
      });
      if (!tier2.allowed) throw new ForbiddenException(tier2.reason ?? 'Not authorized to review this masking configuration');

      if (reviewData.action === 'reject' && !reviewData.comments?.trim()) {
        throw new BadRequestException('A comment is required when rejecting a masking configuration');
      }

      return await this.adminServiceClient.reviewMask(id, reviewData.action, reviewData.comments, user.token.tokenString);
    } catch (error) {
      this.logger.error(`Error While Reviewing Masking : ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { EndpointKey, RbacService } from '../../utils/rbac/rbacHelper';
import { AdminServiceClient } from '../admin-service-client';
import { AuthenticatedUser } from '../auth/auth.types';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private readonly rbacService = new RbacService();

  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async getTransactionTypes(user: AuthenticatedUser, endpointKey: EndpointKey): Promise<string[]> {
    try {
      const normalizedRole = this.rbacService.getNormalizedRole(user);

      if (!this.rbacService.isRole(normalizedRole)) {
        throw new ForbiddenException('Role is not authorized to access transaction types');
      }

      const tier2 = this.rbacService.getTier2({
        role: normalizedRole,
        endpointKey,
      });

      if (!tier2.allowed) {
        throw new ForbiddenException(tier2.reason ?? `Role ${normalizedRole} is not authorized to access transaction types`);
      }

      return await this.adminServiceClient.getTransactionTypes(user.token.tokenString);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching transaction types: ${err.message}`);
      throw error;
    }
  }

  async getPayloadByTransactionType(transactionType: string, transactionVersion: string, user: AuthenticatedUser, endpointKey: EndpointKey): Promise<any> {
    try {
      const normalizedRole = this.rbacService.getNormalizedRole(user);

      if (!this.rbacService.isRole(normalizedRole)) {
        throw new ForbiddenException(`Role is not authorized to access payload information for transaction type ${transactionType}`);
      }

      const tier2 = this.rbacService.getTier2({
        role: normalizedRole,
        endpointKey,
      });

      if (!tier2.allowed) {
        throw new ForbiddenException(
          tier2.reason ?? `Role ${normalizedRole} is not authorized to access payload information for transaction type ${transactionType}`,
        );
      }

      return await this.adminServiceClient.getPayloadByTransactionType(transactionType, transactionVersion, user.token.tokenString);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching payload for transaction type ${transactionType}: ${err.message}`);
      throw error;
    }
  }

  async getVersionsOfTransactionType(transactionType: string, user: AuthenticatedUser, endpointKey: EndpointKey): Promise<string[]> {
    try {
      const normalizedRole = this.rbacService.getNormalizedRole(user);

      if (!this.rbacService.isRole(normalizedRole)) {
        throw new ForbiddenException(`Role is not authorized to access version information for transaction type ${transactionType}`);
      }

      const tier2 = this.rbacService.getTier2({
        role: normalizedRole,
        endpointKey,
      });

      if (!tier2.allowed) {
        throw new ForbiddenException(
          tier2.reason ?? `Role ${normalizedRole} is not authorized to access version information for transaction type ${transactionType}`,
        );
      }

      return await this.adminServiceClient.getVersionsOfTransactionType(transactionType, user.token.tokenString);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching versions for transaction type ${transactionType}: ${err.message}`);
      throw error;
    }
  }
}

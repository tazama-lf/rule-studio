import { SetMetadata } from '@nestjs/common';

export const CLAIMS_KEY = 'claims';
export const IS_PUBLIC_KEY = 'isPublic';
export const ANY_CLAIMS_KEY = 'anyClaims';
/**
 * Decorator to specify required claims for a route
 * @param claims - Array of required claims (all must be present)
 */
export const RequireClaims = (...claims: string[]): MethodDecorator => SetMetadata(CLAIMS_KEY, claims);

/**
 * Decorator to specify claims where ANY of them can satisfy the requirement
 * @param claims - Array of claims (user needs at least one)
 */
export const RequireAnyClaims = (...claims: string[]): MethodDecorator => SetMetadata(ANY_CLAIMS_KEY, claims);

export const Public = (): MethodDecorator => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Decorator to specify a single claim requirement
 * @param claim - Single required claim
 */
export const RequireClaim = (claim: string): MethodDecorator => SetMetadata(CLAIMS_KEY, [claim]);

export const TazamaClaims = {
  EDITOR: 'trs_editor',
  APPROVER: 'trs_approver',
  PUBLISHER: 'trs_publisher',
  MANAGE_ACCOUNT: 'manage-account',
  MANAGE_ACCOUNT_LINKS: 'manage-account-links',
  VIEW_PROFILE: 'view-profile',
  DEFAULT_ROLES_TAZAMA_CMS: 'default-roles-tazama-cms',
  OFFLINE_ACCESS: 'offline_access',
  UMA_AUTHORIZATION: 'uma_authorization',
} as const;

export const RequireEditorRole = (): MethodDecorator => RequireClaim(TazamaClaims.EDITOR);
export const RequireApproverRole = (): MethodDecorator => RequireClaim(TazamaClaims.APPROVER);
export const RequirePublisherRole = (): MethodDecorator => RequireClaim(TazamaClaims.PUBLISHER);
export const RequireAccountManagement = (): MethodDecorator =>
  RequireClaims(TazamaClaims.MANAGE_ACCOUNT, TazamaClaims.MANAGE_ACCOUNT_LINKS);

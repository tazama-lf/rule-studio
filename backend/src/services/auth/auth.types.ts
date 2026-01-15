import type { TazamaToken, ClaimValidationResult } from '@tazama-lf/auth-lib';
import type { Request } from 'express';

export interface AuthenticatedUser {
  token: TazamaToken;
  validated: ClaimValidationResult;
  validClaims: string[];
  tenantId: string;
  userId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export type { ClaimValidationResult, TazamaToken };

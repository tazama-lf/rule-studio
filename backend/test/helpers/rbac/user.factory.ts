import type { AuthenticatedUser } from '../../../src/services/auth/auth.types';

export const makeAuthenticatedUser = (role = 'editor'): AuthenticatedUser =>
  ({
    actorRole: role,
    token: { tokenString: 'test-token', tenantId: 'tenant-1' } as any,
    tenantId: 'tenant-1',
    userId: 'user-1',
    validated: {} as any,
    validClaims: [],
  }) as AuthenticatedUser;

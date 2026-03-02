import { Test, TestingModule } from '@nestjs/testing';
import { ParseExtractService } from '../../src/services/parse-extract/parse-extract.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import type { AuthenticatedUser } from '../../src/services/auth/auth.types';

describe('ParseExtractService RBAC', () => {
  let service: ParseExtractService;

  const makeUser = (role = 'editor'): AuthenticatedUser =>
    ({
      actorRole: role,
      token: { tokenString: 'test-token', tenantId: 'tenant-1' } as any,
      tenantId: 'tenant-1',
      userId: 'user-1',
      validated: {} as any,
      validClaims: [],
    }) as AuthenticatedUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParseExtractService,
        {
          provide: AdminServiceClient,
          useValue: {
            getConfigRowByTxTp: jest.fn(),
            getActiveNetworkMap: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ParseExtractService>(ParseExtractService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('covers POST /parse/api/validatePayload endpoint key and proceeds when allowed', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const tier2Spy = jest
      .spyOn(rbacService, 'getTier2')
      .mockReturnValue({ allowed: true, allowedStatuses: [] });

    const processPayloadSpy = jest
      .spyOn(service, 'processTransactionPayload')
      .mockResolvedValue({ success: true, message: 'ok' } as any);

    await service.processTransactionalMessage(
      { TxTp: 'pacs.008.001.10', TenantId: 'tenant-1' } as any,
      user,
      'POST /parse/api/validatePayload',
    );

    expect(tier2Spy).toHaveBeenCalledWith({
      role: 'editor',
      endpointKey: 'POST /parse/api/validatePayload',
    });
    expect(processPayloadSpy).toHaveBeenCalledWith(
      expect.any(Object),
      'test-token',
      expect.any(String),
    );
  });

  it('returns failure when role is invalid', async () => {
    const user = makeUser('guest');

    const result = await service.processTransactionalMessage(
      { TxTp: 'pacs.008.001.10', TenantId: 'tenant-1' } as any,
      user,
      'POST /parse/api/validatePayload',
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('not authorized');
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ParseExtractService } from '../../src/services/parse-extract/parse-extract.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import { AuthenticatedUser } from '../../src/services/auth/auth.types';

describe('ParseExtractService - extractPayloadFromRequest (lines 139-149)', () => {
  let service: ParseExtractService;

  const mockUser: AuthenticatedUser = {
    token: { tokenString: 'tok', tenantId: 'tenant-1' } as AuthenticatedUser['token'],
    validated: {} as AuthenticatedUser['validated'],
    validClaims: [],
    tenantId: 'tenant-1',
    userId: 'user-1',
    actorRole: 'editor',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParseExtractService,
        {
          provide: AdminServiceClient,
          useValue: { getActiveNetworkMap: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();

    service = module.get<ParseExtractService>(ParseExtractService);
  });

  afterEach(() => jest.clearAllMocks());

  // Call the private method directly to cover lines 139-149
  describe('extractPayloadFromRequest private method', () => {
    const extract = (svc: ParseExtractService, msg: Record<string, unknown>) =>
      (svc as any).extractPayloadFromRequest(msg);

    it('returns payload object when there is data beyond TxTp and TenantId', () => {
      const msg = {
        TxTp: 'pacs.002',
        TenantId: 'tenant-1',
        FIToFICstmrCdtTrf: { GrpHdr: { MsgId: 'M1' } },
      };
      const result = extract(service, msg);
      expect(result).not.toBeNull();
      expect(result.TxTp).toBe('pacs.002');
      expect(result.TenantId).toBe('tenant-1');
      expect(result.payloadToValidate).toEqual({ FIToFICstmrCdtTrf: { GrpHdr: { MsgId: 'M1' } } });
    });

    it('returns null when payload has only TxTp (no extra data)', () => {
      const msg = { TxTp: 'pacs.002' };
      const result = extract(service, msg);
      expect(result).toBeNull();
    });

    it('returns null when payload has only TxTp and TenantId (empty after exclusion)', () => {
      const msg = { TxTp: 'pacs.002', TenantId: 'tenant-1' };
      const result = extract(service, msg);
      expect(result).toBeNull();
    });

    it('returns null for empty object', () => {
      const msg = {};
      const result = extract(service, msg);
      expect(result).toBeNull();
    });

    it('includes TenantId as undefined when not present in message', () => {
      const msg = { TxTp: 'pacs.002', someField: 'value' };
      const result = extract(service, msg);
      expect(result).not.toBeNull();
      expect(result.TxTp).toBe('pacs.002');
      expect(result.TenantId).toBeUndefined();
    });
  });

  describe('auth header branch coverage', () => {
    it('processForRuleCreation succeeds with empty schema (covers getActiveNetworkMap)', async () => {
      const adminSvc = (service as any).adminServiceClient;
      adminSvc.getActiveNetworkMap.mockResolvedValue({ nodes: [] });

      const result = await service.processForRuleCreation(
        'pacs.002',
        '1',
        {},
        [],
        { field: 'value' },
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.ruleRequest).toBeDefined();
    });
  });
});

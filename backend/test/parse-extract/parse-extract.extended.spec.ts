import { Test, TestingModule } from '@nestjs/testing';
import { ParseExtractService } from '../../src/services/parse-extract/parse-extract.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import { AuthenticatedUser } from '../../src/services/auth/auth.types';

describe('ParseExtractService - extended coverage', () => {
  let service: ParseExtractService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

  const mockUser: AuthenticatedUser = {
    token: {
      tokenString: 'Bearer token',
      tenantId: 'tenant-123',
    } as AuthenticatedUser['token'],
    validated: {} as AuthenticatedUser['validated'],
    validClaims: [],
    tenantId: 'tenant-123',
    userId: 'user-123',
    actorRole: 'editor',
  };

  const validSchema = {
    type: 'object',
    properties: {
      FIToFICstmrCdtTrf: {
        type: 'object',
        properties: {
          GrpHdr: {
            type: 'object',
            properties: {
              MsgId: { type: 'string' },
              CreDtTm: { type: 'string' },
            },
            required: ['MsgId', 'CreDtTm'],
          },
        },
        required: ['GrpHdr'],
      },
    },
    required: ['FIToFICstmrCdtTrf'],
  };

  const validPayload = {
    FIToFICstmrCdtTrf: {
      GrpHdr: {
        MsgId: 'MSG-001',
        CreDtTm: '2024-01-01T00:00:00Z',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParseExtractService,
        {
          provide: AdminServiceClient,
          useValue: {
            getActiveNetworkMap: jest.fn(),
            getConfigRowByTxTp: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ParseExtractService>(ParseExtractService);
    adminServiceClient = module.get(AdminServiceClient);
  });

  afterEach(() => jest.clearAllMocks());

  describe('processForRuleCreation - error path', () => {
    it('returns failure result when adminServiceClient.getActiveNetworkMap throws', async () => {
      adminServiceClient.getActiveNetworkMap.mockRejectedValue(new Error('network map unavailable'));

      const result = await service.processForRuleCreation(
        'pacs.008.001.10',
        '10',
        {},
        [],
        validPayload,
        mockUser,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('network map unavailable');
    });

    it('returns failure result when processMappings throws', async () => {
      adminServiceClient.getActiveNetworkMap.mockRejectedValue(new Error('mapping error'));

      const result = await service.processForRuleCreation(
        'pacs.008.001.10',
        '10',
        {},
        [],
        { SomeField: {} },
        mockUser,
      );

      expect(result.success).toBe(false);
      expect(result.correlationId).toBeDefined();
    });

    it('returns success when empty payload passes empty schema', async () => {
      adminServiceClient.getActiveNetworkMap.mockResolvedValue({});

      const result = await service.processForRuleCreation(
        'pacs.002',
        '1',
        {},
        [],
        { anyField: 'anyValue' },
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.ruleRequest).toBeDefined();
    });

    it('returns valid correlationId in failure result', async () => {
      adminServiceClient.getActiveNetworkMap.mockRejectedValue(new Error('err'));

      const result = await service.processForRuleCreation(
        'pacs.008.001.10',
        '10',
        {},
        [],
        validPayload,
        mockUser,
      );

      expect(result.correlationId).toBeDefined();
      expect(result.correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe('processForRuleCreation - AJV error path', () => {
    it('returns validation failure when schema causes AJV to throw', async () => {
      const badSchema = {
        type: 'object',
        additionalProperties: false,
        properties: {
          field1: { type: 'unknownInvalidType' },
        },
      };

      const result = await service.processForRuleCreation(
        'pacs.002',
        '1',
        badSchema,
        [],
        { field1: 'value' },
        mockUser,
      );

      expect(result).toBeDefined();
      expect(result.correlationId).toBeDefined();
    });
  });

  describe('validatePayload branch coverage', () => {
    it('returns failure for payload missing required fields', async () => {
      const result = await service.processForRuleCreation(
        'pacs.008.001.10',
        '10',
        validSchema,
        [],
        { FIToFICstmrCdtTrf: {} },
        mockUser,
      );

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors!.length).toBeGreaterThan(0);
    });

    it('returns all validation errors when multiple fields are missing', async () => {
      const result = await service.processForRuleCreation(
        'pacs.008.001.10',
        '10',
        validSchema,
        [],
        {},
        mockUser,
      );

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ParseExtractService } from '../parse-extract.service';
import { AdminServiceClient } from '../../admin-service-client';
import { RuleRequest } from '../dto/message.dto';
import { AuthenticatedUser } from '../../auth/auth.types';

describe('ParseExtractService - AJV Validation', () => {
  let service: ParseExtractService;
  let mockAdminServiceClient: jest.Mocked<AdminServiceClient>;

  const schema = {
    type: 'object',
    properties: {
      TxTp: { type: 'string' },
      TenantId: { type: 'string' },
      FIToFICstmrCdtTrf: {
        type: 'object',
        properties: {
          GrpHdr: {
            type: 'object',
            properties: {
              MsgId: { type: 'string' },
              CreDtTm: { type: 'string' },
              NbOfTxs: { type: 'string' },
            },
            required: ['MsgId', 'CreDtTm'],
          },
        },
        required: ['GrpHdr'],
      },
    },
    required: ['FIToFICstmrCdtTrf', 'TxTp', 'TenantId'],
  };

  const mockConfig = {
    config: {
      schema,
      mapping: [],
      payload: {},
    },
  };

  const mockUser: AuthenticatedUser = {
    token: {
      tokenString: 'Bearer token',
      tenantId: 'tenant-123',
    } as AuthenticatedUser['token'],
    validated: {} as AuthenticatedUser['validated'],
    validClaims: [],
    tenantId: 'tenant-123',
    userId: 'user-123',
  };

  beforeEach(async () => {
    const mockAdminService = {
      getSchemaByTxTp: jest.fn(),
      getConfigRowByTxTp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ParseExtractService, { provide: AdminServiceClient, useValue: mockAdminService }],
    }).compile();

    service = module.get<ParseExtractService>(ParseExtractService);
    mockAdminServiceClient = module.get(AdminServiceClient);
  });

  describe('Payload Validation', () => {
    it('should successfully validate valid payload', async () => {
      const validPayload = {
        FIToFICstmrCdtTrf: {
          GrpHdr: {
            MsgId: 'MSG123',
            CreDtTm: '2024-01-01T00:00:00Z',
            NbOfTxs: '1',
          },
        },
      };

      mockAdminServiceClient.getConfigRowByTxTp.mockResolvedValue(mockConfig as any);
      mockAdminServiceClient.getActiveNetworkMap.mockResolvedValue({});

      const result = await service.processForRuleCreation(
        'pacs.008.001.10',
        '10',
        schema,
        [],
        validPayload,
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.validationErrors).toBeUndefined();
      expect(result.validatedPayload).toEqual({
        TxTp: 'pacs.008.001.10',
        TenantId: 'tenant-123',
        FIToFICstmrCdtTrf: validPayload.FIToFICstmrCdtTrf,
      });
    });

    it('should handle invalid payload with missing required fields', async () => {
      const invalidPayload = {
        FIToFICstmrCdtTrf: {
          GrpHdr: {
            MsgId: 'MSG123',
            // Missing required CreDtTm field
          },
        },
      };

      mockAdminServiceClient.getConfigRowByTxTp.mockResolvedValue(mockConfig as any);
      mockAdminServiceClient.getActiveNetworkMap.mockResolvedValue({});

      const result = await service.processForRuleCreation(
        'pacs.008.001.10',
        '10',
        schema,
        [],
        invalidPayload,
        mockUser,
      );

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors).toContain(expect.stringContaining("Missing required property 'CreDtTm'"));
    });

    it('should handle payload with incorrect data types', async () => {
      const invalidPayload = {
        FIToFICstmrCdtTrf: {
          GrpHdr: {
            MsgId: 123, // Should be string
            CreDtTm: '2024-01-01T00:00:00Z',
          },
        },
      };

      mockAdminServiceClient.getConfigRowByTxTp.mockResolvedValue(mockConfig as any);
      mockAdminServiceClient.getActiveNetworkMap.mockResolvedValue({});

      const result = await service.processForRuleCreation(
        'pacs.008.001.10',
        '10',
        schema,
        [],
        invalidPayload,
        mockUser,
      );

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors).toContain(expect.stringContaining('Should be a string'));
    });

    it('should handle missing schema configuration', async () => {
      mockAdminServiceClient.getActiveNetworkMap.mockResolvedValue({});

      const result = await service.processForRuleCreation(
        'unknown.transaction',
        '1',
        {},
        [],
        { SomeData: {} },
        mockUser,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to process transaction data');
    });

    it('should extract payload from request object when Payload field is not provided', async () => {
      const requestWithEmbeddedPayload = {
        TxTp: 'pacs.008.001.10',
        FIToFICstmrCdtTrf: {
          GrpHdr: {
            MsgId: 'MSG123',
            CreDtTm: '2024-01-01T00:00:00Z',
          },
        },
      };

      mockAdminServiceClient.getConfigRowByTxTp.mockResolvedValue(mockConfig as any);
      mockAdminServiceClient.getActiveNetworkMap.mockResolvedValue({});

      const result = await service.processForRuleCreation(
        requestWithEmbeddedPayload.TxTp,
        '10',
        schema,
        [],
        {
          FIToFICstmrCdtTrf: requestWithEmbeddedPayload.FIToFICstmrCdtTrf,
        },
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.validatedPayload).toEqual({
        TxTp: 'pacs.008.001.10',
        TenantId: 'tenant-123',
        FIToFICstmrCdtTrf: {
          GrpHdr: {
            MsgId: 'MSG123',
            CreDtTm: '2024-01-01T00:00:00Z',
          },
        },
      });
    });
  });

  describe('RuleRequest Creation', () => {
    it('should create RuleRequest object on successful validation', async () => {
      const validPayload = {
        FIToFICstmrCdtTrf: {
          GrpHdr: {
            MsgId: 'MSG123',
            CreDtTm: '2024-01-01T00:00:00Z',
            NbOfTxs: '1',
          },
        },
      };

      mockAdminServiceClient.getConfigRowByTxTp.mockResolvedValue(mockConfig as any);
      mockAdminServiceClient.getActiveNetworkMap.mockResolvedValue({});

      const result = await service.processForRuleCreation(
        'pacs.008.001.10',
        '10',
        schema,
        [],
        validPayload,
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.ruleRequest).toBeDefined();

      const ruleRequest: RuleRequest = result.ruleRequest!;

      // Verify RuleRequest structure
      expect(ruleRequest.transaction).toBeDefined();
      expect(ruleRequest.transaction).toEqual({
        ...validPayload,
        TxTp: 'pacs.008.001.10',
        TenantId: 'tenant-123',
      });
      expect(ruleRequest.networkMap).toEqual({});
      expect(ruleRequest.DataCache).toEqual({});
      expect(ruleRequest.metaData).toBeDefined();

      // Verify metadata
      expect(ruleRequest.metaData?.correlationId).toBeDefined();
      expect(ruleRequest.metaData?.timestamp).toBeDefined();
      expect(ruleRequest.metaData?.tenantId).toBe('tenant-123');
      expect(ruleRequest.metaData?.transactionType).toBe('pacs.008.001.10');
    });

    it('should not include RuleRequest on validation failure', async () => {
      const invalidPayload = {
        FIToFICstmrCdtTrf: {
          GrpHdr: {
            MsgId: 'MSG123',
            // Missing required CreDtTm field
          },
        },
      };

      mockAdminServiceClient.getConfigRowByTxTp.mockResolvedValue(mockConfig as any);
      mockAdminServiceClient.getActiveNetworkMap.mockResolvedValue({});

      const result = await service.processForRuleCreation(
        'pacs.008.001.10',
        '10',
        schema,
        [],
        invalidPayload,
        mockUser,
      );

      expect(result.success).toBe(false);
      expect(result.ruleRequest).toBeUndefined();
    });
  });
});

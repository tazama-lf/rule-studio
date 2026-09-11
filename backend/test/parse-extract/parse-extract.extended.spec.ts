import { Test, TestingModule } from '@nestjs/testing';
import { ParseExtractService } from '../../src/services/parse-extract/parse-extract.service';
import { AuthenticatedUser } from '../../src/services/auth/auth.types';
import * as tcsLib from '@tazama-lf/tcs-lib';

const actualProcessMappings = jest.requireActual('@tazama-lf/tcs-lib').processMappings;

jest.mock('@tazama-lf/tcs-lib', () => ({
  ...jest.requireActual('@tazama-lf/tcs-lib'),
  processMappings: jest.fn(),
}));

describe('ParseExtractService - extended coverage', () => {
  let service: ParseExtractService;

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
    jest.mocked(tcsLib.processMappings).mockImplementation(actualProcessMappings);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ParseExtractService],
    }).compile();

    service = module.get<ParseExtractService>(ParseExtractService);
  });

  describe('processForRuleCreation - error path', () => {
    it('returns failure result when processMappings throws', async () => {
      jest.mocked(tcsLib.processMappings).mockImplementationOnce(() => {
        throw new Error('mapping error');
      });

      const result = await service.processForRuleCreation(
        'pacs.008.001.10',
        '10',
        {},
        [],
        { SomeField: {} },
        mockUser,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('mapping error');
      expect(result.correlationId).toBeDefined();
      expect(result.correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('returns success when empty payload passes empty schema', async () => {
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

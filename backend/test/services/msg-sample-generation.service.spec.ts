import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { MsgSampleGenerationService } from '../../src/services/msg-sample-generation/msg-sample-generation.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import type {
  GenerateSampleMessagesResponseDto,
  GenerateEnrichmentResponseDto,
} from '../../src/services/msg-sample-generation/dto/msg-sample-generation.dto';
import { processMappings } from '../../src/utils/process-mappings.util';
import { executeConfiguredFunctions } from '../../src/utils/execute-functions.util';

jest.mock('../../src/utils/process-mappings.util', () => ({
  processMappings: jest.fn(),
}));

jest.mock('../../src/utils/execute-functions.util', () => ({
  executeConfiguredFunctions: jest.fn(),
}));

const mockProcessMappings = processMappings as jest.MockedFunction<typeof processMappings>;
const mockExecuteConfiguredFunctions = executeConfiguredFunctions as jest.MockedFunction<typeof executeConfiguredFunctions>;

const mockMappingResult = {
  dataCache: {},
  transactionRelationship: { source: 'src', destination: 'dst', TxTp: 'pacs.008', TenantId: 'cbe', MsgId: 'msg-001', CreDtTm: '2026-01-01T00:00:00.000Z', Amt: 100, Ccy: 'USD', EndToEndId: 'e2e-001', lat: '', long: '', TxSts: '' },
  endToEndId: 'e2e-001',
  trackedFields: {
    CreDtTm: '2026-01-01T00:00:00.000Z',
    MsgId: 'msg-001',
    EndToEndId: 'e2e-001',
    dbtrAcctId: 'debtor-001',
    cdtrAcctId: 'creditor-001',
    TenantId: 'cbe',
  },
};

const mockConfigRow = {
  config: {
    schema: {},
    mapping: [{ source: 'CdtTrfTxInf.Amt.InstdAmt', destination: 'transactionDetails.Amt' }],
    functions: [],
  },
};

const singlePayload = { MsgId: 'msg-001', TenantId: 'cbe', amount: 100 };

const mockSampleResponse: GenerateSampleMessagesResponseDto = {
  success: true,
  data: [
    {
      context_txtp_config_id: 1,
      txtp: 'pacs.008',
      txtp_version: '001.08',
      display_order: 1,
      message_count: 1,
      payloads: [singlePayload],
    },
  ],
};

const mockEnrichmentResponse: GenerateEnrichmentResponseDto = {
  success: true,
  data: [
    {
      enrichment_table_id: 'table-28',
      table_name: 'account_enrichment',
      table_order: 1,
      row_count: 2,
      rows: [
        { id: 'acc-001', name: 'Alice' },
        { id: 'acc-002', name: "Bob's account" },
      ],
    },
  ],
};

describe('MsgSampleGenerationService', () => {
  let service: MsgSampleGenerationService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MsgSampleGenerationService,
        {
          provide: AdminServiceClient,
          useValue: {
            getSampleMessages: jest.fn(),
            getConfigRowByTxTpw3: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MsgSampleGenerationService>(MsgSampleGenerationService);
    adminServiceClient = module.get(AdminServiceClient);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── getSampleMessages ──────────────────────────────────────────────────────

  describe('getSampleMessages', () => {
    it('forwards generationId and token to adminServiceClient, returns response', async () => {
      adminServiceClient.getSampleMessages.mockResolvedValue(mockSampleResponse);

      const result = await service.getSampleMessages(1, 'test-token');

      expect(result).toEqual(mockSampleResponse);
      expect(adminServiceClient.getSampleMessages).toHaveBeenCalledWith('test-token', 1);
    });

    it('propagates error from adminServiceClient', async () => {
      adminServiceClient.getSampleMessages.mockRejectedValue(new Error('Network error'));

      await expect(service.getSampleMessages(1, 'test-token')).rejects.toThrow('Network error');
    });
  });

  // ── generateDbScript ───────────────────────────────────────────────────────

  describe('generateDbScript', () => {
    beforeEach(() => {
      adminServiceClient.getConfigRowByTxTpw3.mockResolvedValue(mockConfigRow as any);
      mockProcessMappings.mockReturnValue(mockMappingResult as any);
      mockExecuteConfiguredFunctions.mockReturnValue('INSERT INTO account ...\n');
    });

    it('returns dbScript and functionResultScript', async () => {
      const result = await service.generateDbScript(mockSampleResponse, 'test-token');

      expect(result).toHaveProperty('dbScript');
      expect(result).toHaveProperty('functionResultScript');
    });

    it('dbScript contains CREATE TABLE for each txtp', async () => {
      const { dbScript } = await service.generateDbScript(mockSampleResponse, 'test-token');

      expect(dbScript).toContain('CREATE TABLE IF NOT EXISTS public."pacs.008"');
    });

    it('dbScript contains INSERT INTO for each txtp', async () => {
      const { dbScript } = await service.generateDbScript(mockSampleResponse, 'test-token');

      expect(dbScript).toContain('INSERT INTO public."pacs.008"');
    });

    it('dbScript includes tracked field values in INSERT', async () => {
      const { dbScript } = await service.generateDbScript(mockSampleResponse, 'test-token');

      expect(dbScript).toContain('msg-001');
      expect(dbScript).toContain('2026-01-01T00:00:00.000Z');
      expect(dbScript).toContain('debtor-001');
      expect(dbScript).toContain('creditor-001');
    });

    it('calls getConfigRowByTxTpw3 with txtp, version and token for each item', async () => {
      await service.generateDbScript(mockSampleResponse, 'test-token');

      expect(adminServiceClient.getConfigRowByTxTpw3).toHaveBeenCalledWith('pacs.008', '001.08', 'test-token');
    });

    it('calls processMappings once per payload', async () => {
      await service.generateDbScript(mockSampleResponse, 'test-token');

      expect(mockProcessMappings).toHaveBeenCalledTimes(1);
      expect(mockProcessMappings).toHaveBeenCalledWith(singlePayload, mockConfigRow.config.mapping, false);
    });

    it('calls executeConfiguredFunctions once per payload', async () => {
      await service.generateDbScript(mockSampleResponse, 'test-token');

      expect(mockExecuteConfiguredFunctions).toHaveBeenCalledTimes(1);
      expect(mockExecuteConfiguredFunctions).toHaveBeenCalledWith(
        singlePayload,
        mockConfigRow.config.mapping,
        mockConfigRow.config.functions,
        mockMappingResult.transactionRelationship,
      );
    });

    it('functionResultScript accumulates output from executeConfiguredFunctions', async () => {
      mockExecuteConfiguredFunctions.mockReturnValue('INSERT INTO account (id) VALUES (1);\n');

      const { functionResultScript } = await service.generateDbScript(mockSampleResponse, 'test-token');

      expect(functionResultScript).toContain('INSERT INTO account (id) VALUES (1);');
    });

    it('handles multiple payloads per item', async () => {
      const multiPayloadResponse: GenerateSampleMessagesResponseDto = {
        success: true,
        data: [
          {
            context_txtp_config_id: 1,
            txtp: 'pacs.008',
            txtp_version: '001.08',
            display_order: 1,
            message_count: 3,
            payloads: [
              { MsgId: 'msg-001' },
              { MsgId: 'msg-002' },
              { MsgId: 'msg-003' },
            ],
          },
        ],
      };
      mockProcessMappings.mockReturnValue({
        ...mockMappingResult,
        trackedFields: { ...mockMappingResult.trackedFields },
      } as any);

      await service.generateDbScript(multiPayloadResponse, 'test-token');

      expect(mockProcessMappings).toHaveBeenCalledTimes(3);
      expect(mockExecuteConfiguredFunctions).toHaveBeenCalledTimes(3);
    });

    it('handles multiple txtp items by fetching config for each', async () => {
      const multiItemResponse: GenerateSampleMessagesResponseDto = {
        success: true,
        data: [
          { context_txtp_config_id: 1, txtp: 'pacs.008', txtp_version: '001.08', display_order: 1, message_count: 1, payloads: [singlePayload] },
          { context_txtp_config_id: 2, txtp: 'pain.001', txtp_version: '001.09', display_order: 2, message_count: 1, payloads: [singlePayload] },
        ],
      };

      await service.generateDbScript(multiItemResponse, 'test-token');

      expect(adminServiceClient.getConfigRowByTxTpw3).toHaveBeenCalledTimes(2);
      expect(adminServiceClient.getConfigRowByTxTpw3).toHaveBeenCalledWith('pacs.008', '001.08', 'test-token');
      expect(adminServiceClient.getConfigRowByTxTpw3).toHaveBeenCalledWith('pain.001', '001.09', 'test-token');
    });

    it('strips apostrophes from payload values to prevent SQL injection', async () => {
      const payloadWithApostrophe = { MsgId: "it's-msg", TenantId: "customer's" };
      const responseWithApostrophe: GenerateSampleMessagesResponseDto = {
        success: true,
        data: [{ context_txtp_config_id: 1, txtp: 'pacs.008', txtp_version: '001.08', display_order: 1, message_count: 1, payloads: [payloadWithApostrophe] }],
      };
      mockProcessMappings.mockReturnValue({
        ...mockMappingResult,
        trackedFields: { CreDtTm: "it's time", MsgId: '', EndToEndId: '', dbtrAcctId: '', cdtrAcctId: '', TenantId: '' },
      } as any);

      const { dbScript } = await service.generateDbScript(responseWithApostrophe, 'test-token');

      expect(dbScript).not.toContain("it's time");
      expect(dbScript).toContain('its time');
    });

    it('uses NULL for missing tracked fields', async () => {
      mockProcessMappings.mockReturnValue({
        ...mockMappingResult,
        trackedFields: { CreDtTm: '', MsgId: '', EndToEndId: '', dbtrAcctId: '', cdtrAcctId: '', TenantId: '' },
      } as any);

      const { dbScript } = await service.generateDbScript(mockSampleResponse, 'test-token');

      expect(dbScript).toContain('NULL');
    });

    it('returns empty scripts for response with no items', async () => {
      const emptyResponse: GenerateSampleMessagesResponseDto = { success: true, data: [] };

      const result = await service.generateDbScript(emptyResponse, 'test-token');

      expect(result.dbScript).toBe('');
      expect(result.functionResultScript).toBe('');
    });

    it('propagates error from getConfigRowByTxTpw3', async () => {
      adminServiceClient.getConfigRowByTxTpw3.mockRejectedValue(new Error('Config not found'));

      await expect(service.generateDbScript(mockSampleResponse, 'test-token')).rejects.toThrow('Config not found');
    });
  });

  // ── generateEnrichmentDbScript ─────────────────────────────────────────────

  describe('generateEnrichmentDbScript', () => {
    it('returns a string containing CREATE TABLE for each enrichment table', () => {
      const result = service.generateEnrichmentDbScript(mockEnrichmentResponse, 'test-token');

      expect(typeof result).toBe('string');
      expect(result).toContain('CREATE TABLE IF NOT EXISTS public."account_enrichment"');
    });

    it('returns INSERT INTO with correct table name', () => {
      const result = service.generateEnrichmentDbScript(mockEnrichmentResponse, 'test-token');

      expect(result).toContain('INSERT INTO public."account_enrichment"');
    });

    it('inserts all rows from the enrichment table', () => {
      const result = service.generateEnrichmentDbScript(mockEnrichmentResponse, 'test-token');

      expect(result).toContain('acc-001');
      expect(result).toContain('acc-002');
    });

    it('uses enrichment_table_id as job_id in INSERT', () => {
      const result = service.generateEnrichmentDbScript(mockEnrichmentResponse, 'test-token');

      expect(result).toContain('table-28');
    });

    it('includes a checksum column in INSERT', () => {
      const result = service.generateEnrichmentDbScript(mockEnrichmentResponse, 'test-token');

      expect(result).toContain('checksum');
    });

    it('strips apostrophes from row data', () => {
      const result = service.generateEnrichmentDbScript(mockEnrichmentResponse, 'test-token');

      expect(result).not.toContain("Bob's account");
      expect(result).toContain('Bobs account');
    });

    it('generates separate DDL and DML blocks for multiple enrichment tables', () => {
      const multiTableResponse: GenerateEnrichmentResponseDto = {
        success: true,
        data: [
          { enrichment_table_id: 'job-1', table_name: 'accounts', table_order: 1, row_count: 1, rows: [{ id: '1' }] },
          { enrichment_table_id: 'job-2', table_name: 'entities', table_order: 2, row_count: 1, rows: [{ id: '2' }] },
        ],
      };

      const result = service.generateEnrichmentDbScript(multiTableResponse, 'test-token');

      expect(result).toContain('"accounts"');
      expect(result).toContain('"entities"');
    });

    it('returns empty string for response with no data', () => {
      const emptyResponse: GenerateEnrichmentResponseDto = { success: true, data: [] };

      const result = service.generateEnrichmentDbScript(emptyResponse, 'test-token');

      expect(result).toBe('');
    });

    it('generates same checksum for identical rows', () => {
      const row = { id: 'stable', value: 42 };
      const response: GenerateEnrichmentResponseDto = {
        success: true,
        data: [{ enrichment_table_id: 'job-1', table_name: 'stable_table', table_order: 1, row_count: 2, rows: [row, row] }],
      };

      const result = service.generateEnrichmentDbScript(response, 'test-token');

      const checksumMatches = result.match(/[0-9a-f]{64}/g) ?? [];
      expect(checksumMatches).toHaveLength(2);
      expect(checksumMatches[0]).toBe(checksumMatches[1]);
    });
  });
});

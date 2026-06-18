import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { of } from 'rxjs';
import { RunSimulationService } from '../../src/services/simulation-studio/generation-engine/run-simulation.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import { EphemeralEnvService } from '../../src/services/simulation-studio/ephemeral-env/ephemeral-env.service';
import { MsgSampleGenerationService } from '../../src/services/msg-sample-generation/msg-sample-generation.service';
import { SimulationStatus } from '../../src/services/simulation-studio/ephemeral-env/interfaces/ephemeral-env.interfaces';
import type {
  RunSimulationDto,
  SampleTriggerMessage,
  SampleTriggerMessagesResponse,
} from '../../src/services/simulation-studio/generation-engine/dto/run-simulation.dto';
import type { GenerateSampleMessagesResponseDto, GenerateEnrichmentResponseDto } from '../../src/services/msg-sample-generation/dto/msg-sample-generation.dto';
import { faker } from '@faker-js/faker';
import { Client as PgClient } from 'pg';

// ── faker mock — ts-jest does not support dynamic import() without
// --experimental-vm-modules; mock the whole module so getFaker() resolves
// synchronously to our stub. ──────────────────────────────────────────────

jest.mock('@faker-js/faker', () => ({
  faker: {
    string: { uuid: jest.fn() },
  },
}));

// ── pg mock ────────────────────────────────────────────────────────────────

const mockPgQuery = jest.fn<() => Promise<unknown>>();
const mockPgConnect = jest.fn<() => Promise<void>>();
const mockPgEnd = jest.fn<() => Promise<void>>();

jest.mock('pg', () => ({ Client: jest.fn() }));

// ── shared fixtures ────────────────────────────────────────────────────────

const mockSimInfo = {
  name: 'run-sim-10-gen-1-123',
  ruleName: 'rule-021',
  version: 'rc',
  functionName: 'rule-021-rel-rc',
  natsSubject: 'sub-rule-021@rc',
  natsConsumer: 'pub-rule-021@rc',
  ports: { pg: 54320, pgHost: 'localhost' },
  startedAt: new Date('2026-01-01T00:00:00.000Z'),
  status: SimulationStatus.POSTGRES_UP,
};

const mockRuntimeSimInfo = {
  ...mockSimInfo,
  ports: { ...mockSimInfo.ports, nats: 44220, natsHost: 'localhost', natsMonitor: 82220, valkey: 63790, natsUtils: 40000, natsUtilsHost: 'localhost' },
  status: SimulationStatus.UP,
};

const mockSuite = {
  id: 10,
  rule_name: 'rule-021',
  rule_version: 'rc',
  primary_txtp: 'pacs.008',
  rule_config: {
    id: '021@1.0.0',
    cfg: '1.0.0',
    tenantId: 'cbe',
    config: {
      bands: [
        { subRuleRef: '.01', upperLimit: 2 },
        { subRuleRef: '.02', lowerLimit: 2 },
      ],
    },
  },
};

const mockTriggerMessage: SampleTriggerMessage = {
  trigger_txtp_config_id: 101,
  txtp: 'pacs.008',
  txtp_version: '001.08',
  display_order: 1,
  related_transaction: null,
  related_txtp_config_id: null,
  payload: { MsgId: 'msg-001', amount: 500 },
};

const mockTriggerResp: SampleTriggerMessagesResponse = {
  success: true,
  data: [mockTriggerMessage],
};

const mockSampleResp: GenerateSampleMessagesResponseDto = {
  success: true,
  data: [
    { context_txtp_config_id: 1, txtp: 'pacs.008', txtp_version: '001.08', display_order: 1, message_count: 1, payloads: [{ MsgId: 'msg-001' }] },
  ],
};

const mockEnrichmentResp: GenerateEnrichmentResponseDto = {
  success: true,
  data: [],
};

const mockRunBody: RunSimulationDto = { suiteId: 10, generationId: 1 };

// ──────────────────────────────────────────────────────────────────────────

describe('RunSimulationService', () => {
  let service: RunSimulationService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;
  let ephemeralEnvService: jest.Mocked<EphemeralEnvService>;
  let msgSampleGenerationService: jest.Mocked<MsgSampleGenerationService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    // resetMocks clears implementations — re-apply each test
    (faker.string.uuid as jest.Mock).mockReturnValue('test-correlation-id-uuid');

    mockPgConnect.mockResolvedValue(undefined);
    mockPgEnd.mockResolvedValue(undefined);
    mockPgQuery.mockResolvedValue({
      rows: [
        { table: 'rule', n: '1' },
        { table: 'typology', n: '1' },
        { table: 'network_map', n: '1' },
      ],
    });
    (PgClient as jest.Mock).mockImplementation(() => ({
      connect: mockPgConnect,
      query: mockPgQuery,
      end: mockPgEnd,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RunSimulationService,
        {
          provide: AdminServiceClient,
          useValue: {
            updateGenerationStatus: jest.fn(),
            getSimulationSuiteById: jest.fn(),
            getSampleTriggerMessages: jest.fn(),
            getSampleMessages: jest.fn(),
            getEnrichmentMessages: jest.fn(),
            saveRunResult: jest.fn(),
          },
        },
        {
          provide: EphemeralEnvService,
          useValue: {
            spawnPostgres: jest.fn(),
            spawnRuntime: jest.fn(),
            getNatsUtilsUrl: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: MsgSampleGenerationService,
          useValue: {
            generateDbScript: jest.fn(),
            generateEnrichmentDbScript: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: { post: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<RunSimulationService>(RunSimulationService);
    adminServiceClient = module.get(AdminServiceClient);
    ephemeralEnvService = module.get(EphemeralEnvService);
    msgSampleGenerationService = module.get(MsgSampleGenerationService);
    httpService = module.get(HttpService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── helper: wire up a full happy-path run ──────────────────────────────

  function setupHappyPath(triggerResp: SampleTriggerMessagesResponse = mockTriggerResp) {
    adminServiceClient.updateGenerationStatus.mockResolvedValue(undefined as any);
    adminServiceClient.getSimulationSuiteById.mockResolvedValue({ suite: mockSuite } as any);
    adminServiceClient.getSampleTriggerMessages.mockResolvedValue(triggerResp as any);
    adminServiceClient.getSampleMessages.mockResolvedValue(mockSampleResp);
    adminServiceClient.getEnrichmentMessages.mockResolvedValue(mockEnrichmentResp as any);
    adminServiceClient.saveRunResult.mockResolvedValue(undefined as any);

    ephemeralEnvService.spawnPostgres.mockResolvedValue(mockSimInfo as any);
    ephemeralEnvService.spawnRuntime.mockResolvedValue(mockRuntimeSimInfo as any);
    ephemeralEnvService.getNatsUtilsUrl.mockReturnValue('http://localhost:40000');
    ephemeralEnvService.destroy.mockResolvedValue(undefined);

    msgSampleGenerationService.generateDbScript.mockResolvedValue({ dbScript: '-- raw', functionResultScript: '' });
    msgSampleGenerationService.generateEnrichmentDbScript.mockReturnValue('');

    httpService.post.mockReturnValue(
      of({ data: { data: { ruleResult: { subRuleRef: '.01', reason: 'ok' } } } }) as any,
    );
  }

  // ── runSimulation — status lifecycle ──────────────────────────────────────

  describe('runSimulation — status lifecycle', () => {
    it('marks generation RUNNING at the start', async () => {
      setupHappyPath();

      await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(adminServiceClient.updateGenerationStatus).toHaveBeenCalledWith(
        'test-token', 1, { status: 'RUNNING' },
      );
    });

    it('marks generation COMPLETED on success', async () => {
      setupHappyPath();

      await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(adminServiceClient.updateGenerationStatus).toHaveBeenCalledWith(
        'test-token', 1, { status: 'COMPLETED' },
      );
    });

    it('marks generation FAILED and rethrows when suite fetch throws', async () => {
      adminServiceClient.updateGenerationStatus.mockResolvedValue(undefined as any);
      adminServiceClient.getSimulationSuiteById.mockRejectedValue(new Error('Suite not found'));
      adminServiceClient.getSampleTriggerMessages.mockResolvedValue(mockTriggerResp as any);
      adminServiceClient.getSampleMessages.mockResolvedValue(mockSampleResp);
      adminServiceClient.getEnrichmentMessages.mockResolvedValue(mockEnrichmentResp as any);

      await expect(service.runSimulation('test-token', 'cbe', mockRunBody)).rejects.toThrow('Suite not found');

      expect(adminServiceClient.updateGenerationStatus).toHaveBeenCalledWith(
        'test-token', 1, { status: 'FAILED' },
      );
    });

    it('marks generation FAILED and rethrows when spawnPostgres throws', async () => {
      setupHappyPath();
      ephemeralEnvService.spawnPostgres.mockRejectedValue(new Error('Docker unavailable'));

      await expect(service.runSimulation('test-token', 'cbe', mockRunBody)).rejects.toThrow('Docker unavailable');

      expect(adminServiceClient.updateGenerationStatus).toHaveBeenCalledWith(
        'test-token', 1, { status: 'FAILED' },
      );
    });

    it('does not mark FAILED if updateGenerationStatus for RUNNING itself throws', async () => {
      adminServiceClient.updateGenerationStatus.mockRejectedValue(new Error('DB unavailable'));

      await expect(service.runSimulation('test-token', 'cbe', mockRunBody)).rejects.toThrow('DB unavailable');
    });
  });

  // ── runSimulation — vacuous completion ─────────────────────────────────────

  describe('runSimulation — vacuous completion', () => {
    it('returns { success: true, results: [] } when no trigger messages exist', async () => {
      setupHappyPath({ success: true, data: [] });

      const result = await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(result).toEqual({ success: true, results: [] });
    });

    it('does not spawn any containers when there are no trigger messages', async () => {
      setupHappyPath({ success: true, data: [] });

      await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(ephemeralEnvService.spawnPostgres).not.toHaveBeenCalled();
      expect(ephemeralEnvService.spawnRuntime).not.toHaveBeenCalled();
    });

    it('marks generation COMPLETED even when no trigger messages exist', async () => {
      setupHappyPath({ success: true, data: [] });

      await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(adminServiceClient.updateGenerationStatus).toHaveBeenCalledWith(
        'test-token', 1, { status: 'COMPLETED' },
      );
    });
  });

  // ── runSimulation — validation ─────────────────────────────────────────────

  describe('runSimulation — validation', () => {
    it('throws when suite has no rule_name', async () => {
      setupHappyPath();
      adminServiceClient.getSimulationSuiteById.mockResolvedValue({
        suite: { ...mockSuite, rule_name: undefined },
      } as any);

      await expect(service.runSimulation('test-token', 'cbe', mockRunBody)).rejects.toThrow(
        `Suite 10 has no rule_name set`,
      );
    });

    it('throws when suite has no primary_txtp', async () => {
      setupHappyPath();
      adminServiceClient.getSimulationSuiteById.mockResolvedValue({
        suite: { ...mockSuite, primary_txtp: undefined },
      } as any);

      await expect(service.runSimulation('test-token', 'cbe', mockRunBody)).rejects.toThrow(
        `Suite 10 has no primary_txtp set`,
      );
    });
  });

  // ── runSimulation — happy path ─────────────────────────────────────────────

  describe('runSimulation — happy path', () => {
    it('returns success with results array', async () => {
      setupHappyPath();

      const result = await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results).toHaveLength(1);
    });

    it('result entry contains trigger_txtp_config_id from the trigger message', async () => {
      setupHappyPath();

      const result = await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(result.results[0].trigger_txtp_config_id).toBe(101);
    });

    it('result entry contains the txtp from the trigger message', async () => {
      setupHappyPath();

      const result = await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(result.results[0].txtp).toBe('pacs.008');
    });

    it('calls spawnPostgres with ruleName and version from suite', async () => {
      setupHappyPath();

      await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(ephemeralEnvService.spawnPostgres).toHaveBeenCalledWith(
        expect.stringContaining('run-sim-10-gen-1'),
        { ruleName: 'rule-021', version: 'rc' },
      );
    });

    it('calls spawnRuntime after seeding the database', async () => {
      setupHappyPath();

      await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(ephemeralEnvService.spawnRuntime).toHaveBeenCalled();
    });

    it('calls generateDbScript with sample response and token', async () => {
      setupHappyPath();

      await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(msgSampleGenerationService.generateDbScript).toHaveBeenCalledWith(mockSampleResp, 'test-token');
    });

    it('calls generateEnrichmentDbScript with enrichment response and token', async () => {
      setupHappyPath();

      await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(msgSampleGenerationService.generateEnrichmentDbScript).toHaveBeenCalledWith(mockEnrichmentResp, 'test-token');
    });

    it('calls saveRunResult for each trigger message', async () => {
      setupHappyPath();

      await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(adminServiceClient.saveRunResult).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({ gen_id: 1, trigger_id: 101 }),
      );
    });

    it('publishes to nats-utilities using correct natsUtilsBase URL', async () => {
      setupHappyPath();

      await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(httpService.post).toHaveBeenCalledWith(
        'http://localhost:40000/natsPublish',
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('always destroys ephemeral env in finally block on success', async () => {
      setupHappyPath();

      await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(ephemeralEnvService.destroy).toHaveBeenCalled();
    });

    it('always destroys ephemeral env in finally block on failure', async () => {
      setupHappyPath();
      ephemeralEnvService.spawnRuntime.mockRejectedValue(new Error('Runtime failed'));

      await expect(service.runSimulation('test-token', 'cbe', mockRunBody)).rejects.toThrow('Runtime failed');

      expect(ephemeralEnvService.destroy).toHaveBeenCalled();
    });
  });

  // ── runSimulation — error recording per trigger ────────────────────────────

  describe('runSimulation — per-trigger error handling', () => {
    it('records error field on result when nats publish fails', async () => {
      setupHappyPath();
      const { throwError } = require('rxjs') as typeof import('rxjs');
      httpService.post.mockReturnValue(throwError(() => new Error('NATS timeout')) as any);

      const result = await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(result.results[0].error).toBe('NATS timeout');
    });

    it('continues processing remaining trigger messages after one fails', async () => {
      const twoTriggers: SampleTriggerMessagesResponse = {
        success: true,
        data: [
          { ...mockTriggerMessage, trigger_txtp_config_id: 101 },
          { ...mockTriggerMessage, trigger_txtp_config_id: 102 },
        ],
      };
      setupHappyPath(twoTriggers);
      const { throwError } = require('rxjs') as typeof import('rxjs');
      httpService.post
        .mockReturnValueOnce(throwError(() => new Error('NATS timeout')) as any)
        .mockReturnValue(of({ data: { data: { ruleResult: {} } } }) as any);

      const result = await service.runSimulation('test-token', 'cbe', mockRunBody);

      expect(result.results).toHaveLength(2);
      expect(result.results[0].error).toBe('NATS timeout');
      expect(result.results[1].error).toBeUndefined();
    });
  });

  // ── runSimulation — nats routing ───────────────────────────────────────────

  describe('runSimulation — nats routing', () => {
    it('uses sub-rule-<ruleName>@<version> as nats destination', async () => {
      setupHappyPath();

      await service.runSimulation('test-token', 'cbe', mockRunBody);

      const callArg = (httpService.post as jest.Mock).mock.calls[0][1] as Record<string, unknown>;
      expect((callArg as any).destination).toBe('sub-rule-rule-021@rc');
    });

    it('uses pub-rule-<ruleName>@<version> as nats consumer', async () => {
      setupHappyPath();

      await service.runSimulation('test-token', 'cbe', mockRunBody);

      const callArg = (httpService.post as jest.Mock).mock.calls[0][1] as Record<string, unknown>;
      expect((callArg as any).consumer).toBe('pub-rule-rule-021@rc');
    });

    it('sends awaitReply: true so nats-utilities waits for a response', async () => {
      setupHappyPath();

      await service.runSimulation('test-token', 'cbe', mockRunBody);

      const callArg = (httpService.post as jest.Mock).mock.calls[0][1] as Record<string, unknown>;
      expect((callArg as any).awaitReply).toBe(true);
    });

    it('includes tenantId and correlationId in nats message metadata', async () => {
      setupHappyPath();

      await service.runSimulation('test-token', 'cbe', mockRunBody);

      const callArg = (httpService.post as jest.Mock).mock.calls[0][1] as Record<string, unknown>;
      const meta = (callArg as any).message.metaData;
      expect(meta.tenantId).toBe('cbe');
      expect(typeof meta.correlationId).toBe('string');
      expect(meta.correlationId).toBe('test-correlation-id-uuid');
    });

    it('uses the same correlationId for all trigger messages in a run', async () => {
      const twoTriggers: SampleTriggerMessagesResponse = {
        success: true,
        data: [
          { ...mockTriggerMessage, trigger_txtp_config_id: 101 },
          { ...mockTriggerMessage, trigger_txtp_config_id: 102 },
        ],
      };
      setupHappyPath(twoTriggers);

      await service.runSimulation('test-token', 'cbe', mockRunBody);

      const calls = (httpService.post as jest.Mock).mock.calls;
      const id1 = (calls[0][1] as any).message.metaData.correlationId;
      const id2 = (calls[1][1] as any).message.metaData.correlationId;
      expect(id1).toBe(id2);
    });
  });
});

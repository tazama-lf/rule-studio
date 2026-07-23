import { BadRequestException, NotFoundException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { EphemeralEnvService } from '../../src/services/simulation-studio/ephemeral-env/ephemeral-env.service';
import { SimulationStatus } from '../../src/services/simulation-studio/ephemeral-env/interfaces/ephemeral-env.interfaces';

// ── Testcontainers mock ────────────────────────────────────────────────────
// resetMocks: true clears implementations between tests, so we set up a
// minimal factory here and re-apply all implementations in beforeEach.

jest.mock('testcontainers', () => ({
  GenericContainer: jest.fn(),
  Network: jest.fn(),
  Wait: {
    forHealthCheck: jest.fn(),
    forLogMessage: jest.fn(),
    forHttp: jest.fn(),
  },
}));

import { GenericContainer, Network, Wait } from 'testcontainers';

const MockGenericContainer = GenericContainer as jest.MockedClass<typeof GenericContainer>;
const MockNetwork = Network as jest.MockedClass<typeof Network>;

// ── Shared mock functions ──────────────────────────────────────────────────

const mockContainerStop = jest.fn<() => Promise<void>>();
const mockNetworkStop = jest.fn<() => Promise<void>>();
const mockNetworkStart = jest.fn<() => Promise<unknown>>();
const mockContainerStart = jest.fn<() => Promise<unknown>>();

const mockContainerBuilder = {
  withNetwork: jest.fn(),
  withNetworkAliases: jest.fn(),
  withEnvironment: jest.fn(),
  withExposedPorts: jest.fn(),
  withWaitStrategy: jest.fn(),
  withHealthCheck: jest.fn(),
  withStartupTimeout: jest.fn(),
  withCommand: jest.fn(),
  withCopyContentToContainer: jest.fn(),
  withLogConsumer: jest.fn(),
  start: mockContainerStart,
};

// ── fetch mock ─────────────────────────────────────────────────────────────

const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch as typeof fetch;

// ── Shared fixtures ────────────────────────────────────────────────────────

function makeStartedNetwork() {
  return { stop: mockNetworkStop };
}

function makeStartedContainer(mappedPorts: Record<number, number> = {}) {
  return {
    stop: mockContainerStop,
    getMappedPort: jest.fn((port: number) => mappedPorts[port] ?? port + 10000),
  };
}

function makeSimEntry(overrides: Partial<{
  status: SimulationStatus;
  natsUtils?: number;
  natsUtilsHost?: string;
}> = {}) {
  const status = overrides.status ?? SimulationStatus.UP;
  return {
    info: {
      name: 'sim-1',
      ruleName: 'rule-901',
      version: 'rc',
      functionName: 'rule-901-rel-rc',
      natsSubject: 'sub-rule-901@rc',
      natsConsumer: 'pub-rule-901@rc',
      ports: {
        pg: 54320,
        pgHost: 'localhost',
        nats: 44220,
        natsHost: 'localhost',
        natsMonitor: 82220,
        valkey: 63790,
        natsUtils: overrides.natsUtils,
        natsUtilsHost: overrides.natsUtilsHost,
      },
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      status,
    },
    network: makeStartedNetwork(),
    postgres: makeStartedContainer({ 5432: 54320 }),
  };
}

function applyBuilderImplementations() {
  Object.keys(mockContainerBuilder).forEach((key) => {
    const fn = mockContainerBuilder[key as keyof typeof mockContainerBuilder];
    if (key !== 'start' && typeof fn === 'function') {
      (fn as jest.Mock).mockReturnThis();
    }
  });
}

// ──────────────────────────────────────────────────────────────────────────

describe('EphemeralEnvService', () => {
  let service: EphemeralEnvService;

  beforeEach(() => {
    service = new EphemeralEnvService();

    // Re-apply all implementations (resetMocks: true clears them each test)
    applyBuilderImplementations();
    MockGenericContainer.mockImplementation(() => mockContainerBuilder as any);
    MockNetwork.mockImplementation(() => ({ start: mockNetworkStart }) as any);
    (Wait.forHealthCheck as jest.Mock).mockReturnValue({});
    (Wait.forLogMessage as jest.Mock).mockReturnValue({});
    (Wait.forHttp as jest.Mock).mockReturnValue({
      forStatusCodeMatching: jest.fn().mockReturnThis(),
      withStartupTimeout: jest.fn().mockReturnThis(),
    });

    mockContainerStop.mockResolvedValue(undefined);
    mockNetworkStop.mockResolvedValue(undefined);
    mockNetworkStart.mockResolvedValue(makeStartedNetwork());
    mockContainerStart.mockResolvedValue(makeStartedContainer({ 5432: 54320, 4222: 44220, 8222: 82220, 6379: 63790, 4000: 40000 }));

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '-- SQL content',
      json: async () => [],
    } as Response);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── list ───────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns empty array when no simulations exist', () => {
      expect(service.list()).toEqual([]);
    });

    it('returns info for every registered simulation', () => {
      const sim = makeSimEntry();
      (service as any).simulations.set('sim-1', sim);

      const result = service.list();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('sim-1');
    });

    it('returns info for multiple simulations', () => {
      (service as any).simulations.set('sim-a', makeSimEntry());
      (service as any).simulations.set('sim-b', makeSimEntry());

      expect(service.list()).toHaveLength(2);
    });
  });

  // ── get ────────────────────────────────────────────────────────────────────

  describe('get', () => {
    it('returns undefined when simulation does not exist', () => {
      expect(service.get('missing')).toBeUndefined();
    });

    it('returns simulation info when it exists', () => {
      const sim = makeSimEntry();
      (service as any).simulations.set('sim-1', sim);

      const result = service.get('sim-1');

      expect(result).toBe(sim.info);
    });
  });

  // ── getNatsUtilsUrl ────────────────────────────────────────────────────────

  describe('getNatsUtilsUrl', () => {
    it('throws NotFoundException when simulation does not exist', () => {
      expect(() => service.getNatsUtilsUrl('missing')).toThrow(NotFoundException);
    });

    it('throws BadRequestException when simulation is in POSTGRES_UP status', () => {
      const sim = makeSimEntry({ status: SimulationStatus.POSTGRES_UP, natsUtils: undefined });
      (service as any).simulations.set('sim-1', sim);

      expect(() => service.getNatsUtilsUrl('sim-1')).toThrow(BadRequestException);
    });

    it('returns correct URL using natsUtilsHost and natsUtils port', () => {
      const sim = makeSimEntry({ status: SimulationStatus.UP, natsUtils: 40000, natsUtilsHost: 'localhost' });
      (service as any).simulations.set('sim-1', sim);

      const url = service.getNatsUtilsUrl('sim-1');

      expect(url).toBe('http://localhost:40000');
    });

    it('falls back to containerHost when natsUtilsHost is undefined', () => {
      const sim = makeSimEntry({ status: SimulationStatus.UP, natsUtils: 40000, natsUtilsHost: undefined });
      (service as any).simulations.set('sim-1', sim);

      const url = service.getNatsUtilsUrl('sim-1');

      expect(url).toMatch(/http:\/\/.+:40000/);
    });
  });

  // ── destroy ────────────────────────────────────────────────────────────────

  describe('destroy', () => {
    it('throws NotFoundException when simulation does not exist', async () => {
      await expect(service.destroy('missing')).rejects.toThrow(NotFoundException);
    });

    it('stops postgres and removes the simulation entry', async () => {
      const sim = makeSimEntry();
      (service as any).simulations.set('sim-1', sim);

      await service.destroy('sim-1');

      expect(sim.postgres.stop).toHaveBeenCalled();
      expect(service.get('sim-1')).toBeUndefined();
    });

    it('stops all runtime containers when they are present', async () => {
      const sim = makeSimEntry();
      const natsStop = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const valkeyStop = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const ruleProcessorStop = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const natsUtilitiesStop = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      (sim as any).nats = { stop: natsStop };
      (sim as any).valkey = { stop: valkeyStop };
      (sim as any).ruleProcessor = { stop: ruleProcessorStop };
      (sim as any).natsUtilities = { stop: natsUtilitiesStop };
      (service as any).simulations.set('sim-1', sim);

      await service.destroy('sim-1');

      expect(natsStop).toHaveBeenCalled();
      expect(valkeyStop).toHaveBeenCalled();
      expect(ruleProcessorStop).toHaveBeenCalled();
      expect(natsUtilitiesStop).toHaveBeenCalled();
    });

    it('stops the network after containers', async () => {
      const sim = makeSimEntry();
      (service as any).simulations.set('sim-1', sim);

      await service.destroy('sim-1');

      expect(mockNetworkStop).toHaveBeenCalled();
    });

    it('tolerates partial state (POSTGRES_UP with no runtime containers)', async () => {
      const sim = makeSimEntry({ status: SimulationStatus.POSTGRES_UP });
      (service as any).simulations.set('sim-1', sim);

      await expect(service.destroy('sim-1')).resolves.not.toThrow();
      expect(sim.postgres.stop).toHaveBeenCalled();
    });
  });

  // ── destroyAll ─────────────────────────────────────────────────────────────

  describe('destroyAll', () => {
    it('is a no-op when there are no simulations', async () => {
      await expect(service.destroyAll()).resolves.not.toThrow();
    });

    it('destroys all registered simulations', async () => {
      (service as any).simulations.set('sim-a', makeSimEntry());
      (service as any).simulations.set('sim-b', makeSimEntry());

      await service.destroyAll();

      expect(service.list()).toHaveLength(0);
    });

    it('removes all entries even if one destroy fails', async () => {
      const sim1 = makeSimEntry();
      const sim2 = makeSimEntry();
      (sim1.postgres.stop as jest.Mock).mockRejectedValue(new Error('stop failed'));
      (service as any).simulations.set('sim-a', sim1);
      (service as any).simulations.set('sim-b', sim2);

      await expect(service.destroyAll()).resolves.not.toThrow();
    });
  });

  // ── onModuleDestroy ────────────────────────────────────────────────────────

  describe('onModuleDestroy', () => {
    it('calls destroyAll', async () => {
      const destroyAllSpy = jest.spyOn(service, 'destroyAll').mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(destroyAllSpy).toHaveBeenCalled();
    });
  });

  // ── spawnPostgres ──────────────────────────────────────────────────────────

  describe('spawnPostgres', () => {
    it('throws BadRequestException when simulation with the same name already exists', async () => {
      (service as any).simulations.set('sim-1', makeSimEntry());

      await expect(service.spawnPostgres('sim-1')).rejects.toThrow(BadRequestException);
    });

    it('registers simulation with POSTGRES_UP status after successful start', async () => {
      mockNetworkStart.mockResolvedValue(makeStartedNetwork());
      mockContainerStart.mockResolvedValue(makeStartedContainer({ 5432: 54321 }));
      mockFetch.mockResolvedValue({
        ok: true, status: 200,
        text: async () => '-- SQL migration',
        json: async () => [{ type: 'file', name: '01-init.sql', download_url: 'http://example.com/01-init.sql' }],
      } as Response);

      const info = await service.spawnPostgres('new-sim');

      expect(info.status).toBe(SimulationStatus.POSTGRES_UP);
      expect(service.get('new-sim')).toBeDefined();
    });

    it('returns simulation info with pg port populated', async () => {
      mockNetworkStart.mockResolvedValue(makeStartedNetwork());
      mockContainerStart.mockResolvedValue(makeStartedContainer({ 5432: 54321 }));
      mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => '', json: async () => [] } as Response);

      const info = await service.spawnPostgres('new-sim', { ruleName: 'rule-021', version: 'rc' });

      expect(info.ports.pg).toBeDefined();
      expect(typeof info.ports.pg).toBe('number');
    });

    it('applies ruleName and version from options', async () => {
      mockNetworkStart.mockResolvedValue(makeStartedNetwork());
      mockContainerStart.mockResolvedValue(makeStartedContainer({ 5432: 54321 }));
      mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => '', json: async () => [] } as Response);

      const info = await service.spawnPostgres('rule-sim', { ruleName: 'rule-021', version: 'v2' });

      expect(info.ruleName).toBe('rule-021');
      expect(info.version).toBe('v2');
    });

    it('uses default ruleName (rule-901) and version (rc) when options omitted', async () => {
      mockNetworkStart.mockResolvedValue(makeStartedNetwork());
      mockContainerStart.mockResolvedValue(makeStartedContainer({ 5432: 54321 }));
      mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => '', json: async () => [] } as Response);

      const info = await service.spawnPostgres('default-sim');

      expect(info.ruleName).toBe('rule-901');
      expect(info.version).toBe('rc');
    });

    it('stops the network and rethrows if postgres container start fails', async () => {
      mockNetworkStart.mockResolvedValue(makeStartedNetwork());
      mockContainerStart.mockRejectedValue(new Error('Container failed to start'));
      mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => '', json: async () => [] } as Response);

      await expect(service.spawnPostgres('fail-sim')).rejects.toThrow('Container failed to start');
      expect(mockNetworkStop).toHaveBeenCalled();
      expect(service.get('fail-sim')).toBeUndefined();
    });
  });

  // ── spawnRuntime ───────────────────────────────────────────────────────────

  describe('spawnRuntime', () => {
    it('throws NotFoundException when no entry exists for the given name', async () => {
      await expect(service.spawnRuntime('missing')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when simulation is already UP', async () => {
      (service as any).simulations.set('already-up', makeSimEntry({ status: SimulationStatus.UP }));

      await expect(service.spawnRuntime('already-up')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when Docker Hub reports image not found (404)', async () => {
      const sim = makeSimEntry({ status: SimulationStatus.POSTGRES_UP });
      (service as any).simulations.set('pg-ready', sim);
      mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);

      await expect(service.spawnRuntime('pg-ready')).rejects.toThrow(BadRequestException);
    });

    it('promotes status to UP on success', async () => {
      const sim = makeSimEntry({ status: SimulationStatus.POSTGRES_UP });
      (service as any).simulations.set('pg-ready', sim);
      mockFetch.mockResolvedValue({ ok: true, status: 200 } as Response);
      mockContainerStart.mockResolvedValue(makeStartedContainer({ 4222: 44220, 8222: 82220, 6379: 63790, 4000: 40000 }));

      const info = await service.spawnRuntime('pg-ready');

      expect(info.status).toBe(SimulationStatus.UP);
    });

    it('populates nats, valkey and natsUtils ports after successful spawn', async () => {
      const sim = makeSimEntry({ status: SimulationStatus.POSTGRES_UP });
      (service as any).simulations.set('pg-ready', sim);
      mockFetch.mockResolvedValue({ ok: true, status: 200 } as Response);
      mockContainerStart.mockResolvedValue(makeStartedContainer({ 4222: 44220, 8222: 82220, 6379: 63790, 4000: 40000 }));

      const info = await service.spawnRuntime('pg-ready');

      expect(info.ports.nats).toBeDefined();
      expect(info.ports.valkey).toBeDefined();
      expect(info.ports.natsUtils).toBeDefined();
    });
  });

  // ── spawn ──────────────────────────────────────────────────────────────────

  describe('spawn', () => {
    it('calls spawnPostgres then spawnRuntime and returns final info', async () => {
      const postgresInfo = {
        name: 'all-in-one', ruleName: 'rule-901', version: 'rc',
        functionName: 'rule-901-rel-rc', natsSubject: 'sub-rule-901@rc', natsConsumer: 'pub-rule-901@rc',
        ports: { pg: 54320, pgHost: 'localhost' },
        startedAt: new Date(), status: SimulationStatus.POSTGRES_UP,
      };
      const runtimeInfo = { ...postgresInfo, status: SimulationStatus.UP };
      const spawnPostgresSpy = jest.spyOn(service, 'spawnPostgres').mockResolvedValue(postgresInfo);
      const spawnRuntimeSpy = jest.spyOn(service, 'spawnRuntime').mockResolvedValue(runtimeInfo);

      const result = await service.spawn('all-in-one', { ruleName: 'rule-901', version: 'rc' });

      expect(spawnPostgresSpy).toHaveBeenCalledWith('all-in-one', { ruleName: 'rule-901', version: 'rc' });
      expect(spawnRuntimeSpy).toHaveBeenCalledWith('all-in-one');
      expect(result.status).toBe(SimulationStatus.UP);
    });

    it('propagates error from spawnPostgres', async () => {
      jest.spyOn(service, 'spawnPostgres').mockRejectedValue(new Error('Postgres failed'));

      await expect(service.spawn('fail-sim')).rejects.toThrow('Postgres failed');
    });
  });
});

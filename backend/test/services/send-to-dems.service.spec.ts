import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { SendToDemsService } from '../../src/services/send-to-dems/send-to-dems.service';
import { SIMULATION_QUEUE, SIMULATION_JOB } from '../../src/queues/simulation-queue.constants';
import type { DirectSimulationMessage } from '../../src/queues/simulation-queue.constants';

const makeMessage = (overrides: Partial<DirectSimulationMessage> = {}): DirectSimulationMessage => ({
  messageId: 'msg-1',
  timestamp: '2026-01-01T00:00:00Z',
  endpoint: 'http://dems.example.com/evaluate',
  data: { TxTp: 'pacs.008.001.02' },
  ...overrides,
});

describe('SendToDemsService', () => {
  let service: SendToDemsService;
  let queue: { add: jest.Mock };

  beforeEach(async () => {
    queue = { add: jest.fn().mockResolvedValue({ id: 'bull-job-id' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendToDemsService,
        {
          provide: getQueueToken(SIMULATION_QUEUE),
          useValue: queue,
        },
      ],
    }).compile();

    service = module.get(SendToDemsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('enqueueSimulation', () => {
    it('returns a jobId', async () => {
      const result = await service.enqueueSimulation('tok', ['table_a', 'table_b']);

      expect(result).toHaveProperty('jobId');
      expect(typeof result.jobId).toBe('string');
      expect(result.jobId).toHaveLength(36); // UUID v4
    });

    it('adds a job to the simulation queue with correct payload', async () => {
      const result = await service.enqueueSimulation('tok', ['table_a', 'table_b']);

      expect(queue.add).toHaveBeenCalledTimes(1);
      expect(queue.add).toHaveBeenCalledWith(
        SIMULATION_JOB,
        expect.objectContaining({
          jobId: result.jobId,
          token: 'tok',
          tableNames: ['table_a', 'table_b'],
        }),
      );
    });

    it('generates a unique jobId on each call', async () => {
      const r1 = await service.enqueueSimulation('tok', []);
      const r2 = await service.enqueueSimulation('tok', []);

      expect(r1.jobId).not.toBe(r2.jobId);
    });

    it('handles an empty tableNames array', async () => {
      const result = await service.enqueueSimulation('tok', []);

      expect(queue.add).toHaveBeenCalledWith(
        SIMULATION_JOB,
        expect.objectContaining({ tableNames: [] }),
      );
      expect(result.jobId).toBeTruthy();
    });
  });

  describe('enqueueDlhSimulation', () => {
    const messages = [makeMessage(), makeMessage({ messageId: 'msg-2' })];

    it('returns a jobId', async () => {
      const result = await service.enqueueDlhSimulation(messages, 'tok', 'sim_table_1');

      expect(result).toHaveProperty('jobId');
      expect(typeof result.jobId).toBe('string');
      expect(result.jobId).toHaveLength(36);
    });

    it('adds a job with messages, tableName, tenantId and totalMessages', async () => {
      const result = await service.enqueueDlhSimulation(messages, 'tok', 'sim_table_1', 'tenant-1', 2);

      expect(queue.add).toHaveBeenCalledTimes(1);
      expect(queue.add).toHaveBeenCalledWith(
        SIMULATION_JOB,
        expect.objectContaining({
          jobId: result.jobId,
          token: 'tok',
          messages,
          tableName: 'sim_table_1',
          tenantId: 'tenant-1',
          totalMessages: 2,
        }),
      );
    });

    it('works without optional tenantId and totalMessages', async () => {
      const result = await service.enqueueDlhSimulation(messages, 'tok', undefined);

      expect(queue.add).toHaveBeenCalledWith(
        SIMULATION_JOB,
        expect.objectContaining({
          jobId: result.jobId,
          messages,
          tableName: undefined,
        }),
      );
    });

    it('generates a unique jobId on each call', async () => {
      const r1 = await service.enqueueDlhSimulation(messages, 'tok', 'table_1');
      const r2 = await service.enqueueDlhSimulation(messages, 'tok', 'table_2');

      expect(r1.jobId).not.toBe(r2.jobId);
    });

    it('handles an empty messages array', async () => {
      const result = await service.enqueueDlhSimulation([], 'tok', 'sim_table_1');

      expect(queue.add).toHaveBeenCalledWith(
        SIMULATION_JOB,
        expect.objectContaining({ messages: [] }),
      );
      expect(result.jobId).toBeTruthy();
    });
  });
});

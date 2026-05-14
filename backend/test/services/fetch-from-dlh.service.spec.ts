import { Test, TestingModule } from '@nestjs/testing';
import { FetchFromDlhService } from '../../src/services/fetch-from-dlh/fetch-from-dlh.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import { SendToDemsService } from '../../src/services/send-to-dems/send-to-dems.service';
import { SimulationService } from '../../src/services/simulation/simulation.service';
import type { FetchFromDlhQueryDto } from '../../src/services/fetch-from-dlh/dto/fetch-from-dlh.dto';

const makeQuery = (overrides: Partial<FetchFromDlhQueryDto> = {}): FetchFromDlhQueryDto => ({
  txtp: 'pacs.008',
  mask_fields: [],
  startDtTm: '2026-01-01T00:00:00',
  endDtTm: '2026-01-01T23:59:59',
  ...overrides,
});

const makeDlhItem = (overrides: Partial<{ message_id: string; credttm_ts: string; document: Record<string, unknown> }> = {}) => ({
  message_id: 'msg-1',
  credttm_ts: '2026-01-01T00:00:00Z',
  document: { TxTp: 'pacs.008.001.02', foo: 'bar' },
  ...overrides,
});

const makeDlhPageResponse = (items: ReturnType<typeof makeDlhItem>[], total?: number) => ({
  items,
  total: total ?? items.length,
  page: 1,
  size: 100,
  pages: 1,
});

describe('FetchFromDlhService', () => {
  let service: FetchFromDlhService;
  let adminClient: jest.Mocked<AdminServiceClient>;
  let sendToDemsService: jest.Mocked<SendToDemsService>;
  let simulationService: jest.Mocked<SimulationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FetchFromDlhService,
        {
          provide: AdminServiceClient,
          useValue: {
            stageSimulationItems: jest.fn(),
            truncateEvaluationData: jest.fn(),
            saveRecordInTrsSimulation: jest.fn(),
            fetchCountFromDlh: jest.fn(),
          },
        },
        {
          provide: SendToDemsService,
          useValue: {
            enqueueDlhSimulation: jest.fn(),
          },
        },
        {
          provide: SimulationService,
          useValue: {
            excludedTypes: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(FetchFromDlhService);
    adminClient = module.get(AdminServiceClient) as jest.Mocked<AdminServiceClient>;
    sendToDemsService = module.get(SendToDemsService) as jest.Mocked<SendToDemsService>;
    simulationService = module.get(SimulationService) as jest.Mocked<SimulationService>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchFromDlh', () => {
    const token = 'test-token';
    const tenantId = 'tenant-1';
    const query = makeQuery();
    const item = makeDlhItem();
    const pageResponse = makeDlhPageResponse([item]);

    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(pageResponse),
      } as unknown as Response);

      adminClient.stageSimulationItems.mockResolvedValue({ tableName: 'sim_table_1' });
      adminClient.truncateEvaluationData.mockResolvedValue({ message: 'OK' });
      adminClient.saveRecordInTrsSimulation.mockResolvedValue({ message: 'OK' });
      sendToDemsService.enqueueDlhSimulation.mockResolvedValue({ jobId: 'job-1' });
    });

    it('returns tableName and jobId on success', async () => {
      const result = await service.fetchFromDlh([query], tenantId, token);

      expect(result).toEqual({ tableName: 'sim_table_1', jobId: 'job-1' });
    });

    it('calls stageSimulationItems with mapped items', async () => {
      await service.fetchFromDlh([query], tenantId, token);

      expect(adminClient.stageSimulationItems).toHaveBeenCalledTimes(1);
      const stagedItems = adminClient.stageSimulationItems.mock.calls[0][0] as unknown[];
      expect(stagedItems).toHaveLength(1);
    });

    it('truncates evaluation data before enqueueing', async () => {
      await service.fetchFromDlh([query], tenantId, token);

      expect(adminClient.truncateEvaluationData).toHaveBeenCalledWith(token);
    });

    it('saves a RUNNING record in trs_simulation before enqueueing', async () => {
      await service.fetchFromDlh([query], tenantId, token);

      expect(adminClient.saveRecordInTrsSimulation).toHaveBeenCalledWith(
        expect.objectContaining({
          simulationId: 'sim_table_1',
          simStatus: 'RUNNING',
          tenantId,
          totalRecord: 1,
          recordProcessed: 0,
        }),
        token,
      );
    });

    it('enqueues simulation with correct message count', async () => {
      await service.fetchFromDlh([query], tenantId, token);

      expect(sendToDemsService.enqueueDlhSimulation).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ messageId: item.message_id }),
        ]),
        token,
        'sim_table_1',
        tenantId,
        1,
      );
    });

    it('uses custom endpoint_path when provided', async () => {
      const queryWithPath = makeQuery({ endpoint_path: '/custom/path', txtp: 'pacs.008' });
      await service.fetchFromDlh([queryWithPath], tenantId, token);

      const enqueuedMessages = sendToDemsService.enqueueDlhSimulation.mock.calls[0][0] as Array<{ endpoint: string }>;
      expect(enqueuedMessages[0].endpoint).toContain('/custom/path');
    });

    it('throws when queries is not an array', async () => {
      await expect(
        service.fetchFromDlh(null as unknown as FetchFromDlhQueryDto[], tenantId, token),
      ).rejects.toThrow('Invalid queries parameter: expected an array');
    });

    it('throws when DLH fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Service Unavailable',
      });

      await expect(service.fetchFromDlh([query], tenantId, token)).rejects.toThrow(
        'Failed to fetch data from DLH',
      );
    });

    it('handles empty DLH result', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(makeDlhPageResponse([])),
      } as unknown as Response);
      adminClient.stageSimulationItems.mockResolvedValue({ tableName: null });

      const result = await service.fetchFromDlh([query], tenantId, token);

      expect(result).toEqual({ tableName: null, jobId: 'job-1' });
      expect(sendToDemsService.enqueueDlhSimulation).toHaveBeenCalledWith([], token, undefined, tenantId, 0);
    });
  });
});

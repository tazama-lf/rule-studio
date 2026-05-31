import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SimulationStudioService } from '../../src/services/simulation-studio/simulation-studio.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import { DockerHubService } from '../../src/services/dockerhub/dockerhub.service';
import type {
  GenerateContextQueryDto,
  PatchSimulationSuitesDto,
  RequestSimulationSuitesDto,
  SimulationSuiteResponseDto,
  SimulationSuitesDto,
  SimulationSuitesListDto,
  SimulationSuitesQueryDto,
  UpdateDraftSuiteDto,
} from '../../src/services/simulation-studio/dto';

describe('SimulationStudioService', () => {
  let service: SimulationStudioService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;
  let dockerHubService: jest.Mocked<DockerHubService>;

  const mockSuite: SimulationSuitesDto = {
    id: '101',
    tenant_id: 'tenant_001',
    name: 'Q3 Edge Cases',
    description: 'step-1 payload',
    simulation_type: 'SINGLE_RULE' as any,
    status: 'DRAFT' as any,
    rule_name: 'Rule 002',
    rule_version: 'v1.0',
    primary_txtp: 'pacs.008',
    primary_txtp_version: 'v1.0',
    iteration_count: 0,
    run_count: 0,
    wizard_progress: {},
    metadata: {},
    created_by: 'user-1',
  };

  const mockList: SimulationSuitesListDto = {
    success: true,
    message: 'Simulation suites retrieved successfully',
    suites: [mockSuite],
    total: 1,
  };

  const mockSuiteResponse: SimulationSuiteResponseDto = {
    success: true,
    message: 'Simulation suite updated successfully',
    suite: mockSuite,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationStudioService,
        {
          provide: AdminServiceClient,
          useValue: {
            getSimulationSuites: jest.fn(),
            getSimulationSuiteById: jest.fn(),
            createSimulationSuite: jest.fn(),
            patchSimulationSuite: jest.fn(),
            putSimulationSuiteDraft: jest.fn(),
            getTransactionTypes: jest.fn(),
            getConfigRowByTxTp: jest.fn(),
            getPayloadByTransactionType: jest.fn(),
            generateSimulationContext: jest.fn(),
            runSimulationSuite: jest.fn(),
            getSimulationRunStatus: jest.fn(),
          },
        },
        {
          provide: DockerHubService,
          useValue: {
            getPublishedRules: jest.fn(),
            getTagsForRule: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SimulationStudioService>(SimulationStudioService);
    adminServiceClient = module.get(AdminServiceClient);
    dockerHubService = module.get(DockerHubService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getSimulationSuites forwards token and query', async () => {
    const query: SimulationSuitesQueryDto = { search: 'Q3', limit: 10, offset: 0 } as SimulationSuitesQueryDto;
    adminServiceClient.getSimulationSuites.mockResolvedValue(mockList);

    const result = await service.getSimulationSuites('test-token', query);

    expect(result).toEqual(mockList);
    expect(adminServiceClient.getSimulationSuites).toHaveBeenCalledWith('test-token', query);
  });

  it('getSimulationSuiteById forwards token and id', async () => {
    adminServiceClient.getSimulationSuiteById.mockResolvedValue(mockSuiteResponse);

    const result = await service.getSimulationSuiteById('test-token', 101);

    expect(result).toEqual(mockSuiteResponse);
    expect(adminServiceClient.getSimulationSuiteById).toHaveBeenCalledWith('test-token', 101);
  });

  it('createSimulationSuites maps alias fields and adds default wizard progress', async () => {
    const createDto: RequestSimulationSuitesDto = {
      name: 'Q3 Edge Cases',
      associated_rule: 'Rule 002',
      txtp: 'pacs.008',
      version: 'v1.0',
    } as RequestSimulationSuitesDto;

    adminServiceClient.createSimulationSuite.mockResolvedValue(mockSuite);

    await service.createSimulationSuites('test-token', createDto);

    expect(adminServiceClient.createSimulationSuite).toHaveBeenCalledWith(
      'test-token',
      expect.objectContaining({
        name: 'Q3 Edge Cases',
        rule_name: 'Rule 002',
        primary_txtp: 'pacs.008',
        primary_txtp_version: 'v1.0',
        wizard_progress: { step: 1, completed: false },
      }),
    );
  });

  it('patchSimulationSuite maps alias fields', async () => {
    const patchDto: PatchSimulationSuitesDto = {
      associated_rule: 'Rule 003',
      txtp: 'pain.001',
      txtp_version: 'v2.0',
      metadata: { step: 2 },
    } as PatchSimulationSuitesDto;

    adminServiceClient.patchSimulationSuite.mockResolvedValue(mockSuiteResponse);

    await service.patchSimulationSuite('test-token', 101, patchDto);

    expect(adminServiceClient.patchSimulationSuite).toHaveBeenCalledWith(
      'test-token',
      101,
      expect.objectContaining({
        rule_name: 'Rule 003',
        primary_txtp: 'pain.001',
        primary_txtp_version: 'v2.0',
        metadata: { step: 2 },
      }),
    );
  });

  it('putSimulationSuiteDraft forwards payload to dedicated admin endpoint', async () => {
    const payload: UpdateDraftSuiteDto = { screen: 2, data: { txtpConfigs: [] } } as UpdateDraftSuiteDto;
    adminServiceClient.putSimulationSuiteDraft.mockResolvedValue(mockSuiteResponse);

    const result = await service.putSimulationSuiteDraft('test-token', 101, payload);

    expect(result).toEqual(mockSuiteResponse);
    expect(adminServiceClient.putSimulationSuiteDraft).toHaveBeenCalledWith('test-token', 101, payload);
  });

  it('getRegistryRepos uses docker hub service', async () => {
    dockerHubService.getPublishedRules.mockResolvedValue({ rules: [], count: 0 });

    const result = await service.getRegistryRepos('tenant_001');

    expect(result).toEqual({ rules: [], count: 0 });
    expect(dockerHubService.getPublishedRules).toHaveBeenCalledWith('tenant_001');
  });

  it('getRegistryRepoTags uses docker hub service', async () => {
    dockerHubService.getTagsForRule.mockResolvedValue({ rule: 'rule-001', tags: [], count: 0 });

    const result = await service.getRegistryRepoTags('tenant_001', 'rule-001');

    expect(result).toEqual({ rule: 'rule-001', tags: [], count: 0 });
    expect(dockerHubService.getTagsForRule).toHaveBeenCalledWith('tenant_001', 'rule-001');
  });

  it('getTxtpTypes maps transaction type rows to txtp payload', async () => {
    adminServiceClient.getTransactionTypes.mockResolvedValue([
      { transaction_type: 'pacs.008', endpoint_path: '/pacs' } as any,
      { transaction_type: 'pain.001', endpoint_path: '/pain' } as any,
    ]);

    const result = await service.getTxtpTypes('test-token');

    expect(result).toEqual([
      { txtp: 'pacs.008', versions: [] },
      { txtp: 'pain.001', versions: [] },
    ]);
  });

  it('getTxtpSchema returns schema from config row', async () => {
    adminServiceClient.getConfigRowByTxTp.mockResolvedValue({
      config: { schema: { type: 'object' }, mapping: [], payload: {} },
    });

    const result = await service.getTxtpSchema('test-token', 'pacs.008', '001.08');

    expect(result).toEqual({ schema: { type: 'object' } });
  });

  it('getTxtpSample returns payload from admin client', async () => {
    adminServiceClient.getPayloadByTransactionType.mockResolvedValue({ sample: true });

    const result = await service.getTxtpSample('test-token', 'pacs.008', '001.08');

    expect(result).toEqual({ payload: { sample: true } });
  });

  it('generateSimulationContext forwards to admin client', async () => {
    const query: GenerateContextQueryDto = { count: 3 } as GenerateContextQueryDto;
    adminServiceClient.generateSimulationContext.mockResolvedValue({ success: true, message: 'ok', rows: [], count: 0 });

    const result = await service.generateSimulationContext('test-token', 101, query);

    expect(result.success).toBe(true);
    expect(adminServiceClient.generateSimulationContext).toHaveBeenCalledWith('test-token', 101, query);
  });

  it('runSimulationSuite forwards to admin client', async () => {
    adminServiceClient.runSimulationSuite.mockResolvedValue({
      success: true,
      message: 'Simulation run started successfully',
      runId: 'run-101-1',
      status: 'ENV_PROVISIONING',
      phase: 'ENV_PROVISIONING',
    });

    const result = await service.runSimulationSuite('test-token', 101);

    expect(result.runId).toBe('run-101-1');
    expect(adminServiceClient.runSimulationSuite).toHaveBeenCalledWith('test-token', 101);
  });

  it('getSimulationRunStatus forwards to admin client', async () => {
    adminServiceClient.getSimulationRunStatus.mockResolvedValue({
      success: true,
      message: 'Simulation run status retrieved successfully',
      runId: 'run-101-1',
      status: 'RUNNING',
      phase: 'TRANSACTION_LOOP',
      partialResults: [],
    });

    const result = await service.getSimulationRunStatus('test-token', 101, 'run-101-1');

    expect(result.status).toBe('RUNNING');
    expect(adminServiceClient.getSimulationRunStatus).toHaveBeenCalledWith('test-token', 101, 'run-101-1');
  });

  it('logs and rethrows create errors', async () => {
    const createDto: RequestSimulationSuitesDto = { name: 'Q3' } as RequestSimulationSuitesDto;
    const error = new Error('Create failed');
    adminServiceClient.createSimulationSuite.mockRejectedValue(error);
    const loggerSpy = jest.spyOn(service['logger'], 'error');

    await expect(service.createSimulationSuites('test-token', createDto)).rejects.toThrow('Create failed');
    expect(loggerSpy).toHaveBeenCalledWith('Error creating simulation suite', expect.any(String));
  });
});

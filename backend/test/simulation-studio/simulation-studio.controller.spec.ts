import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SimulationStudioController } from '../../src/services/simulation-studio/simulation-studio.controller';
import { SimulationStudioService } from '../../src/services/simulation-studio/simulation-studio.service';
import { makeAuthenticatedUser } from '../helpers/rbac/user.factory';
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

describe('SimulationStudioController', () => {
  let controller: SimulationStudioController;
  let service: jest.Mocked<SimulationStudioService>;

  const makeUser = makeAuthenticatedUser;

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
      controllers: [SimulationStudioController],
      providers: [
        {
          provide: 'AUDIT_LOGGER',
          useValue: {
            logEvent: jest.fn(),
          },
        },
        {
          provide: SimulationStudioService,
          useValue: {
            getSimulationSuites: jest.fn(),
            getSimulationSuiteById: jest.fn(),
            createSimulationSuites: jest.fn(),
            patchSimulationSuite: jest.fn(),
            putSimulationSuiteDraft: jest.fn(),
            getRegistryRepos: jest.fn(),
            getRegistryRepoTags: jest.fn(),
            getTxtpTypes: jest.fn(),
            getTxtpSchema: jest.fn(),
            getTxtpSample: jest.fn(),
            generateSimulationContext: jest.fn(),
            runSimulationSuite: jest.fn(),
            getSimulationRunStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SimulationStudioController>(SimulationStudioController);
    service = module.get(SimulationStudioService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getSimulationSuites delegates with token and query', async () => {
    const user = makeUser();
    const query: SimulationSuitesQueryDto = { search: 'Q3' } as SimulationSuitesQueryDto;
    service.getSimulationSuites.mockResolvedValue(mockList);

    const result = await controller.getSimulationSuites(user, query);

    expect(result).toEqual(mockList);
    expect(service.getSimulationSuites).toHaveBeenCalledWith(user.token.tokenString, query);
  });

  it('getSimulationSuiteById delegates with token and id', async () => {
    const user = makeUser();
    service.getSimulationSuiteById.mockResolvedValue(mockSuiteResponse);

    const result = await controller.getSimulationSuiteById(101, user);

    expect(result).toEqual(mockSuiteResponse);
    expect(service.getSimulationSuiteById).toHaveBeenCalledWith(user.token.tokenString, 101);
  });

  it('createSimulationSuites delegates with token and payload', async () => {
    const user = makeUser();
    const body: RequestSimulationSuitesDto = {
      name: 'Q3 Edge Cases',
      associated_rule: 'Rule 002',
      txtp: 'pacs.008',
      version: 'v1.0',
    } as RequestSimulationSuitesDto;
    service.createSimulationSuites.mockResolvedValue(mockSuite);

    const result = await controller.createSimulationSuites(body, user);

    expect(result).toEqual(mockSuite);
    expect(service.createSimulationSuites).toHaveBeenCalledWith(user.token.tokenString, body);
  });

  it('patchSimulationSuite delegates with token, id and payload', async () => {
    const user = makeUser();
    const patch: PatchSimulationSuitesDto = { status: 'RUNNING' as any } as PatchSimulationSuitesDto;
    service.patchSimulationSuite.mockResolvedValue(mockSuiteResponse);

    const result = await controller.patchSimulationSuite(101, patch, user);

    expect(result).toEqual(mockSuiteResponse);
    expect(service.patchSimulationSuite).toHaveBeenCalledWith(user.token.tokenString, 101, patch);
  });

  it('putSimulationSuiteDraft delegates with token, id and payload', async () => {
    const user = makeUser();
    const payload: UpdateDraftSuiteDto = { screen: 2, data: { txtpConfigs: [] } } as UpdateDraftSuiteDto;
    service.putSimulationSuiteDraft.mockResolvedValue(mockSuiteResponse);

    const result = await controller.putSimulationSuiteDraft(101, payload, user);

    expect(result).toEqual(mockSuiteResponse);
    expect(service.putSimulationSuiteDraft).toHaveBeenCalledWith(user.token.tokenString, 101, payload);
  });

  it('getRegistryRepos delegates with tenant id', async () => {
    const user = makeUser();
    service.getRegistryRepos.mockResolvedValue({ rules: [], count: 0 });

    const result = await controller.getRegistryRepos(user);

    expect(result).toEqual({ rules: [], count: 0 });
    expect(service.getRegistryRepos).toHaveBeenCalledWith(user.tenantId);
  });

  it('getRegistryRepoTags delegates with tenant id and repo', async () => {
    const user = makeUser();
    service.getRegistryRepoTags.mockResolvedValue({ rule: 'rule-1', tags: [], count: 0 });

    const result = await controller.getRegistryRepoTags('rule-1', user);

    expect(result).toEqual({ rule: 'rule-1', tags: [], count: 0 });
    expect(service.getRegistryRepoTags).toHaveBeenCalledWith(user.tenantId, 'rule-1');
  });

  it('getTxtpTypes delegates with token', async () => {
    const user = makeUser();
    service.getTxtpTypes.mockResolvedValue([{ txtp: 'pacs.008', versions: ['001.08'] }]);

    const result = await controller.getTxtpTypes(user);

    expect(result).toEqual([{ txtp: 'pacs.008', versions: ['001.08'] }]);
    expect(service.getTxtpTypes).toHaveBeenCalledWith(user.token.tokenString);
  });

  it('getTxtpSchema delegates with token and params', async () => {
    const user = makeUser();
    service.getTxtpSchema.mockResolvedValue({ schema: { type: 'object' } });

    const result = await controller.getTxtpSchema('pacs.008', '001.08', user);

    expect(result).toEqual({ schema: { type: 'object' } });
    expect(service.getTxtpSchema).toHaveBeenCalledWith(user.token.tokenString, 'pacs.008', '001.08');
  });

  it('getTxtpSample delegates with token and params', async () => {
    const user = makeUser();
    service.getTxtpSample.mockResolvedValue({ payload: { sample: true } });

    const result = await controller.getTxtpSample('pacs.008', '001.08', user);

    expect(result).toEqual({ payload: { sample: true } });
    expect(service.getTxtpSample).toHaveBeenCalledWith(user.token.tokenString, 'pacs.008', '001.08');
  });

  it('generateSimulationContext delegates with token, id and query', async () => {
    const user = makeUser();
    const query: GenerateContextQueryDto = { count: 3 } as GenerateContextQueryDto;
    service.generateSimulationContext.mockResolvedValue({ success: true, message: 'ok', rows: [], count: 0 });

    const result = await controller.generateSimulationContext(101, query, user);

    expect(result.success).toBe(true);
    expect(service.generateSimulationContext).toHaveBeenCalledWith(user.token.tokenString, 101, query);
  });

  it('runSimulationSuite delegates with token and id', async () => {
    const user = makeUser();
    service.runSimulationSuite.mockResolvedValue({
      success: true,
      message: 'Simulation run started successfully',
      runId: 'run-1',
      status: 'ENV_PROVISIONING',
      phase: 'ENV_PROVISIONING',
    });

    const result = await controller.runSimulationSuite(101, user);

    expect(result.runId).toBe('run-1');
    expect(service.runSimulationSuite).toHaveBeenCalledWith(user.token.tokenString, 101);
  });

  it('getSimulationRunStatus delegates with token, id and runId', async () => {
    const user = makeUser();
    service.getSimulationRunStatus.mockResolvedValue({
      success: true,
      message: 'Simulation run status retrieved successfully',
      runId: 'run-1',
      status: 'RUNNING',
      phase: 'TRANSACTION_LOOP',
      partialResults: [],
    });

    const result = await controller.getSimulationRunStatus(101, 'run-1', user);

    expect(result.status).toBe('RUNNING');
    expect(service.getSimulationRunStatus).toHaveBeenCalledWith(user.token.tokenString, 101, 'run-1');
  });
});

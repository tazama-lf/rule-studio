import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SimulationStudioService } from '../../src/services/simulation-studio/simulation-studio.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import type {
  PatchSimulationSuitesDto,
  RequestSimulationSuitesDto,
  SimulationSuiteResponseDto,
  SimulationSuitesDto,
  SimulationSuitesListDto,
  SimulationSuitesQueryDto,
} from '../../src/services/simulation-studio/dto';

describe('SimulationStudioService', () => {
  let service: SimulationStudioService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

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
          },
        },
      ],
    }).compile();

    service = module.get<SimulationStudioService>(SimulationStudioService);
    adminServiceClient = module.get(AdminServiceClient);
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

  it('createSimulationSuites maps alias fields without wizard_progress override', async () => {
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
      }),
    );
    // wizard_progress must NOT be sent — admin-service owns the default { currentStep: 1, completedSteps: [1] }
    const callArg = (adminServiceClient.createSimulationSuite as jest.Mock).mock.calls[0][1] as Record<string, unknown>;
    expect(callArg).not.toHaveProperty('wizard_progress');
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

  it('logs and rethrows create errors', async () => {
    const createDto: RequestSimulationSuitesDto = { name: 'Q3' } as RequestSimulationSuitesDto;
    const error = new Error('Create failed');
    adminServiceClient.createSimulationSuite.mockRejectedValue(error);
    const loggerSpy = jest.spyOn(service['logger'], 'error');

    await expect(service.createSimulationSuites('test-token', createDto)).rejects.toThrow('Create failed');
    expect(loggerSpy).toHaveBeenCalledWith('Error creating simulation suite', expect.any(String));
  });
});

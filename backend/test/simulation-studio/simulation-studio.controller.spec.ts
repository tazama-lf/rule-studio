import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SimulationStudioController } from '../../src/services/simulation-studio/suites/simulation-studio.controller';
import { SimulationStudioService } from '../../src/services/simulation-studio/suites/simulation-studio.service';
import { makeAuthenticatedUser } from '../helpers/rbac/user.factory';
import type {
  PatchSimulationSuitesDto,
  RequestSimulationSuitesDto,
  SimulationSuiteResponseDto,
  SimulationSuitesDto,
  SimulationSuitesListDto,
  SimulationSuitesQueryDto,
} from '../../src/services/simulation-studio/suites/dto';

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
});

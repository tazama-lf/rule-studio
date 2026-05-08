import { Test, TestingModule } from '@nestjs/testing';
import { SimulationService } from '../../src/services/simulation/simulation.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import { makeAuthenticatedUser } from '../helpers/rbac/user.factory';
import type {
  CreateSimulationDto,
  SimulationStatsDto,
  SimulationResultsResponseDto,
  SimulationListResponseDto,
  CreateSimulationResponseDto,
  ExcludedTypeProps,
} from '../../src/services/simulation/dto/simulation.dto';

describe('SimulationService', () => {
  let service: SimulationService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

  const makeUser = makeAuthenticatedUser;

  const mockStats: SimulationStatsDto = {
    success: true,
    total_no_of_records: 100,
    records_evaluated: 90,
    alerts_generated: 10,
    alerts_not_generated: 80,
    run_date_time: '2026-01-01 10:00',
    replay_duration: '2m 15s',
  };

  const mockResults: SimulationResultsResponseDto = {
    success: true,
    data: [],
    total: 0,
    limit: 10,
    offset: 0,
  };

  const mockList: SimulationListResponseDto = {
    simulations: [],
    total: 0,
    limit: 10,
    offset: 0,
    pages: 0,
  };

  const mockCreateResponse: CreateSimulationResponseDto = {
    success: true,
    message: 'Simulation sim001 created successfully',
    simulation_id: 'sim001',
  };

  const mockExcludedTypes: ExcludedTypeProps = {
    success: 'true',
    excludedTypes: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationService,
        {
          provide: AdminServiceClient,
          useValue: {
            getAllSimulations: jest.fn(),
            createSimulation: jest.fn(),
            getExcludedTypes: jest.fn(),
            getSimulationStats: jest.fn(),
            getSimulationResults: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SimulationService>(SimulationService);
    adminServiceClient = module.get(AdminServiceClient);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getAllSimulations ────────────────────────────────────────────────────

  describe('getAllSimulations', () => {
    it('should return a paginated list of simulations', async () => {
      const user = makeUser();
      adminServiceClient.getAllSimulations.mockResolvedValue(mockList);

      const result = await service.getAllSimulations(0, 10, user);

      expect(result).toEqual(mockList);
      expect(adminServiceClient.getAllSimulations).toHaveBeenCalledWith(0, 10, user.token.tokenString);
    });

    it('should pass offset and limit to adminServiceClient', async () => {
      const user = makeUser();
      adminServiceClient.getAllSimulations.mockResolvedValue(mockList);

      await service.getAllSimulations(2, 25, user);

      expect(adminServiceClient.getAllSimulations).toHaveBeenCalledWith(2, 25, user.token.tokenString);
    });

    it('should log and rethrow error on failure', async () => {
      const user = makeUser();
      const error = new Error('Upstream unavailable');
      adminServiceClient.getAllSimulations.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.getAllSimulations(0, 10, user)).rejects.toThrow('Upstream unavailable');
      expect(loggerSpy).toHaveBeenCalledWith('Error fetching simulations: Upstream unavailable');
    });
  });

  // ─── createSimulation ────────────────────────────────────────────────────

  describe('createSimulation', () => {
    const createDto: CreateSimulationDto = {
      simulation_id: 'sim001',
      total_record: 100,
      sim_status: 'RUNNING',
    };

    it('should create a simulation and return the response', async () => {
      const user = makeUser();
      adminServiceClient.createSimulation.mockResolvedValue(mockCreateResponse);

      const result = await service.createSimulation(createDto, user);

      expect(result).toEqual(mockCreateResponse);
      expect(adminServiceClient.createSimulation).toHaveBeenCalledWith(createDto, user.token.tokenString);
    });

    it('should pass the correct token to adminServiceClient', async () => {
      const user = { ...makeUser(), token: { tokenString: 'custom-token', tenantId: 'tenant-1' } as any };
      adminServiceClient.createSimulation.mockResolvedValue(mockCreateResponse);

      await service.createSimulation(createDto, user);

      expect(adminServiceClient.createSimulation).toHaveBeenCalledWith(createDto, 'custom-token');
    });

    it('should log and rethrow error on failure', async () => {
      const user = makeUser();
      const error = new Error('Create failed');
      adminServiceClient.createSimulation.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.createSimulation(createDto, user)).rejects.toThrow('Create failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error creating simulation: Create failed');
    });
  });

  // ─── excludedTypes ───────────────────────────────────────────────────────

  describe('excludedTypes', () => {
    it('should return excluded types', async () => {
      adminServiceClient.getExcludedTypes.mockResolvedValue(mockExcludedTypes);

      const result = await service.excludedTypes('test-token');

      expect(result).toEqual(mockExcludedTypes);
      expect(adminServiceClient.getExcludedTypes).toHaveBeenCalledWith('test-token');
    });

    it('should return excluded types with entries', async () => {
      const withEntries: ExcludedTypeProps = {
        success: 'true',
        excludedTypes: [
          { masking_id: 'mask-1', txtp: 'pain.001', txtp_version: '11', record_status: 'active' },
        ],
      };
      adminServiceClient.getExcludedTypes.mockResolvedValue(withEntries);

      const result = await service.excludedTypes('test-token');

      expect(result.excludedTypes).toHaveLength(1);
      expect(result.excludedTypes[0].masking_id).toBe('mask-1');
    });

    it('should log and rethrow error on failure', async () => {
      const error = new Error('Types fetch failed');
      adminServiceClient.getExcludedTypes.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.excludedTypes('test-token')).rejects.toThrow('Types fetch failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error fetching excluded types: Types fetch failed');
    });
  });

  // ─── getSimulationStats ──────────────────────────────────────────────────

  describe('getSimulationStats', () => {
    it('should return simulation stats', async () => {
      const user = makeUser();
      adminServiceClient.getSimulationStats.mockResolvedValue(mockStats);

      const result = await service.getSimulationStats('sim001', '1', user);

      expect(result).toEqual(mockStats);
      expect(adminServiceClient.getSimulationStats).toHaveBeenCalledWith('sim001', '1', user.token.tokenString);
    });

    it('should pass sim and iterationNo to adminServiceClient', async () => {
      const user = makeUser();
      adminServiceClient.getSimulationStats.mockResolvedValue(mockStats);

      await service.getSimulationStats('sim015', '3', user);

      expect(adminServiceClient.getSimulationStats).toHaveBeenCalledWith('sim015', '3', user.token.tokenString);
    });

    it('should log and rethrow error on failure', async () => {
      const user = makeUser();
      const error = new Error('Stats unavailable');
      adminServiceClient.getSimulationStats.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.getSimulationStats('sim001', '1', user)).rejects.toThrow('Stats unavailable');
      expect(loggerSpy).toHaveBeenCalledWith('Error fetching simulation stats: Stats unavailable');
    });
  });

  // ─── getSimulationResults ────────────────────────────────────────────────

  describe('getSimulationResults', () => {
    it('should return simulation results without filters', async () => {
      const user = makeUser();
      adminServiceClient.getSimulationResults.mockResolvedValue(mockResults);

      const result = await service.getSimulationResults('sim001', '1', 10, 0, {}, user);

      expect(result).toEqual(mockResults);
      expect(adminServiceClient.getSimulationResults).toHaveBeenCalledWith(
        'sim001',
        '1',
        10,
        0,
        user.token.tokenString,
        {},
      );
    });

    it('should forward all filters to adminServiceClient', async () => {
      const user = makeUser();
      const filters = { msg_id: 'msg-001', msg_type: 'pacs.008', outcome: 'Hit' };
      adminServiceClient.getSimulationResults.mockResolvedValue(mockResults);

      await service.getSimulationResults('sim001', '1', 10, 0, filters, user);

      expect(adminServiceClient.getSimulationResults).toHaveBeenCalledWith(
        'sim001',
        '1',
        10,
        0,
        user.token.tokenString,
        filters,
      );
    });

    it('should return paginated data with correct total', async () => {
      const user = makeUser();
      const pagedResults: SimulationResultsResponseDto = {
        success: true,
        data: [
          {
            msg_id: 'msg-001',
            msg_type: 'pacs.008',
            outcome: 'Hit',
            time: '2026-01-01T10:00:00Z',
            triggered_rules: [],
            triggered_typologies: [],
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      };
      adminServiceClient.getSimulationResults.mockResolvedValue(pagedResults);

      const result = await service.getSimulationResults('sim001', '1', 10, 0, {}, user);

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].msg_id).toBe('msg-001');
    });

    it('should log and rethrow error on failure', async () => {
      const user = makeUser();
      const error = new Error('Results query failed');
      adminServiceClient.getSimulationResults.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.getSimulationResults('sim001', '1', 10, 0, {}, user)).rejects.toThrow('Results query failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error fetching simulation results: Results query failed');
    });
  });
});

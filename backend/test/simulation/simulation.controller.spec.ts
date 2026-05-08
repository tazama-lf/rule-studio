import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SimulationController } from '../../src/services/simulation/simulation.controller';
import { SimulationService } from '../../src/services/simulation/simulation.service';
import { makeAuthenticatedUser } from '../helpers/rbac/user.factory';
import type {
  SimulationListResponseDto,
  CreateSimulationDto,
  CreateSimulationResponseDto,
  ExcludedTypeProps,
  SimulationStatsDto,
  SimulationResultsResponseDto,
} from '../../src/services/simulation/dto/simulation.dto';

describe('SimulationController', () => {
  let controller: SimulationController;
  let service: jest.Mocked<SimulationService>;

  const makeUser = makeAuthenticatedUser;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimulationController],
      providers: [
        {
          provide: SimulationService,
          useValue: {
            getAllSimulations: jest.fn(),
            createSimulation: jest.fn(),
            excludedTypes: jest.fn(),
            getSimulationStats: jest.fn(),
            getSimulationResults: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SimulationController>(SimulationController);
    service = module.get(SimulationService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── getAllSimulations ────────────────────────────────────────────────────

  describe('getAllSimulations', () => {
    it('should delegate to SimulationService and return results', async () => {
      const user = makeUser();
      service.getAllSimulations.mockResolvedValue(mockList);

      const result = await controller.getAllSimulations(0, 10, user);

      expect(result).toEqual(mockList);
      expect(service.getAllSimulations).toHaveBeenCalledWith(0, 10, user);
    });

    it('should pass offset and limit correctly', async () => {
      const user = makeUser();
      service.getAllSimulations.mockResolvedValue(mockList);

      await controller.getAllSimulations(3, 20, user);

      expect(service.getAllSimulations).toHaveBeenCalledWith(3, 20, user);
    });
  });

  // ─── createSimulation ────────────────────────────────────────────────────

  describe('createSimulation', () => {
    const createDto: CreateSimulationDto = {
      simulation_id: 'sim001',
      total_record: 100,
      sim_status: 'RUNNING',
    };

    it('should delegate to SimulationService and return the created simulation', async () => {
      const user = makeUser();
      service.createSimulation.mockResolvedValue(mockCreateResponse);

      const result = await controller.createSimulation(createDto, user);

      expect(result).toEqual(mockCreateResponse);
      expect(service.createSimulation).toHaveBeenCalledWith(createDto, user);
    });
  });

  // ─── getExcludedTypes ────────────────────────────────────────────────────

  describe('getExcludedTypes', () => {
    it('should delegate to SimulationService using the user token', async () => {
      const user = makeUser();
      service.excludedTypes.mockResolvedValue(mockExcludedTypes);

      const result = await controller.getExcludedTypes(user);

      expect(result).toEqual(mockExcludedTypes);
      expect(service.excludedTypes).toHaveBeenCalledWith(user.token.tokenString);
    });
  });

  // ─── getSimulationStats ──────────────────────────────────────────────────

  describe('getSimulationStats', () => {
    it('should throw BadRequestException when sim is empty', async () => {
      const user = makeUser();

      await expect(controller.getSimulationStats('', '1', user)).rejects.toThrow(BadRequestException);
      await expect(controller.getSimulationStats('', '1', user)).rejects.toThrow(
        '`sim` query parameter is required.',
      );
    });

    it('should throw BadRequestException when sim is whitespace only', async () => {
      const user = makeUser();

      await expect(controller.getSimulationStats('   ', '1', user)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when iteration_no is empty', async () => {
      const user = makeUser();

      await expect(controller.getSimulationStats('sim001', '', user)).rejects.toThrow(BadRequestException);
      await expect(controller.getSimulationStats('sim001', '', user)).rejects.toThrow(
        '`iteration_no` query parameter is required.',
      );
    });

    it('should throw BadRequestException when iteration_no is whitespace only', async () => {
      const user = makeUser();

      await expect(controller.getSimulationStats('sim001', '  ', user)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when iteration_no is non-numeric', async () => {
      const user = makeUser();

      await expect(controller.getSimulationStats('sim001', 'abc', user)).rejects.toThrow(BadRequestException);
      await expect(controller.getSimulationStats('sim001', 'abc', user)).rejects.toThrow(
        '`iteration_no` must be a numeric string.',
      );
    });

    it('should throw BadRequestException for iteration_no with mixed characters', async () => {
      const user = makeUser();

      await expect(controller.getSimulationStats('sim001', '1a', user)).rejects.toThrow(BadRequestException);
    });

    it('should normalize sim to lowercase and trimmed before calling service', async () => {
      const user = makeUser();
      service.getSimulationStats.mockResolvedValue(mockStats);

      await controller.getSimulationStats('  SIM001  ', '1', user);

      expect(service.getSimulationStats).toHaveBeenCalledWith('sim001', '1', user);
    });

    it('should trim iteration_no before calling service', async () => {
      const user = makeUser();
      service.getSimulationStats.mockResolvedValue(mockStats);

      await controller.getSimulationStats('sim001', '2', user);

      expect(service.getSimulationStats).toHaveBeenCalledWith('sim001', '2', user);
    });

    it('should return stats from SimulationService', async () => {
      const user = makeUser();
      service.getSimulationStats.mockResolvedValue(mockStats);

      const result = await controller.getSimulationStats('sim001', '1', user);

      expect(result).toEqual(mockStats);
    });
  });

  // ─── getSimulationResults ────────────────────────────────────────────────

  describe('getSimulationResults', () => {
    it('should throw BadRequestException when sim is empty', async () => {
      const user = makeUser();

      await expect(
        controller.getSimulationResults('', '1', 10, 0, undefined, undefined, undefined, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when iteration_no is empty', async () => {
      const user = makeUser();

      await expect(
        controller.getSimulationResults('sim001', '', 10, 0, undefined, undefined, undefined, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when iteration_no is non-numeric', async () => {
      const user = makeUser();

      await expect(
        controller.getSimulationResults('sim001', 'xyz', 10, 0, undefined, undefined, undefined, user),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.getSimulationResults('sim001', 'xyz', 10, 0, undefined, undefined, undefined, user),
      ).rejects.toThrow('`iteration_no` must be a numeric string.');
    });

    it('should throw BadRequestException when outcome is invalid', async () => {
      const user = makeUser();

      await expect(
        controller.getSimulationResults('sim001', '1', 10, 0, undefined, undefined, 'Invalid', user),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.getSimulationResults('sim001', '1', 10, 0, undefined, undefined, 'Invalid', user),
      ).rejects.toThrow('`outcome` must be "Hit" or "No-Hit".');
    });

    it('should accept "Hit" as a valid outcome', async () => {
      const user = makeUser();
      service.getSimulationResults.mockResolvedValue(mockResults);

      await expect(
        controller.getSimulationResults('sim001', '1', 10, 0, undefined, undefined, 'Hit', user),
      ).resolves.not.toThrow();
    });

    it('should accept "No-Hit" as a valid outcome', async () => {
      const user = makeUser();
      service.getSimulationResults.mockResolvedValue(mockResults);

      await expect(
        controller.getSimulationResults('sim001', '1', 10, 0, undefined, undefined, 'No-Hit', user),
      ).resolves.not.toThrow();
    });

    it('should normalize sim to lowercase and trimmed', async () => {
      const user = makeUser();
      service.getSimulationResults.mockResolvedValue(mockResults);

      await controller.getSimulationResults('  SIM001  ', '1', 10, 0, undefined, undefined, undefined, user);

      expect(service.getSimulationResults).toHaveBeenCalledWith(
        'sim001',
        '1',
        10,
        0,
        expect.objectContaining({}),
        user,
      );
    });

    it('should pass filters to the service', async () => {
      const user = makeUser();
      service.getSimulationResults.mockResolvedValue(mockResults);

      await controller.getSimulationResults('sim001', '1', 10, 0, 'msg-001', 'pacs.008', 'Hit', user);

      expect(service.getSimulationResults).toHaveBeenCalledWith(
        'sim001',
        '1',
        10,
        0,
        { msg_id: 'msg-001', msg_type: 'pacs.008', outcome: 'Hit' },
        user,
      );
    });

    it('should exclude undefined filters from the params object', async () => {
      const user = makeUser();
      service.getSimulationResults.mockResolvedValue(mockResults);

      await controller.getSimulationResults('sim001', '1', 10, 0, undefined, undefined, undefined, user);

      const callArgs = service.getSimulationResults.mock.calls[0];
      const filters = callArgs[4] as Record<string, unknown>;

      expect(filters.msg_id).toBeUndefined();
      expect(filters.msg_type).toBeUndefined();
      expect(filters.outcome).toBeUndefined();
    });

    it('should return results from SimulationService', async () => {
      const user = makeUser();
      service.getSimulationResults.mockResolvedValue(mockResults);

      const result = await controller.getSimulationResults(
        'sim001', '1', 10, 0, undefined, undefined, undefined, user,
      );

      expect(result).toEqual(mockResults);
    });
  });
});

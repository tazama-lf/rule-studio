import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { RunSimulationController } from '../../src/services/simulation-studio/generation-engine/run-simulation.controller';
import { RunSimulationService } from '../../src/services/simulation-studio/generation-engine/run-simulation.service';
import { GenerationsService } from '../../src/services/simulation-studio/generations/generations.service';
import type { RunSimulationDto, RunSimulationResponseDto } from '../../src/services/simulation-studio/generation-engine/dto/run-simulation.dto';
import type { SuiteGenerationResponseDto } from '../../src/services/simulation-studio/generations/dto/generations.dto';
import type { AuthenticatedUser } from '../../src/services/auth/auth.types';

const mockUser = {
  token: { tokenString: 'test-token' },
  tenantId: 'test-tenant',
} as AuthenticatedUser;

const mockBody: RunSimulationDto = { suiteId: 10, generationId: 1 };

const mockRunResponse: RunSimulationResponseDto = { success: true, results: [] };

const mockClonedGeneration: SuiteGenerationResponseDto = {
  success: true,
  data: {
    id: 99,
    suite_id: 10,
    generation_number: 2,
    status: 'DRAFT',
    simulation_type: 'SINGLE_RULE',
    wizard_snapshot: {},
    generation_metadata: {},
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
};

describe('RunSimulationController', () => {
  let controller: RunSimulationController;
  let runSimulationService: jest.Mocked<RunSimulationService>;
  let generationsService: jest.Mocked<GenerationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RunSimulationController],
      providers: [
        {
          provide: RunSimulationService,
          useValue: { runSimulation: jest.fn() },
        },
        {
          provide: GenerationsService,
          useValue: { cloneGeneration: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<RunSimulationController>(RunSimulationController);
    runSimulationService = module.get(RunSimulationService);
    generationsService = module.get(GenerationsService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('runSimulation', () => {
    it('delegates to RunSimulationService with token and body', async () => {
      runSimulationService.runSimulation.mockResolvedValue(mockRunResponse);

      const result = await controller.runSimulation(mockBody, mockUser);

      expect(result).toEqual(mockRunResponse);
      expect(runSimulationService.runSimulation).toHaveBeenCalledWith('test-token', 'test-tenant', mockBody);
    });
  });

  describe('rerunGeneration', () => {
    it('clones generation then runs simulation with cloned generation id', async () => {
      generationsService.cloneGeneration.mockResolvedValue(mockClonedGeneration);
      runSimulationService.runSimulation.mockResolvedValue(mockRunResponse);

      const result = await controller.rerunGeneration(mockBody, mockUser);

      expect(result).toEqual(mockRunResponse);
      expect(generationsService.cloneGeneration).toHaveBeenCalledWith('test-token', 1);
      expect(runSimulationService.runSimulation).toHaveBeenCalledWith('test-token', 'test-tenant', {
        suiteId: 10,
        generationId: 99,
      });
    });

    it('uses cloned id (99) not original id (1) for runSimulation', async () => {
      generationsService.cloneGeneration.mockResolvedValue(mockClonedGeneration);
      runSimulationService.runSimulation.mockResolvedValue(mockRunResponse);

      await controller.rerunGeneration(mockBody, mockUser);

      const callArgs = runSimulationService.runSimulation.mock.calls[0][2] as RunSimulationDto;
      expect(callArgs.generationId).toBe(99);
      expect(callArgs.generationId).not.toBe(1);
    });

    it('propagates clone error', async () => {
      generationsService.cloneGeneration.mockRejectedValue(new Error('Clone failed'));

      await expect(controller.rerunGeneration(mockBody, mockUser)).rejects.toThrow('Clone failed');
      expect(runSimulationService.runSimulation).not.toHaveBeenCalled();
    });
  });
});

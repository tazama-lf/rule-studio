import { Body, Controller, Headers, Post } from '@nestjs/common';
import { RerunSimulationService } from './rerun-simulation.service';
import { RerunSimulationRequestDto } from './dto/rerun-simulation.dto';
import type { RerunSimulationResponseDto } from './dto/rerun-simulation.dto';

@Controller('simulation')
export class RerunSimulationController {
  constructor(private readonly rerunSimulationService: RerunSimulationService) {}

  @Post('rerun')
  async rerun(
    @Body() body: RerunSimulationRequestDto,
    @Headers('authorization') authorization: string,
  ): Promise<RerunSimulationResponseDto> {
    return this.rerunSimulationService.rerunSimulation(body.tableName, authorization);
  }
}

import { Controller, Post, HttpException, HttpStatus } from '@nestjs/common';
import { SendToDemsService, SimulationResult } from './send-to-dems.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SimulationResultDto } from './dto/send-to-dems.dto';

@ApiTags('DEMS Simulation')
@Controller('send-to-dems')
export class SendToDemsController {
  constructor(private readonly sendToDemsService: SendToDemsService) {}

  @Post('simulate')
  @ApiOperation({
    summary: 'Start the full simulation',
    description: 'Sends all messages to DEMS Dev endpoint one by one with proper time intervals',
  })
  @ApiResponse({
    status: 200,
    description: 'Simulation completed successfully',
    type: SimulationResultDto,
  })
  @ApiResponse({ status: 500, description: 'Simulation failed' })
  async startSimulation(): Promise<SimulationResult> {
    try {
      return await this.sendToDemsService.startSimulation();
    } catch (error) {
      throw new HttpException(`Simulation failed: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

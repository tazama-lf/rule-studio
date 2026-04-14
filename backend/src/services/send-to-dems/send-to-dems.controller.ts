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
    description: 'Simulation completed successfully - all messages delivered',
    type: SimulationResultDto,
  })
  @ApiResponse({
    status: 207,
    description: 'Simulation completed with some failures - partial success',
    type: SimulationResultDto,
  })
  @ApiResponse({ status: 500, description: 'Simulation failed completely' })
  async startSimulation(): Promise<SimulationResult> {
    try {
      const result = await this.sendToDemsService.startSimulation();
      
      if (result.failedMessages > 0) {
        if (result.deliveredMessages === 0) {
          throw new HttpException({
            message: `Simulation failed completely: all ${result.totalMessages} message(s) failed to be delivered`,
            result: result
          }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        
        throw new HttpException({
          message: `Simulation completed with ${result.failedMessages} failed message(s) out of ${result.totalMessages}`,
          result: result
        }, HttpStatus.MULTI_STATUS);
      }
      
      return result;
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.MULTI_STATUS) {
        throw error; 
      }
      
      throw new HttpException(`Simulation failed completely: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

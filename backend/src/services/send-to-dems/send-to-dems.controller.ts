import { Controller, Get, Post, Param, HttpException, HttpStatus } from '@nestjs/common';
import { SendToDemsService, SimulationResult, MessageDeliveryStatus } from './send-to-dems.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SimulationResultDto, MessageDeliveryStatusDto, SimulationInfoDto } from './dto/send-to-dems.dto';

@ApiTags('DEMS Simulation')
@Controller('send-to-dems')
export class SendToDemsController {
  constructor(private readonly sendToDemsService: SendToDemsService) {}

  @Get('messages')
  @ApiOperation({ summary: 'Get dummy messages used for simulation' })
  @ApiResponse({ status: 200, description: 'Returns the dummy JSON objects' })
  getDummyMessages(): Record<string, unknown> {
    return this.sendToDemsService.getDummyMessages();
  }

  @Get('info')
  @ApiOperation({ summary: 'Get simulation information and statistics' })
  @ApiResponse({ status: 200, description: 'Returns simulation configuration and message overview', type: SimulationInfoDto })
  getSimulationInfo(): Record<string, unknown> {
    return this.sendToDemsService.getSimulationInfo();
  }

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

  @Post('send/:messageId')
  @ApiOperation({
    summary: 'Send a single message by ID',
    description: 'Send a specific message to DEMS Dev endpoint for testing',
  })
  @ApiParam({ name: 'messageId', description: 'ID of the message to send', example: 'msg_001' })
  @ApiResponse({
    status: 200,
    description: 'Message sent successfully',
    type: MessageDeliveryStatusDto,
  })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 500, description: 'Failed to send message' })
  async sendSingleMessage(@Param('messageId') messageId: string): Promise<MessageDeliveryStatus> {
    try {
      return await this.sendToDemsService.sendSingleMessage(messageId);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(`Failed to send message: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

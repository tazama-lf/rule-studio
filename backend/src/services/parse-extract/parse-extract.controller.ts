import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { TazamaClaims, RequireAnyClaims } from '../../decorators/auth.decorator';
import { ParseExtractService } from './parse-extract.service';
import { type TransactionalMessage, type ParseExtractResponse, TransactionalMessageDto, ParseExtractResponseDto } from './dto/message.dto';

@ApiTags('Parse & Extract')
@ApiBearerAuth('JWT-auth')
@Controller('parse')
@UseGuards(TazamaAuthGuard)
export class ParseExtractController {
  private readonly logger = new Logger(ParseExtractController.name);

  constructor(private readonly parseExtractService: ParseExtractService) {}

  @Post('/api/validatePayload')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate ISO 20022 payload',
    description: 'Validates and processes ISO 20022 transactional message payloads for structure and content compliance',
  })
  @ApiBody({
    description: 'ISO 20022 transactional message',
    type: TransactionalMessageDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Payload validated successfully',
    type: ParseExtractResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid payload structure' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async processTransactionalMessage(@Body() request: TransactionalMessage, @User() user: AuthenticatedUser): Promise<ParseExtractResponse> {
    this.logger.log(`Processing transaction type: ${request.TxTp}`);

    return await this.parseExtractService.processTransactionalMessage(request, user.token.tokenString);
  }
}

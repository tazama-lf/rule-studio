import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { TazamaClaims, RequireAnyClaims } from '../../decorators/auth.decorator';
import { ParseExtractService } from './parse-extract.service';
import type { TransactionalMessage, ParseExtractResponse } from './dto/message.dto';

@ApiTags('Parse & Extract')
@ApiBearerAuth('JWT-auth')
@Controller('parse')
@UseGuards(TazamaAuthGuard)
export class ParseExtractController {
  private readonly logger = new Logger(ParseExtractController.name);
  
  constructor(private readonly parseExtractService: ParseExtractService) {}

  @Post('/api/validatePayload')
  @RequireAnyClaims(
    TazamaClaims.EDITOR,
    TazamaClaims.APPROVER,
    TazamaClaims.PUBLISHER,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Validate ISO 20022 payload', 
    description: 'Validates and processes ISO 20022 transactional message payloads for structure and content compliance' 
  })
  @ApiBody({ 
    description: 'ISO 20022 transactional message',
    schema: {
      type: 'object',
      properties: {
        TxTp: { 
          type: 'string', 
          description: 'Transaction type',
          example: 'pain.001.001.11' 
        },
        FIToFICstmrCdtTrf: {
          type: 'object',
          description: 'ISO 20022 message payload',
          properties: {
            GrpHdr: {
              type: 'object',
              properties: {
                MsgId: { type: 'string', example: 'MSG-001' },
                CreDtTm: { type: 'string', example: '2024-01-16T10:30:00Z' },
                NbOfTxs: { type: 'string', example: '1' }
              }
            }
          }
        }
      },
      required: ['TxTp']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Payload validated successfully',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean', example: true },
        errors: { type: 'array', items: { type: 'string' } },
        parsedData: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid payload structure' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async processTransactionalMessage(
    @Body() request: TransactionalMessage,
    @User() user: AuthenticatedUser,
  ): Promise<ParseExtractResponse> {
    this.logger.log(`Processing transaction type: ${request.TxTp} for user: ${user.validated}`);
    
    return await this.parseExtractService.processTransactionalMessage(
      request,
      user.token.tokenString,
    );
  }
}
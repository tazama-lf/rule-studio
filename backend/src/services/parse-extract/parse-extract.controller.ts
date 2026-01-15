import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { TazamaClaims, RequireAnyClaims } from '../../decorators/auth.decorator';
import { ParseExtractService } from './parse-extract.service';
import type { TransactionalMessage, ParseExtractResponse } from './dto/message.dto';

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
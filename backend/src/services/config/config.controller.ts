import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ConfigService } from './config.service';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import {
  RequireAnyClaims,
  TazamaClaims,
} from '../../decorators/auth.decorator';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@ApiTags('Configuration')
@ApiBearerAuth('JWT-auth')
@Controller('config')
@UseGuards(TazamaAuthGuard)
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('/api/transaction-types')
  @RequireAnyClaims(
    TazamaClaims.EDITOR,
    TazamaClaims.APPROVER,
    TazamaClaims.PUBLISHER,
  )
  @ApiOperation({
    summary: 'Get transaction types',
    description:
      'Retrieve all available ISO 20022 transaction types from the configuration service',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction types retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['pain.001.001.11', 'pacs.008.001.10', 'pacs.002.001.12'],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getTransactionTypes(
    @User() user: AuthenticatedUser,
  ): Promise<string[]> {
    return await this.configService.getTransactionTypes(user.token.tokenString);
  }

  // at this point, we need another API to get all versions for a transaction type
  @Get('/api/versions/:transactionType')
  @RequireAnyClaims(
    TazamaClaims.EDITOR,
    TazamaClaims.APPROVER,
    TazamaClaims.PUBLISHER,
  )
  @ApiOperation({
    summary: 'Get versions by transaction type',
    description:
      'Retrieve all available versions for a specific transaction type',
  })
  @ApiParam({
    name: 'transactionType',
    description: 'ISO 20022 transaction type',
    example: 'pain.001.001.11',
  })
  @ApiResponse({
    status: 200,
    description: 'Versions retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['09', '10', '11'],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getVersionsByTransactionType(
    @Param('transactionType') transactionType: string,
    @User() user: AuthenticatedUser,
  ): Promise<string[]> {
    console.log(
      'Controller --> Fetching versions for transaction type:',
      transactionType,
    );
    return await this.configService.getVersionsOfTransactionType(
      transactionType,
      user.token.tokenString,
    );
  }

  @Get('/api/payload/:transactionType')
  @RequireAnyClaims(
    TazamaClaims.EDITOR,
    TazamaClaims.APPROVER,
    TazamaClaims.PUBLISHER,
  )
  @ApiOperation({
    summary: 'Get payload schema by transaction type',
    description:
      'Retrieve the payload schema structure for a specific transaction type',
  })
  @ApiParam({
    name: 'transactionType',
    description: 'ISO 20022 transaction type',
    example: 'pain.001.001.11',
  })
  @ApiResponse({
    status: 200,
    description: 'Payload schema retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        TxTp: { type: 'string', example: 'pain.001.001.11' },
        TenantId: { type: 'string', example: 'tenant-001' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getPayloadByTransactionType(
    @Param('transactionType') transactionType: string,
    @User() user: AuthenticatedUser,
  ): Promise<any> {
    const response = await this.configService.getPayloadByTransactionType(
      transactionType,
      user.token.tokenString,
    );

    return {
      ...response,
      TxTp: transactionType,
      TenantId: user.token.tenantId,
    };
  }
}

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ConfigService } from './config.service';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import { RequireAnyClaims, TazamaClaims } from '../../decorators/auth.decorator';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { EndpointKey } from 'src/utils/rbac/rbacHelper';
import { TransactionTypeDto } from './dto/config.dto';

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
    TazamaClaims.DATA_ENGINEER_EDITOR,
    TazamaClaims.DATA_ENGINEER_APPROVER,
  )
  @ApiOperation({
    summary: 'Get transaction types',
    description: 'Retrieve all available ISO 20022 transaction types from the configuration service',
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
  async getTransactionTypes(@User() user: AuthenticatedUser): Promise<TransactionTypeDto[]> {
    const endpointKey = 'GET /config/api/transaction-types' as EndpointKey;

    return await this.configService.getTransactionTypes(user, endpointKey);
  }

  // at this point, we need another API to get all versions for a transaction type
  @Get('/api/versions/:transactionType')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER, TazamaClaims.DATA_ENGINEER_EDITOR)
  @ApiOperation({
    summary: 'Get versions by transaction type',
    description: 'Retrieve all available versions for a specific transaction type',
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
    const endpointKey = 'GET /config/api/versions/:transactionType' as EndpointKey;

    return await this.configService.getVersionsOfTransactionType(transactionType, user, endpointKey);
  }

  @Get('/api/payload/:transactionType/:transactionVersion')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER, TazamaClaims.DATA_ENGINEER_EDITOR)
  @ApiOperation({
    summary: 'Get payload schema by transaction type',
    description: 'Retrieve the payload schema structure for a specific transaction type',
  })
  @ApiParam({
    name: 'transactionType',
    description: 'ISO 20022 transaction type',
    example: 'pain.001.001.11',
  })
  @ApiParam({
    name: 'transactionVersion',
    description: 'Version of the ISO 20022 transaction type',
    example: '11',
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
    @Param('transactionVersion') transactionVersion: string,
    @User() user: AuthenticatedUser,
  ): Promise<Record<string, unknown>> {
    const endpointKey = 'GET /config/api/payload/:transactionType/:transactionVersion' as EndpointKey;

    const response = await this.configService.getPayloadByTransactionType(transactionType, transactionVersion, user, endpointKey);

    return {
      ...response,
    };
  }
}

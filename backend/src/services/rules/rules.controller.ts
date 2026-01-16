import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Get,
  Query,
  Put,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
// import { StatusValidationGuard } from '../../guards/status-validation.guard';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { TazamaClaims, RequireAnyClaims } from '../../decorators/auth.decorator';
import { RulesService } from './rules.service';
import { Rules, CreateRuleFlowDto, ResponseRuleFlowDto, GlobalVariableDto } from './dto/rules.dto';

@ApiTags('Rules')
@ApiBearerAuth('JWT-auth')
@Controller('rules')
@UseGuards(TazamaAuthGuard)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}
 @Get('/api/status')
  @RequireAnyClaims(
    TazamaClaims.EDITOR,
    TazamaClaims.APPROVER,
    TazamaClaims.PUBLISHER,
  )
  @ApiOperation({ 
    summary: 'Get available rule statuses', 
    description: 'Retrieves available rule statuses based on user role and permissions' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rule statuses retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['ACTIVE', 'INACTIVE', 'TESTING']
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getRulesStatus(
    @User() user: AuthenticatedUser,
  ): Promise<string[]> {
    return await this.rulesService.getRulesStatusbyRole(
      user.token.tokenString,
    );
  }

  @Post('/api/all')
  // @UseGuards(StatusValidationGuard)
  @RequireAnyClaims(
    TazamaClaims.EDITOR,
    TazamaClaims.APPROVER,
    TazamaClaims.PUBLISHER,
  )
  @ApiOperation({ 
    summary: 'Get all rules (paginated)', 
    description: 'Retrieves paginated list of rules with optional filters for status, transaction type, etc.' 
  })
  @ApiQuery({ name: 'offset', required: true, type: String, description: 'Starting position (0-based index)' })
  @ApiQuery({ name: 'limit', required: true, type: String, description: 'Number of records per page' })
  @ApiBody({ 
    required: false,
    description: 'Optional filters for rule search',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ACTIVE' },
        txtp: { type: 'string', example: 'pain.001.001.11' },
        publishing_status: { type: 'string', example: 'PUBLISHED' },
        rule_id: { type: 'string', example: 'RULE-001' },
        rule_name: { type: 'string', example: 'High Value Check' }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rules retrieved successfully',
    type: [Rules]
  })
  @ApiResponse({ status: 400, description: 'Invalid pagination parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getAllRules(
    @Query('offset') offset: string,
    @Query('limit') limit: string,
    @User() user: AuthenticatedUser,
    @Body() filters?: Record<string, unknown>,
  ): Promise<Rules[]> {
    return await this.rulesService.getAllRules(
      parseInt(offset, 10),
      parseInt(limit, 10),
      filters ?? {},
      user.token.tokenString,
    );
  }

  // get rule IDs
  @Get('/api/ids')
  @RequireAnyClaims(
    TazamaClaims.EDITOR,
    TazamaClaims.APPROVER,
    TazamaClaims.PUBLISHER,
  )
  @ApiOperation({ 
    summary: 'Get rule IDs', 
    description: 'Retrieves all available rule IDs for the authenticated user' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rule IDs retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'object' },
      example: [{ id: 'RULE-001', name: 'High Value Check' }]
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getRuleIds(
    @User() user: AuthenticatedUser,
  ): Promise<any[]> {
    console.log("Fetching rule IDs for user:", user.validated);
    return await this.rulesService.getRuleIds(
      user.token.tokenString,
    );
  }

  // create a new rule
  @Post('/api/create')
  @RequireAnyClaims(TazamaClaims.EDITOR)
  @ApiOperation({ 
    summary: 'Create new rule', 
    description: 'Creates a new transaction rule for fraud detection, AML, or compliance monitoring' 
  })
  @ApiBody({ 
    type: Rules,
    description: 'Rule data for creation'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Rule created successfully',
    type: Rules 
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or rule already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor permissions required' })
  async createRule(
    @Body() ruleData: Rules,
    @User() user: AuthenticatedUser,
  ): Promise<Rules> {
    console.log('Creating rule with data:', ruleData);
    console.log('User info:', user.validated);
    return await this.rulesService.createRule(
      ruleData,
      user.token.tokenString,
    );
  }

  // get rule configuration by rule ID
  @Get('/api/configuration/:ruleId')
  @RequireAnyClaims(
    TazamaClaims.EDITOR,
    TazamaClaims.APPROVER,
    TazamaClaims.PUBLISHER,
  )
  @ApiOperation({ 
    summary: 'Get rule configuration', 
    description: 'Retrieves configuration details for a specific rule by rule ID' 
  })
  @ApiParam({ name: 'ruleId', description: 'Rule identifier', example: 'high-value-transfer-001' })
  @ApiResponse({ 
    status: 200, 
    description: 'Rule configuration retrieved successfully',
    schema: { type: 'object' }
  })
  @ApiResponse({ status: 404, description: 'Rule configuration not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getRuleConfiguration(
    @Param('ruleId') ruleId: string,
    @User() user: AuthenticatedUser,
  ): Promise<any> {
    return await this.rulesService.getRuleConfiguration(
      ruleId,
      user.token.tokenString,
    );
  }

  // update an existing rule
  @Put('/api/:ruleId')
  @RequireAnyClaims(TazamaClaims.EDITOR)
  @ApiOperation({ 
    summary: 'Update existing rule', 
    description: 'Updates an existing rule with partial data (only provided fields will be updated)' 
  })
  @ApiParam({ name: 'ruleId', description: 'Rule identifier to update', example: 'high-value-transfer-001' })
  @ApiBody({ 
    description: 'Partial rule data for update',
    schema: {
      type: 'object',
      properties: {
        description: { type: 'string', example: 'Updated: Enhanced fraud detection rule' },
        version: { type: 'string', example: '1.1.0' },
        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'TESTING'] }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rule updated successfully',
    type: Rules 
  })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor permissions required' })
  async updateRule(
    @Param('ruleId') ruleId: string,
    @Body() updateData: Partial<Rules>,
    @User() user: AuthenticatedUser,
  ): Promise<Rules> {
    return await this.rulesService.updateRule(
      ruleId,
      updateData,
      user.token.tokenString,
    );
  }

  // get rule by ID
  @Get('/api/:id')
  @RequireAnyClaims(
    TazamaClaims.EDITOR,
    TazamaClaims.APPROVER,
    TazamaClaims.PUBLISHER,
  )
  @ApiOperation({ 
    summary: 'Get rule by numeric ID', 
    description: 'Retrieves a specific rule by its numeric database ID' 
  })
  @ApiParam({ name: 'id', description: 'Numeric rule ID (integer)', example: 1, type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Rule retrieved successfully',
    type: Rules
  })
  @ApiResponse({ status: 400, description: 'Invalid ID format (must be numeric)' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getRulesById(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser,
  ): Promise<Rules> {
    console.log(`Fetching rule with ID: ${id} for user:`, user.validated);
    return await this.rulesService.getRulesById(
      id,
      user.tenantId,
      user.token.tokenString,
    );
  }

  // get active network map
  @Get('/api/network-map/active')
  @RequireAnyClaims(
    TazamaClaims.EDITOR,
    TazamaClaims.APPROVER,
    TazamaClaims.PUBLISHER,
  )
  @ApiOperation({ 
    summary: 'Get active network map', 
    description: 'Retrieves the active network map configuration showing rule relationships and processing flow' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Active network map retrieved successfully',
    schema: {
      type: 'object',
      description: 'Network map object showing rule relationships'
    }
  })
  @ApiResponse({ status: 404, description: 'No active network map found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getActiveNetworkMap(
    @User() user: AuthenticatedUser,
  ): Promise<any> {
    return await this.rulesService.getActiveNetworkMap(
      user.token.tokenString,
    );
  }

  @Post('/api/:ruleId/flow')
  @RequireAnyClaims(
    TazamaClaims.EDITOR,
    TazamaClaims.APPROVER,
    TazamaClaims.PUBLISHER,
  )
  @ApiOperation({ 
    summary: 'Create rule flow', 
    description: 'Creates a new flow configuration for a specific rule with nodes and connections' 
  })
  @ApiParam({ name: 'ruleId', description: 'Rule identifier', example: 'high-value-transfer-001' })
  @ApiBody({ 
    description: 'Flow configuration with nodes and edges',
    schema: {
      type: 'object',
      properties: {
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'start' },
              type: { type: 'string', example: 'input' },
              position: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } } }
            }
          }
        },
        edges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'e1' },
              source: { type: 'string', example: 'start' },
              target: { type: 'string', example: 'process' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Rule flow created successfully',
    type: ResponseRuleFlowDto
  })
  @ApiResponse({ status: 400, description: 'Invalid flow configuration' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async createRuleFlow(@Param('ruleId') ruleId: string, @Body() flowData: JSON, @User() user: AuthenticatedUser): Promise<ResponseRuleFlowDto> {
    return await this.rulesService.createRuleFlow(ruleId, flowData, user.token.tokenString);
  }

  @Get('/api/:ruleId/flow')
  @RequireAnyClaims(
    TazamaClaims.EDITOR,
    TazamaClaims.APPROVER,
    TazamaClaims.PUBLISHER,
  )
  @ApiOperation({ 
    summary: 'Get rule flow', 
    description: 'Retrieves the flow configuration for a specific rule showing nodes and connections' 
  })
  @ApiParam({ name: 'ruleId', description: 'Rule identifier', example: 'high-value-transfer-001' })
  @ApiResponse({ 
    status: 200, 
    description: 'Rule flow retrieved successfully',
    type: ResponseRuleFlowDto
  })
  @ApiResponse({ status: 404, description: 'Rule flow not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getRuleFlow(@Param('ruleId') ruleId: string,@User() user: AuthenticatedUser,): Promise<ResponseRuleFlowDto> {
    const result = await this.rulesService.getRuleFlow(ruleId,user.token.tokenString,);
    return result;
  }

  @Put('/api/:ruleId/flow')
  @RequireAnyClaims(TazamaClaims.EDITOR)
  @ApiOperation({ 
    summary: 'Update rule flow', 
    description: 'Updates the flow configuration for a specific rule with new nodes and connections' 
  })
  @ApiParam({ name: 'ruleId', description: 'Rule identifier', example: 'high-value-transfer-001' })
  @ApiBody({ 
    description: 'Updated flow configuration',
    schema: {
      type: 'object',
      properties: {
        nodes: { type: 'array', description: 'Array of flow nodes' },
        edges: { type: 'array', description: 'Array of node connections' }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rule flow updated successfully',
    type: ResponseRuleFlowDto
  })
  @ApiResponse({ status: 400, description: 'Invalid flow configuration' })
  @ApiResponse({ status: 404, description: 'Rule flow not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor permissions required' })
  async updateRuleFlow(
    @Param('ruleId') ruleId: string,
    @Body() flowData: JSON,
    @User() user: AuthenticatedUser,
  ): Promise<ResponseRuleFlowDto> {
    return await this.rulesService.updateRuleFlow(ruleId, flowData, user.token.tokenString);
  }
 

  @Get('/api/global-variables/:ruleId')
  @RequireAnyClaims(
    TazamaClaims.EDITOR,
    TazamaClaims.APPROVER,
    TazamaClaims.PUBLISHER,
  )
  @ApiOperation({ 
    summary: 'Get global variables for rule', 
    description: 'Retrieves global variables available for a specific rule configuration' 
  })
  @ApiParam({ name: 'ruleId', description: 'Rule identifier', example: 'high-value-transfer-001' })
  @ApiResponse({ 
    status: 200, 
    description: 'Global variables retrieved successfully',
    type: GlobalVariableDto
  })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getGlobalVariables(
    @Param('ruleId') ruleId: string,
    @User() user: AuthenticatedUser,
  ): Promise<GlobalVariableDto> {
    return await this.rulesService.getGlobalVariables(
      ruleId,
      user.tenantId,
      user.token.tokenString,
    );
  }

  // Creating a new API for cloning an exising rule
  @Post('/api/clone/:ruleId')
  @RequireAnyClaims(TazamaClaims.EDITOR)
  @ApiOperation({ 
    summary: 'Clone existing rule', 
    description: 'Creates a copy of an existing rule for modification and customization' 
  })
  @ApiParam({ name: 'ruleId', description: 'Source rule identifier to clone', example: 'high-value-transfer-001' })
  @ApiResponse({ 
    status: 201, 
    description: 'Rule cloned successfully',
    type: Rules
  })
  @ApiResponse({ status: 404, description: 'Source rule not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor permissions required' })
  async cloneRule(
    @Param('ruleId') ruleId: string,
    @User() user: AuthenticatedUser, // ismei se i can take out tenantId
  ): Promise<Rules> {
    console.log('Cloning rule with ID:', ruleId);
    console.log('User info:', user.validated);
    return await this.rulesService.cloneRule(
      ruleId,
      user.token.tokenString,
    );
  }

  // update the status of a rule based on rule ID
  @Put('/api/:ruleId/status')
  @RequireAnyClaims(TazamaClaims.EDITOR)
  @RequireAnyClaims(TazamaClaims.APPROVER)
  @RequireAnyClaims(TazamaClaims.PUBLISHER)
  @ApiOperation({ 
    summary: 'Update rule status', 
    description: 'Updates the activation status of a specific rule with reason for change' 
  })
  @ApiParam({ name: 'ruleId', description: 'Rule identifier', example: 'high-value-transfer-001' })
  @ApiBody({ 
    description: 'Status update with reason',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'string', 
          example: 'active',
          description: 'New status for the rule'
        },
        reason: { 
          type: 'string', 
          example: 'Updated compliance requirements',
          description: 'Reason for status change'
        }
      },
      required: ['status', 'reason']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rule status updated successfully',
    type: Rules
  })
  @ApiResponse({ status: 400, description: 'Invalid status or missing reason' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Multiple role permissions required' })
  async updateRuleStatus(
    @Param('ruleId') ruleId: string,
    @Body() body: { status: string; reason: string },
    @User() user: AuthenticatedUser,
  ): Promise<Rules> {
    return await this.rulesService.updateRuleStatus(
      ruleId,
      body.status,
      body.reason,
      user.token.tokenString,
    );
  }

  
}

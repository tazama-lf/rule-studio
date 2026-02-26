import { Body, Controller, Get, Post, Query, UseGuards, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import { NodesService } from './nodes.service';
import { CreateNodeDto, RequestQueryNodeDto, ResponseNodesDto, ResponseQueryNodeDto } from './dto';
import { RequireAnyClaims, TazamaClaims } from '../../decorators/auth.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { User } from '../../decorators/user.decorator';
import type { GetNodesQuery } from './interfaces/node.interface';
import { Audit } from '../../decorators/audit.decorator';

@ApiTags('Nodes')
@ApiBearerAuth('JWT-auth')
@Controller('nodes')
@UseGuards(TazamaAuthGuard)
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @ApiOperation({
    summary: 'Create node',
    description: 'Creates one or more new nodes in the system for transaction processing',
  })
  @Post('/create')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @Audit() // Audit node creation actions
  @ApiBody({ type: [CreateNodeDto] })
  @ApiResponse({
    status: 201,
    description: 'Nodes created successfully',
    type: [ResponseNodesDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async createNode(@Body() createNodeDto: CreateNodeDto[], @User() user: AuthenticatedUser): Promise<ResponseNodesDto[]> {
    return await this.nodesService.createNode(user.token.tokenString, createNodeDto);
  }

  @ApiOperation({
    summary: 'Get all nodes',
    description: 'Retrieves all nodes with optional query parameters for filtering, sorting and pagination',
  })
  @Get()
  @RequireAnyClaims(
    TazamaClaims.EDITOR,
    TazamaClaims.APPROVER,
    TazamaClaims.PUBLISHER,
  )
  @Audit() // Audit retrieval of nodes (important for monitoring access to critical data)
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of nodes to return',
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Starting position for pagination',
    example: 0,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: 'Filter nodes by type',
    example: 'function',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter nodes by category',
    example: 'rule_builder',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort nodes by specified field',
    example: 'created_at',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    description: 'Sort order: asc or desc',
    example: 'asc',
  })
  @ApiResponse({
    status: 200,
    description: 'Nodes retrieved successfully',
    type: [ResponseNodesDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getAllNodes(@Query() query: GetNodesQuery, @User() user: AuthenticatedUser): Promise<ResponseNodesDto[]> {
    return await this.nodesService.getAllNodes(user.token.tokenString, query);
  }

  @Delete(':nodeId')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @Audit() // Audit node deletion actions (critical)
  @ApiOperation({
    summary: 'Delete node by ID',
    description: 'Deletes a specific node by its unique identifier',
  })
  @ApiParam({
    name: 'nodeId',
    description: 'Unique node identifier',
    example: '12',
  })
  @ApiResponse({
    status: 200,
    description: 'Node deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Node not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async deleteNodeById(@Param('nodeId') nodeId: string, @User() user: AuthenticatedUser): Promise<{ success: boolean; message: string }> {
    return await this.nodesService.deleteNodeById(nodeId, user.token.tokenString);
  }

  @Post('execute-query')
  @RequireAnyClaims(
    TazamaClaims.EDITOR,
    TazamaClaims.APPROVER,
    TazamaClaims.PUBLISHER,
  )
  @Audit() // Audit execution of query nodes (important for monitoring and debugging)
  @ApiOperation({
    summary: 'Execute query node',
    description: 'Executes a query node and returns the result',
  })
  @ApiBody({ type: RequestQueryNodeDto })
  @ApiResponse({
    status: 200,
    description: 'Query executed successfully',
    type: ResponseQueryNodeDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameter' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async executeQueryNode(@Body() body: RequestQueryNodeDto, @User() user: AuthenticatedUser): Promise<ResponseQueryNodeDto> {
    return await this.nodesService.executeQueryNode(user.token.tokenString, body);
  }
}

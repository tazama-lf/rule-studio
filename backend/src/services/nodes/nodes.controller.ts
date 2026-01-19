import { Body, Controller, Get, Post, Query, UseGuards, Delete } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { TazamaAuthGuard } from "../../guards/tazama-auth.guard";
import { NodesService } from "./nodes.service";
import { ResponseNodesDto } from "./dto";
import { RequireAnyClaims, TazamaClaims } from "../../decorators/auth.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { User } from "../../decorators/user.decorator";
import type { GetNodesQuery } from "./interfaces/node.interface";

@ApiTags('Nodes')
@ApiBearerAuth('JWT-auth')
@Controller('nodes')
@UseGuards(TazamaAuthGuard)
export class NodesController {
    constructor(private readonly nodesService: NodesService) { }

    @Post('/create')
    @RequireAnyClaims(
        TazamaClaims.EDITOR,
        TazamaClaims.APPROVER,
        TazamaClaims.PUBLISHER,
    )
    @ApiOperation({ 
        summary: 'Create node', 
        description: 'Creates one or more new nodes in the system for transaction processing' 
    })
    @ApiBody({ 
        description: 'Array of node objects to create',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'node-001' },
                    type: { type: 'string', example: 'processor' },
                    name: { type: 'string', example: 'Transaction Validator' },
                    description: { type: 'string', example: 'Validates incoming transactions' },
                    config: { type: 'object', example: { timeout: 5000, retries: 3 } }
                }
            }
        }
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Nodes created successfully',
        type: [ResponseNodesDto] 
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    async createNode(@Body() createNodeDto: Record<string, unknown>[], @User() user: AuthenticatedUser): Promise<ResponseNodesDto[]> {
        return await this.nodesService.createNode(user.token.tokenString, createNodeDto);
    }

    @Get('')
    @RequireAnyClaims(
        TazamaClaims.EDITOR,
        TazamaClaims.APPROVER,
        TazamaClaims.PUBLISHER,
    )
    @ApiOperation({ 
        summary: 'Get all nodes', 
        description: 'Retrieves all nodes with optional query parameters for filtering and pagination' 
    })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of nodes to return' })
    @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Starting position for pagination' })
    @ApiResponse({ 
        status: 200, 
        description: 'Nodes retrieved successfully',
        type: [ResponseNodesDto] 
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    async getAllNodes(@Query() query: GetNodesQuery, @User() user: AuthenticatedUser): Promise<ResponseNodesDto[]> {
        return await this.nodesService.getAllNodes(user.token.tokenString, query);
    }

    @Delete(':nodeId')
    @RequireAnyClaims(
        TazamaClaims.EDITOR,
        TazamaClaims.APPROVER,
        TazamaClaims.PUBLISHER,
    )
    @ApiOperation({ 
        summary: 'Delete node by ID', 
        description: 'Deletes a specific node by its unique identifier' 
    })
    @ApiParam({ name: 'nodeId', description: 'Unique node identifier', example: 'node-001' })
    @ApiQuery({ name: 'nodeId', description: 'Node ID (also required as query parameter)', example: 'node-001' })
    @ApiResponse({ 
        status: 200, 
        description: 'Node deleted successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Node deleted successfully' }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Node not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    async deleteNodeById(@Query('nodeId') nodeId: string, @User() user: AuthenticatedUser): Promise<{ success: boolean; message: string }> {
        return await this.nodesService.deleteNodeById(nodeId, user.token.tokenString);
    }
}
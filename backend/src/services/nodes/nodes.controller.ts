import { Body, Controller, Get, Post, Query, UseGuards, Delete } from "@nestjs/common";
import { TazamaAuthGuard } from "../../guards/tazama-auth.guard";
import { NodesService } from "./nodes.service";
import { ResponseNodesDto } from "./dto";
import { RequireAnyClaims, TazamaClaims } from "../../decorators/auth.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { User } from "../../decorators/user.decorator";
import type { GetNodesQuery } from "./interfaces/node.interface";

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
    async createNode(@Body() createNodeDto: Record<string, unknown>[], @User() user: AuthenticatedUser): Promise<ResponseNodesDto[]> {
        try {
            return await this.nodesService.createNode(user.token.tokenString, createNodeDto);
        } catch (error) {
            throw error;
        }
    }

    @Get('')
    @RequireAnyClaims(
        TazamaClaims.EDITOR,
        TazamaClaims.APPROVER,
        TazamaClaims.PUBLISHER,
    )
    async getAllNodes(@Query() query: GetNodesQuery, @User() user: AuthenticatedUser): Promise<ResponseNodesDto[]> {
        try {
            return await this.nodesService.getAllNodes(user.token.tokenString, query);
        } catch (error) {
            throw error;
        }
    }

    @Delete(':nodeId')
    @RequireAnyClaims(
        TazamaClaims.EDITOR,
        TazamaClaims.APPROVER,
        TazamaClaims.PUBLISHER,
    )
    async deleteNodeById(@Query('nodeId') nodeId: string, @User() user: AuthenticatedUser): Promise<{ success: boolean; message: string }> {
        try {
            return await this.nodesService.deleteNodeById(nodeId, user.token.tokenString);
        } catch (error) {
            throw error;
        }
    }
}
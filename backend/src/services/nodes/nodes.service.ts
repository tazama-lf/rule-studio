import { Injectable, Logger } from "@nestjs/common";
import { CreateNodeDto, ResponseNodesDto } from "./dto";
import { AdminServiceClient } from "../admin-service-client";
import { GetNodesQuery } from "./interfaces/node.interface";

@Injectable()
export class NodesService {
    private readonly logger = new Logger(NodesService.name);
    constructor(
        private readonly adminServiceClient: AdminServiceClient,
    ) { }

    async createNode(token: string, createNodeDto: Record<string, unknown>[]): Promise<ResponseNodesDto[]> {
        try {
            return await this.adminServiceClient.createNode(token, createNodeDto);
        } catch (error) {
            const err = error as Error;
            console.log('Error creating node:', err);
            this.logger.error(`Error creating node: ${err.message}`);
            throw error;
        }
    }

    async getAllNodes(token: string, query: GetNodesQuery): Promise<ResponseNodesDto[]> {
        try {
            return await this.adminServiceClient.getAllNodes(token, query);
        } catch (error) {
            const err = error as Error;
            this.logger.error(`Error retrieving nodes: ${err.message}`);
            throw error;
        }
    }

    async deleteNodeById(nodeId: string, token: string): Promise<{ success: boolean; message: string }> {
        try {
            return await this.adminServiceClient.deleteNodeByNodeId(nodeId, token);
        } catch (error) {
            const err = error as Error;
            this.logger.error(`Error deleting node with ID ${nodeId}: ${err.message}`);
            throw error;
        }
    }
}
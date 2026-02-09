import { Injectable, Logger } from '@nestjs/common';
import {
  CreateNodeDto,
  RequestQueryNodeDto,
  ResponseNodesDto,
  ResponseQueryNodeDto,
} from './dto';
import { AdminServiceClient } from '../admin-service-client';
import { GetNodesQuery } from './interfaces/node.interface';
import { decryptData } from 'src/utils/helperFunction';

@Injectable()
export class NodesService {
  private readonly logger = new Logger(NodesService.name);
  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async createNode(
    token: string,
    createNodeDto: CreateNodeDto[],
  ): Promise<ResponseNodesDto[]> {
    try {
      return await this.adminServiceClient.createNode(token, createNodeDto);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error creating node: ${err.message}`);
      throw error;
    }
  }

  async getAllNodes(
    token: string,
    query: GetNodesQuery,
  ): Promise<ResponseNodesDto[]> {
    try {
      return await this.adminServiceClient.getAllNodes(token, query);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error retrieving nodes: ${err.message}`);
      throw error;
    }
  }

  async deleteNodeById(
    nodeId: string,
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.adminServiceClient.deleteNodeByNodeId(nodeId, token);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error deleting node with ID ${nodeId}: ${err.message}`,
      );
      throw error;
    }
  }

  async executeQueryNode(
    token: string,
    data: RequestQueryNodeDto,
  ): Promise<ResponseQueryNodeDto> {
    try {
      const decryptedQuery = decryptData(data.query);
      return await this.adminServiceClient.executeQueryNode(token, { ...data, query: decryptedQuery });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error executing query node: ${err.message}`);
      throw error;
    }
  }
}

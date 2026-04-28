import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../admin-service-client';
import { ExcludedTypeProps } from './dto/rule-simulation.dto';

@Injectable()
export class RuleSimulationService {

    private readonly logger = new Logger(RuleSimulationService.name);

    constructor(private readonly adminServiceClient: AdminServiceClient) { }

    async excludedTypes(token: string): Promise<ExcludedTypeProps[]> {
        try {
            const response = await this.adminServiceClient.getExcludedTypes(token);
            return response
        } catch (error) {
            const err = error as Error;
            this.logger.error(`Error fetching excluded types: ${err.message}`);
            throw error;
        }
    }
}

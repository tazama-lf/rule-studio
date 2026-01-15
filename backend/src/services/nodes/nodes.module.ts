import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminServiceClient } from '../admin-service-client';
import { NodesController } from './nodes.controller';
import { NodesService } from './nodes.service';

@Module({
    imports: [HttpModule],
    controllers: [NodesController],
    providers: [NodesService, AdminServiceClient],
    exports: [NodesService],
})
export class NodesModule { }

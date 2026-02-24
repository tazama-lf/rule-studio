import { Injectable, Inject } from '@nestjs/common';
import type { IAuditService } from '@tazama-lf/audit-lib';
import { randomUUID } from 'node:crypto';

interface AuditExecutionOptions {
    eventType: string;
    actorId: string;
    actorRole: string;
    actorName: string;
    resourceType: string;
    resourceId?: string;
    sourceIp: string;
    description: string;
    tenantId: string;
    actionPerformed?: Record<string, unknown>;
}

@Injectable()
export class AuditExecutorService {
    constructor(
        @Inject('AUDIT_LOGGER')
        private readonly auditService: IAuditService,
    ) { }

    async execute<T>(
        options: AuditExecutionOptions,
        operation: () => Promise<T>,
    ): Promise<T> {

        const correlationId = randomUUID();
        const startTime = Date.now();

        // 🔹 INTENT
        await this.auditService.log({
            correlationId,
            eventPhase: 'INTENT',
            ...options,
        });

        try {
            const result = await operation();

            // 🔹 SUCCESS
            await this.auditService.log({
                correlationId,
                eventPhase: 'SUCCESS',
                ...options,
                durationMs: Date.now() - startTime,
            });

            return result;

        } catch (error) {

            // 🔹 FAILED
            await this.auditService.log({
                correlationId,
                eventPhase: 'FAILED',
                ...options,
                durationMs: Date.now() - startTime,
                outcome: {
                    errorMessage: (error as Error).message,
                },
            });

            throw error;
        }
    }
}
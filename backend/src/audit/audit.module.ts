import { Module, Global } from '@nestjs/common';
import { createAuditProvider } from '@tazama-lf/audit-lib';
import { AuditExecutorService } from './audit-executor.service';

/**
 * Global audit module that provides the AUDIT_LOGGER service
 * for use across the application with the AuditInterceptor
 */
@Global()
@Module({
  providers: [
    AuditExecutorService,
    // Audit logging provider for tracking critical user actions
    createAuditProvider('rule-studio-backend'),
  ],
  exports: [
    AuditExecutorService,
    // Export the AUDIT_LOGGER token so other modules can use it
    'AUDIT_LOGGER',
  ],
})
export class AuditModule {}

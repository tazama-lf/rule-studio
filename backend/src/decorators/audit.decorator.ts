import { UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from '../interceptors/audit.interceptor';

/**
 * Audit decorator for marking endpoints that require audit logging
 *
 * Usage:
 * @Audit()
 * @Post('/create')
 * async createResource() { ... }
 *
 * This decorator applies the AuditInterceptor to capture and log
 * critical user actions for compliance and security monitoring.
 */
export const Audit = (): ReturnType<typeof UseInterceptors> => UseInterceptors(AuditInterceptor);

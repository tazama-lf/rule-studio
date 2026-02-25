// import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject, Logger } from '@nestjs/common';
// import { randomUUID } from 'node:crypto';
// import { Observable } from 'rxjs';
// import { tap, catchError } from 'rxjs/operators';
// // import type { IAuditService, AuditLogData, AuditLogInput } from '@tazama-lf/audit-lib';
// import type { AuthenticatedUser } from '../services/auth/auth.types';
// import type { Request } from 'express';

// /**
//  * Audit interceptor for logging critical user actions
//  * Implements fire-and-forget pattern to ensure audit failures don't block operations
//  */
// @Injectable()
// export class AuditInterceptor implements NestInterceptor {
//   private readonly logger = new Logger(AuditInterceptor.name);

//   // constructor(@Inject('AUDIT_LOGGER') private readonly auditService: IAuditService) {}

//   /**
//    * Intercepts HTTP requests to critical endpoints and logs audit information
//    */
//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
//     const response = context.switchToHttp().getResponse<{ statusCode: number }>();
//     const { user } = request;
//     const startTime = Date.now();

//     // from request context
//     const baseAuditData = this.buildBaseAuditData(context, request, user);

//     return next.handle().pipe(
//       tap((responseData) => {
//         // log successful operation (fire-and-forget)
//         const auditData: AuditLogData = {
//           ...baseAuditData,
//           outcome: {
//             statusCode: response.statusCode,
//             executionTimeMs: Date.now() - startTime,
//             responseSize: JSON.stringify(responseData ?? {}).length,
//           },
//         };

//         this.logAuditAsync(auditData, 'SUCCESS');
//       }),
//       catchError((error) => {
//         // Log failed operation (fire-and-forget)
//         const auditData: AuditLogData = {
//           ...baseAuditData,
//           outcome: {
//             error: error.message,
//             statusCode: error.status ?? 500,
//             executionTimeMs: Date.now() - startTime,
//           },
//         };

//         this.logAuditAsync(auditData, 'FAILED');

//         // Re-throw the error - audit failure must not affect the main operation
//         throw new Error(error);
//       }),
//     );
//   }

//   /**
//    * Builds the base audit data from request context
//    * @private
//    */
//   private buildBaseAuditData(
//     context: ExecutionContext,
//     request: Request,
//     user?: AuthenticatedUser,
//   ): Omit<AuditLogData, 'status' | 'outcome'> {
//     const { method, url, body, params, query, headers } = request;
//     const handler = context.getHandler().name;
//     const controller = context.getClass().name;

//     return {
//       // User identification
//       actorId: user?.userId ?? 'anonymous',
//       actorRole: this.extractUserRole(user),
//       actorName: this.extractUserName(user),

//       // Resource information
//       resourceId: this.extractResourceId(request),
//       resourceType: this.mapControllerToResourceType(controller),

//       // Request metadata
//       sourceIp: this.extractSourceIp(request),
//       description: this.buildDescription(method, url, handler),
//       eventType: this.determineEventType(method, handler),
//       tenantId: user?.tenantId ?? 'default',

//       actionPerformed: {
//         method,
//         endpoint: url,
//         handler,
//         controller,
//         userAgent: headers['user-agent'],
//         requestBody: this.sanitizeRequestBody(body),
//         pathParameters: params,
//         queryParameters: query,
//         timestamp: new Date().toISOString(),
//       },
//     };
//   }

//   /**
//    * Extracts user role from authentication token
//    * @private
//    */
//   private extractUserRole(user?: AuthenticatedUser): string {
//     if (!user) return 'anonymous';

//     if (user.validClaims.length > 0) {
//       return user.validClaims[0];
//     }

//     if (user.token.claims.length > 0) {
//       return user.token.claims[0];
//     }

//     return 'user';
//   }

//   /**
//    * Extracts user display name from authentication token
//    * @private
//    */
//   private extractUserName(user?: AuthenticatedUser): string {
//     if (!user) return 'Anonymous User';

//     return user.userId;
//   }

//   /**
//    * Extracts resource ID from request parameters
//    * @private
//    */
//   private extractResourceId(request: Request): string | undefined {
//     const params = request.params as Record<string, string>;

//     // Common resource ID parameter names
//     return params.ruleId || params.nodeId || params.id || params.resourceId;
//   }

//   /**
//    * Maps controller class names to resource types
//    * @private
//    */
//   private mapControllerToResourceType(controllerName: string): string {
//     const resourceMapping: Record<string, string> = {
//       AuthController: 'authentication',
//       RulesController: 'rule',
//       NodesController: 'node',
//       ConfigController: 'configuration',
//       ParseExtractController: 'parse-extract',
//       SimulationLogsController: 'simulation-logs',
//     };

//     return resourceMapping[controllerName] ?? 'unknown';
//   }

//   /**
//    * Extracts the real client IP address
//    * @private
//    */
//   private extractSourceIp(request: Request): string {
//     // Check various headers for real IP (load balancer, proxy scenarios)
//     const xForwardedFor = request.headers['x-forwarded-for'] as string;
//     const xRealIp = request.headers['x-real-ip'] as string;

//     if (xForwardedFor) {
//       return xForwardedFor.split(',')[0].trim();
//     }

//     if (xRealIp) {
//       return xRealIp;
//     }

//     if (request.ip) {
//       return request.ip;
//     }

//     return request.socket.remoteAddress ?? 'unknown';
//   }

//   /**
//    * Builds human-readable description of the action
//    * @private
//    */
//   private buildDescription(method: string, url: string, handler: string): string {
//     const actionMap: Record<string, string> = {
//       login: 'User authentication attempt',
//       createRule: 'Created new rule',
//       updateRule: 'Modified existing rule',
//       updateRuleStatus: 'Changed rule status',
//       saveRuleFlow: 'Created rule flow',
//       updateRuleFlow: 'Modified rule flow',
//       cloneRule: 'Cloned existing rule',
//       createNodes: 'Created new nodes',
//       deleteNode: 'Deleted node',
//     };

//     return actionMap[handler] || `${method} request to ${url}`;
//   }

//   /**
//    * Determines the event type based on HTTP method and handler
//    * @private
//    */
//   private determineEventType(method: string, handler: string): string {
//     // Authentication events
//     if (handler.includes('login')) return 'authentication';

//     // CRUD operations
//     if (method === 'POST' || handler.includes('create')) return 'creation';
//     if (method === 'PUT' || handler.includes('update') || handler.includes('modify')) {
//       return 'modification';
//     }
//     if (method === 'DELETE' || handler.includes('delete')) return 'deletion';
//     if (handler.includes('clone')) return 'replication';

//     // Status changes are special modifications
//     if (handler.includes('status')) return 'status_change';

//     return 'access';
//   }

//   /**
//    * Removes sensitive information from request body
//    * @private
//    */
//   private sanitizeRequestBody(body: any): any {
//     if (!body || typeof body !== 'object') {
//       return body;
//     }

//     // Remove sensitive fields that should never be logged
//     const { password, token, secret, key, auth, credential, ...cleanBody } = body;

//     // Truncate large payloads to prevent storage bloat
//     const serialized = JSON.stringify(cleanBody);
//     if (serialized.length > 10000) {
//       return { _truncated: true, _originalSize: serialized.length };
//     }

//     return cleanBody;
//   }

//   /**
//    * Logs audit data asynchronously without blocking the main operation
//    * @private
//    */
//   private logAuditAsync(auditData: AuditLogData, eventPhase: 'INTENT' | 'SUCCESS' | 'FAILED'): void {
//     // Fire-and-forget: Don't await this promise
//     const auditInput: AuditLogInput = {
//       ...auditData,
//       correlationId: randomUUID(),
//       eventPhase,
//     };

//     this.auditService.log(auditInput).catch((error: unknown) => {
//       // Log audit service errors for monitoring but don't propagate
//       const errorMessage = error instanceof Error ? error.message : String(error);
//       this.logger.error(`Audit logging failed for ${auditData.eventType} by ${auditData.actorName}`, {
//         error: errorMessage,
//         auditData: {
//           eventType: auditData.eventType,
//           actorId: auditData.actorId,
//           resourceType: auditData.resourceType,
//           resourceId: auditData.resourceId,
//         },
//       });
//     });
//   }
// }

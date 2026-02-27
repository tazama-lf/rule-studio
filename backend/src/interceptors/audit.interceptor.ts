import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { type IAuditService, IAuditLogInput, EventPhase } from '@tazama-lf/audit-lib';
import type { AuthenticatedUser } from '../services/auth/auth.types';
import type { Request } from 'express';

/**
 * Audit interceptor for logging critical user actions
 * Implements fire-and-forget pattern to ensure audit failures don't block operations
 */
interface EventMetadata {
  description: string;
  eventType: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(@Inject('AUDIT_LOGGER') private readonly auditService: IAuditService) { }

  /**
   * Intercepts HTTP requests to critical endpoints and logs audit information
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    this.logger.log('AuditInterceptor triggered');
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const response = context.switchToHttp().getResponse<{ statusCode: number }>();
    const { user } = request;
    const startTime = Date.now();

    const correlationId = randomUUID();

    const baseAuditData = this.buildBaseAuditData(context, request, user);

    this.logAuditAsync(baseAuditData, EventPhase.INTENT, correlationId);

    return next.handle().pipe(
      tap((responseData) => {
        const auditData = {
          ...baseAuditData,
          outcome: {
            statusCode: response.statusCode,
            executionTimeMs: Date.now() - startTime,
            responseSize: JSON.stringify(responseData ?? {}).length,
          },
        };

        this.logAuditAsync(auditData, EventPhase.SUCCESS, correlationId);
      }),
      catchError((error) => {
        const auditData = {
          ...baseAuditData,
          outcome: {
            error: error.message,
            statusCode: error.status ?? 500,
            executionTimeMs: Date.now() - startTime,
          },
        };

        this.logAuditAsync(auditData, EventPhase.FAILED, correlationId);

        throw new Error(error);
      }),
    );
  }

  /**
   * Builds the base audit data from request context
   * @private
   */
  private buildBaseAuditData(
    context: ExecutionContext,
    request: Request,
    user?: AuthenticatedUser,
  ): Omit<IAuditLogInput, 'correlationId' | 'eventPhase' | 'outcome'> {
    const { method, url, body, params, query, headers } = request;
    const handler = context.getHandler().name;
    const controller = context.getClass().name;
    const eventMeta = this.buildEventMetadata(method, url, handler);

    return {
      // User identification
      actorId: user?.userId ?? 'anonymous',
      actorName: this.extractUserName(user),
      actorRole: this.extractUserRole(user),

      // Resource information
      resourceId: this.extractResourceId(request),
      resourceType: this.mapControllerToResourceType(controller),

      // Request metadata
      sourceIp: this.extractSourceIp(request),

      description: eventMeta.description,
      eventType: eventMeta.eventType,
      tenantId: user?.tenantId ?? 'default',

      actionPerformed: {
        method,
        endpoint: url,
        handler,
        controller,
        userAgent: headers['user-agent'],
        requestBody: this.sanitizeRequestBody(body),
        pathParameters: params,
        queryParameters: query,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Extracts user role from authentication token
   * @private
   */
  private extractUserRole(user?: AuthenticatedUser): string {
    if (!user) return 'anonymous';

    if (user.validClaims.length > 0) {
      return user.validClaims[0];
    }

    if (user.token.claims.length > 0) {
      return user.token.claims[0];
    }

    return 'user';
  }

  /**
   * Extracts user display name from authentication token
   * @private
   */
  private extractUserName(user?: AuthenticatedUser): string {
    if (!user) return 'Anonymous User';

    return user.userId;
  }

  /**
   * Extracts resource ID from request parameters
   * @private
   */
  private extractResourceId(request: Request): string | undefined {
    const params = request.params as Record<string, string>;

    // Common resource ID parameter names
    return params.ruleId || params.nodeId || params.id || params.resourceId;
  }

  /**
   * Maps controller class names to resource types
   * @private
   */
  private mapControllerToResourceType(controllerName: string): string {
    const resourceMapping: Record<string, string> = {
      AuthController: 'authentication',
      RulesController: 'rule',
      NodesController: 'node',
      ConfigController: 'configuration',
      ParseExtractController: 'parse-extract',
      SimulationLogsController: 'simulation-logs',
    };
    return resourceMapping[controllerName] ?? 'unknown';
  }

  /**
   * Extracts the real client IP address
   * @private
   */
  private extractSourceIp(request: Request): string {
    // Check various headers for real IP (load balancer, proxy scenarios)
    const xForwardedFor = request.headers['x-forwarded-for'] as string;
    const xRealIp = request.headers['x-real-ip'] as string;

    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }

    if (xRealIp) {
      return xRealIp;
    }

    if (request.ip) {
      return request.ip;
    }

    return request.socket.remoteAddress ?? 'unknown';
  }

  /**
   * Builds human-readable description of the action
   * @private
   */
  private buildEventMetadata(method: string, url: string, handler: string): EventMetadata {
    const actionMap: Record<string, EventMetadata | undefined> = {
      login: {
        description: 'User authentication attempt',
        eventType: 'USER_AUTHENTICATION_ATTEMPT',
      },

      getTransactionTypes: {
        description: 'Retrieved transaction types',
        eventType: 'TRANSACTION_TYPES_RETRIEVED',
      },

      getVersionsOfTransactionType: {
        description: 'Retrieved versions for transaction type',
        eventType: 'TRANSACTION_TYPE_VERSIONS_RETRIEVED',
      },

      getPayloadByTransactionType: {
        description: 'Retrieved payload for transaction type',
        eventType: 'TRANSACTION_TYPE_PAYLOAD_RETRIEVED',
      },

      createNode: {
        description: 'Created new node',
        eventType: 'NODE_CREATED',
      },

      getAllNodes: {
        description: 'Retrieved all nodes',
        eventType: 'NODES_RETRIEVED',
      },

      deleteNodeById: {
        description: 'Deleted node by ID',
        eventType: 'NODE_DELETED',
      },

      executeQueryNode: {
        description: 'Executed query node',
        eventType: 'NODE_QUERY_EXECUTED',
      },

      processTransactionalMessage: {
        description: 'Processed transactional message',
        eventType: 'TRANSACTIONAL_MESSAGE_PROCESSED',
      },

      getRulesStatus: {
        description: 'Retrieved rule statuses',
        eventType: 'RULE_STATUSES_RETRIEVED',
      },

      getAllRules: {
        description: 'Retrieved all rules',
        eventType: 'RULES_RETRIEVED',
      },

      getRuleIds: {
        description: 'Retrieved rule IDs',
        eventType: 'RULE_IDS_RETRIEVED',
      },

      createRule: {
        description: 'Created new rule',
        eventType: 'RULE_CREATED',
      },

      getRuleConfiguration: {
        description: 'Retrieved rule configuration',
        eventType: 'RULE_CONFIGURATION_RETRIEVED',
      },

      updateRule: {
        description: 'Modified existing rule',
        eventType: 'RULE_UPDATED',
      },

      getRulesById: {
        description: 'Retrieved rule by ID',
        eventType: 'RULE_RETRIEVED_BY_ID',
      },

      getActiveNetworkMap: {
        description: 'Retrieved active network map',
        eventType: 'ACTIVE_NETWORK_MAP_RETRIEVED',
      },

      createRuleFlow: {
        description: 'Created new rule flow',
        eventType: 'RULE_FLOW_CREATED',
      },

      getRuleFlow: {
        description: 'Retrieved rule flows',
        eventType: 'RULE_FLOW_RETRIEVED',
      },

      getRuleFlowStatus: {
        description: 'Retrieved rule flow statuses',
        eventType: 'RULE_FLOW_STATUSES_RETRIEVED',
      },

      updateRuleFlow: {
        description: 'Modified rule flow',
        eventType: 'RULE_FLOW_UPDATED',
      },

      getGlobalVariables: {
        description: 'Retrieved global variables',
        eventType: 'GLOBAL_VARIABLES_RETRIEVED',
      },

      cloneRule: {
        description: 'Cloned existing rule',
        eventType: 'RULE_CLONED',
      },

      updateRuleStatus: {
        description: 'Changed rule status',
        eventType: 'RULE_STATUS_CHANGED',
      },

      updateRuleMetadata: {
        description: 'Updated rule metadata',
        eventType: 'RULE_METADATA_UPDATED',
      },

      getSimulationLogs: {
        description: 'Retrieved simulation logs',
        eventType: 'SIMULATION_LOGS_RETRIEVED',
      },

      insertSimulationLogs: {
        description: 'Inserted simulation logs',
        eventType: 'SIMULATION_LOGS_INSERTED',
      },

    } as const satisfies Record<string, EventMetadata>;

    if (actionMap[handler]) { return actionMap[handler]; }

    return {
      description: `${method} request to ${url}`,
      eventType: 'UNKNOWN_EVENT',
    };
  }
  /**
   * Removes sensitive information from request body
   * @private
   */
  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    // Remove sensitive fields that should never be logged
    const { password, token, secret, key, auth, credential, ...cleanBody } = body as Record<string, unknown>;;

    // Truncate large payloads to prevent storage bloat
    const serialized = JSON.stringify(cleanBody);
    if (serialized.length > 10000) {
      return { _truncated: true, _originalSize: serialized.length };
    }
    return cleanBody;
  }
  /**
   * Logs audit data asynchronously without blocking the main operation
   * @private
   */
  private logAuditAsync(auditData: Omit<IAuditLogInput, 'correlationId' | 'eventPhase'>, eventPhase: EventPhase, correlationId: string,): void {
    const auditInput: IAuditLogInput = { ...auditData, correlationId, eventPhase, };

    this.auditService.log(auditInput).catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`Audit logging failed for ${auditData.eventType} by ${auditData.actorName}`,
        {
          error: errorMessage,
          eventPhase,
          correlationId,
        },
      );
    });
  }
}
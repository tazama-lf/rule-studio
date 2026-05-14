import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable, throwError } from 'rxjs';
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

  constructor(@Inject('AUDIT_LOGGER') private readonly auditService: IAuditService) {}

  /**
   * Intercepts HTTP requests to critical endpoints and logs audit information
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
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
        const resourceId = baseAuditData.resourceId ?? this.extractResourceIdFromResponse(responseData);

        const auditData = {
          ...baseAuditData,
          resourceId,
          outcome: {
            statusCode: response.statusCode,
            executionTimeMs: Date.now() - startTime,
          },
        };

        this.logAuditAsync(auditData, EventPhase.SUCCESS, correlationId);
      }),
      catchError((error: unknown) => {
        const auditData = {
          ...baseAuditData,
          outcome: {
            error: error instanceof Error ? error.message : String(error),
            statusCode: error instanceof Object && 'status' in error ? ((error as Record<string, unknown>).status as number) : 500,
            executionTimeMs: Date.now() - startTime,
          },
        };

        this.logAuditAsync(auditData, EventPhase.FAILED, correlationId);

        const errorToThrow = error instanceof Error ? error : new Error(String(error));
        return throwError(() => errorToThrow);
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
    const metaData = this.extractUpdateChanges(handler, body);

    return {
      actorId: user?.userId ?? 'anonymous',
      actorName: user?.actorName ?? user?.actorEmail ?? 'anonymous',
      actorRole: user?.actorRole ?? 'anonymous',
      resourceId: this.extractResourceIdFromRequest(request),
      resourceType: this.mapControllerToResourceType(controller),
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
        pathParameters: params,
        queryParameters: query,
        timestamp: new Date().toISOString(),
        ...(metaData && { metaData }),
      },
    };
  }

  /**
   * Extracts only safe, non-sensitive changed fields for update operations
   * @private
   */
  private pickDefinedFields(body: Record<string, unknown>, keys: string[]): Record<string, unknown> {
    const picked: Record<string, unknown> = {};
    keys.forEach((key) => {
      if (body[key] !== undefined) {
        picked[key] = body[key];
      }
    });
    return picked;
  }

  private extractUpdateChanges(handler: string, body: unknown): Record<string, unknown> | null {
    if (!body || typeof body !== 'object') return null;
    const b = body as Record<string, unknown>;
    const handlerFields: Partial<Record<string, string[]>> = {
      updateRule: ['description', 'version', 'status', 'publishing_status', 'rule_type', 'txtp', 'metadata'],
      updateRuleMetadata: ['description', 'version', 'status', 'publishing_status', 'rule_type', 'txtp', 'metadata'],
      updateRuleFlow: ['category', 'status'],
    };

    if (handler === 'updateRuleStatus') {
      return {
        status: b.status,
        ...this.pickDefinedFields(b, ['comment']),
      };
    }

    const keys = handlerFields[handler];
    if (!keys) return null;

    return this.pickDefinedFields(b, keys);
  }

  /**
   * Extracts resource ID from request parameters
   * @private
   */
  private extractResourceIdFromRequest(request: Request): string | undefined {
    const params = request.params as Record<string, string>;
    return params.ruleId || params.nodeId || params.id || params.resourceId;
  }

  /**
   * Extracts resource ID from response body (used for POST endpoints that return the created resource)
   * @private
   */
  private extractResourceIdFromResponse(responseData: unknown): string | undefined {
    if (!responseData || typeof responseData !== 'object') return undefined;
    const data = responseData as Record<string, unknown>;
    const id = data.id ?? data.rule_id ?? data.nodeId;
    return typeof id === 'string' ? id : undefined;
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
    const xForwardedForRaw = request.headers['x-forwarded-for'];
    const xRealIpRaw = request.headers['x-real-ip'];

    const xForwardedFor = Array.isArray(xForwardedForRaw) ? xForwardedForRaw[0] : xForwardedForRaw;
    if (xForwardedFor) return xForwardedFor.split(',')[0].trim();

    const xRealIp = Array.isArray(xRealIpRaw) ? xRealIpRaw[0] : xRealIpRaw;
    if (xRealIp) return xRealIp.trim();

    return request.ip ?? request.socket.remoteAddress ?? 'unknown';
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

      getVersionsByTransactionType: {
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

      getRuleById: {
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

    if (actionMap[handler]) {
      return actionMap[handler];
    }

    return {
      description: `${method} request to ${url}`,
      eventType: 'UNKNOWN_EVENT',
    };
  }

  /**
   * Logs audit data asynchronously without blocking the main operation
   * @private
   */
  private logAuditAsync(
    auditData: Omit<IAuditLogInput, 'correlationId' | 'eventPhase'>,
    eventPhase: EventPhase,
    correlationId: string,
  ): void {
    const auditInput: IAuditLogInput = { ...auditData, correlationId, eventPhase };

    this.auditService.log(auditInput).catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`Audit logging failed for ${auditData.eventType} by ${auditData.actorName}`, {
        error: errorMessage,
        eventPhase,
        correlationId,
      });
    });
  }
}

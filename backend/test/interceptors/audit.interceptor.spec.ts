import { Test, TestingModule } from '@nestjs/testing';
import { AuditInterceptor } from '../../src/interceptors/audit.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { EventPhase } from '@tazama-lf/audit-lib';
import type { AuthenticatedUser } from '../../src/services/auth/auth.types';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let mockAuditService: any;

  beforeEach(async () => {
    mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditInterceptor,
        {
          provide: 'AUDIT_LOGGER',
          useValue: mockAuditService,
        },
      ],
    }).compile();

    interceptor = module.get<AuditInterceptor>(AuditInterceptor);
  });

  const createMockContext = (
    method = 'GET',
    url = '/test',
    handler = 'testHandler',
    controller = 'TestController',
    user?: AuthenticatedUser,
  ): ExecutionContext => {
    const mockRequest = {
      method,
      url,
      body: {},
      params: {},
      query: {},
      headers: { 'user-agent': 'test-agent' },
      user,
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    };

    const mockResponse = {
      statusCode: 200,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getHandler: () => ({ name: handler }),
      getClass: () => ({ name: controller }),
    } as ExecutionContext;
  };

  const createMockCallHandler = (responseData?: any, error?: any): CallHandler => ({
    handle: () => (error ? throwError(() => error) : of(responseData)),
  });

  const createMockUser = (): AuthenticatedUser => ({
    token: {
      clientId: 'test-user',
      tenantId: 'tenant-1',
      claims: ['editor'],
      tokenString: 'mock-token',
      iss: 'test',
      sid: 'test-sid',
      exp: Date.now() + 3600000,
    },
    validated: { editor: true },
    validClaims: ['editor'],
    tenantId: 'tenant-1',
    userId: 'test-user',
    actorName: 'Test User',
    actorRole: 'editor',
    actorEmail: 'test@example.com',
    sourceIP: '127.0.0.1',
  });

  describe('Successful Requests', () => {
    it('should log INTENT and SUCCESS phases for successful request', (done) => {
      const context = createMockContext('POST', '/rules/api/create', 'createRule', 'RulesController', createMockUser());
      const callHandler = createMockCallHandler({ id: 1, name: 'test-rule' });

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual({ id: 1, name: 'test-rule' });
          expect(mockAuditService.log).toHaveBeenCalledTimes(2);

          // Check INTENT phase
          const intentCall = mockAuditService.log.mock.calls[0][0];
          expect(intentCall.eventPhase).toBe(EventPhase.INTENT);
          expect(intentCall.actorId).toBe('test-user');
          expect(intentCall.resourceType).toBe('rule');

          // Check SUCCESS phase
          const successCall = mockAuditService.log.mock.calls[1][0];
          expect(successCall.eventPhase).toBe(EventPhase.SUCCESS);
          expect(successCall.outcome.statusCode).toBe(200);
          expect(successCall.outcome.executionTimeMs).toBeGreaterThanOrEqual(0);

          done();
        },
      });
    });

    it('should handle anonymous users', (done) => {
      const context = createMockContext('GET', '/health');
      const callHandler = createMockCallHandler({ status: 'UP' });

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        next: () => {
          const intentCall = mockAuditService.log.mock.calls[0][0];
          expect(intentCall.actorId).toBe('anonymous');
          expect(intentCall.actorName).toBe('Anonymous User');
          expect(intentCall.actorRole).toBe('anonymous');

          done();
        },
      });
    });

    it('should extract resourceId from request params', (done) => {
      const mockRequest = {
        method: 'GET',
        url: '/rules/api/123',
        params: { ruleId: '123' },
        query: {},
        body: {},
        headers: { 'user-agent': 'test' },
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
        user: createMockUser(),
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => ({ statusCode: 200 }),
        }),
        getHandler: () => ({ name: 'getRulesById' }),
        getClass: () => ({ name: 'RulesController' }),
      } as ExecutionContext;

      const callHandler = createMockCallHandler({ id: '123' });
      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        next: () => {
          const intentCall = mockAuditService.log.mock.calls[0][0];
          expect(intentCall.resourceId).toBe('123');
          done();
        },
      });
    });
  });

  describe('Failed Requests', () => {
    it('should log INTENT and FAILED phases for failed request', (done) => {
      const context = createMockContext('POST', '/rules/api/create', 'createRule', 'RulesController', createMockUser());
      const error = new Error('Validation failed');
      (error as any).status = 400;
      const callHandler = createMockCallHandler(null, error);

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        error: (err) => {
          expect(err.message).toBe('Validation failed');
          expect(mockAuditService.log).toHaveBeenCalledTimes(2);

          // Check INTENT phase
          const intentCall = mockAuditService.log.mock.calls[0][0];
          expect(intentCall.eventPhase).toBe(EventPhase.INTENT);

          // Check FAILED phase
          const failedCall = mockAuditService.log.mock.calls[1][0];
          expect(failedCall.eventPhase).toBe(EventPhase.FAILED);
          expect(failedCall.outcome.error).toBe('Validation failed');
          expect(failedCall.outcome.statusCode).toBe(400);

          done();
        },
      });
    });

    it('should handle errors without status code', (done) => {
      const context = createMockContext('POST', '/rules/api/create');
      const error = new Error('Unknown error');
      const callHandler = createMockCallHandler(null, error);

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        error: () => {
          const failedCall = mockAuditService.log.mock.calls[1][0];
          expect(failedCall.outcome.statusCode).toBe(500);
          done();
        },
      });
    });

    it('should handle non-Error thrown values', (done) => {
      const context = createMockContext('POST', '/rules/api/create');
      const callHandler = createMockCallHandler(null, 'String error');

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(Error);
          const failedCall = mockAuditService.log.mock.calls[1][0];
          expect(failedCall.outcome.error).toBe('String error');
          done();
        },
      });
    });
  });

  describe('Event Metadata', () => {
    it('should map known handlers to event types', (done) => {
      const context = createMockContext('POST', '/auth/login', 'login', 'AuthController', createMockUser());
      const callHandler = createMockCallHandler({ token: 'abc' });

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        next: () => {
          const intentCall = mockAuditService.log.mock.calls[0][0];
          expect(intentCall.eventType).toBe('USER_AUTHENTICATION_ATTEMPT');
          expect(intentCall.description).toBe('User authentication attempt');
          done();
        },
      });
    });

    it('should use default event type for unknown handlers', (done) => {
      const context = createMockContext('GET', '/unknown', 'unknownHandler', 'UnknownController');
      const callHandler = createMockCallHandler({});

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        next: () => {
          const intentCall = mockAuditService.log.mock.calls[0][0];
          expect(intentCall.eventType).toBe('UNKNOWN_EVENT');
          expect(intentCall.description).toContain('GET request to /unknown');
          done();
        },
      });
    });
  });

  describe('Request Sanitization', () => {
    it('should remove sensitive fields from request body', (done) => {
      const mockRequest = {
        method: 'POST',
        url: '/auth/login',
        body: {
          username: 'test',
          password: 'secret123',
          token: 'abc',
          secret: 'xyz',
        },
        params: {},
        query: {},
        headers: { 'user-agent': 'test' },
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => ({ statusCode: 200 }),
        }),
        getHandler: () => ({ name: 'login' }),
        getClass: () => ({ name: 'AuthController' }),
      } as ExecutionContext;

      const callHandler = createMockCallHandler({});
      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        next: () => {
          const intentCall = mockAuditService.log.mock.calls[0][0];
          expect(intentCall.actionPerformed.requestBody).toEqual({ username: 'test' });
          expect(intentCall.actionPerformed.requestBody.password).toBeUndefined();
          expect(intentCall.actionPerformed.requestBody.token).toBeUndefined();
          done();
        },
      });
    });

    it('should truncate large request bodies', (done) => {
      const largeBody = { data: 'x'.repeat(15000) };
      const mockRequest = {
        method: 'POST',
        url: '/test',
        body: largeBody,
        params: {},
        query: {},
        headers: { 'user-agent': 'test' },
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => ({ statusCode: 200 }),
        }),
        getHandler: () => ({ name: 'test' }),
        getClass: () => ({ name: 'TestController' }),
      } as ExecutionContext;

      const callHandler = createMockCallHandler({});
      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        next: () => {
          const intentCall = mockAuditService.log.mock.calls[0][0];
          expect(intentCall.actionPerformed.requestBody._truncated).toBe(true);
          expect(intentCall.actionPerformed.requestBody._originalSize).toBeGreaterThan(10000);
          done();
        },
      });
    });
  });

  describe('IP Extraction', () => {
    it('should extract IP from x-forwarded-for header', (done) => {
      const mockRequest = {
        method: 'GET',
        url: '/test',
        body: {},
        params: {},
        query: {},
        headers: {
          'user-agent': 'test',
          'x-forwarded-for': '10.0.0.1, 192.168.1.1',
        },
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => ({ statusCode: 200 }),
        }),
        getHandler: () => ({ name: 'test' }),
        getClass: () => ({ name: 'TestController' }),
      } as ExecutionContext;

      const callHandler = createMockCallHandler({});
      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        next: () => {
          const intentCall = mockAuditService.log.mock.calls[0][0];
          expect(intentCall.sourceIp).toBe('10.0.0.1');
          done();
        },
      });
    });

    it('should extract IP from x-real-ip header when x-forwarded-for is absent', (done) => {
      const mockRequest = {
        method: 'GET',
        url: '/test',
        body: {},
        params: {},
        query: {},
        headers: {
          'user-agent': 'test',
          'x-real-ip': '10.0.0.2',
        },
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => ({ statusCode: 200 }),
        }),
        getHandler: () => ({ name: 'test' }),
        getClass: () => ({ name: 'TestController' }),
      } as ExecutionContext;

      const callHandler = createMockCallHandler({});
      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        next: () => {
          const intentCall = mockAuditService.log.mock.calls[0][0];
          expect(intentCall.sourceIp).toBe('10.0.0.2');
          done();
        },
      });
    });

    it('should fallback to request.ip when headers are absent', (done) => {
      const mockRequest = {
        method: 'GET',
        url: '/test',
        body: {},
        params: {},
        query: {},
        headers: { 'user-agent': 'test' },
        ip: '192.168.1.100',
        socket: { remoteAddress: '192.168.1.100' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => ({ statusCode: 200 }),
        }),
        getHandler: () => ({ name: 'test' }),
        getClass: () => ({ name: 'TestController' }),
      } as ExecutionContext;

      const callHandler = createMockCallHandler({});
      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        next: () => {
          const intentCall = mockAuditService.log.mock.calls[0][0];
          expect(intentCall.sourceIp).toBe('192.168.1.100');
          done();
        },
      });
    });
  });

  describe('Resource Type Mapping', () => {
    const controllers: Array<[string, string]> = [
      ['RulesController', 'rule'],
      ['NodesController', 'node'],
      ['ConfigController', 'configuration'],
      ['AuthController', 'authentication'],
      ['ParseExtractController', 'parse-extract'],
      ['UnknownController', 'unknown'],
    ];

    controllers.forEach(([controllerName, expectedResourceType]) => {
      it(`should map ${controllerName} to ${expectedResourceType}`, (done) => {
        const context = createMockContext('GET', '/test', 'test', controllerName);
        const callHandler = createMockCallHandler({});

        const result$ = interceptor.intercept(context, callHandler);

        result$.subscribe({
          next: () => {
            const intentCall = mockAuditService.log.mock.calls[0][0];
            expect(intentCall.resourceType).toBe(expectedResourceType);
            done();
          },
        });
      });
    });
  });

  describe('Audit Service Failures', () => {
    it('should not throw when audit service fails', (done) => {
      mockAuditService.log.mockRejectedValue(new Error('Audit service unavailable'));

      const context = createMockContext('GET', '/test');
      const callHandler = createMockCallHandler({ success: true });

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual({ success: true });
          done();
        },
      });
    });
  });

  describe('User Role Extraction', () => {
    it('should extract role from validClaims', (done) => {
      const user = createMockUser();
      user.validClaims = ['approver'];

      const context = createMockContext('GET', '/test', 'test', 'TestController', user);
      const callHandler = createMockCallHandler({});

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        next: () => {
          const intentCall = mockAuditService.log.mock.calls[0][0];
          expect(intentCall.actorRole).toBe('approver');
          done();
        },
      });
    });

    it('should fallback to token claims when validClaims is empty', (done) => {
      const user = createMockUser();
      user.validClaims = [];
      user.token.claims = ['publisher'];

      const context = createMockContext('GET', '/test', 'test', 'TestController', user);
      const callHandler = createMockCallHandler({});

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        next: () => {
          const intentCall = mockAuditService.log.mock.calls[0][0];
          expect(intentCall.actorRole).toBe('publisher');
          done();
        },
      });
    });

    it('should use default role when no claims available', (done) => {
      const user = createMockUser();
      user.validClaims = [];
      user.token.claims = [];

      const context = createMockContext('GET', '/test', 'test', 'TestController', user);
      const callHandler = createMockCallHandler({});

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        next: () => {
          const intentCall = mockAuditService.log.mock.calls[0][0];
          expect(intentCall.actorRole).toBe('user');
          done();
        },
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AuditInterceptor } from '../../src/interceptors/audit.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { firstValueFrom, of, throwError } from 'rxjs';
import type { AuthenticatedUser } from '../../src/services/auth/auth.types';

describe('AuditInterceptor - extended branch coverage', () => {
  let interceptor: AuditInterceptor;
  let mockAuditService: { log: jest.Mock };

  beforeEach(async () => {
    mockAuditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditInterceptor,
        { provide: 'AUDIT_LOGGER', useValue: mockAuditService },
      ],
    }).compile();

    interceptor = module.get<AuditInterceptor>(AuditInterceptor);
  });

  afterEach(() => jest.clearAllMocks());

  const buildContext = (opts: {
    method?: string;
    url?: string;
    handler?: string;
    controller?: string;
    body?: unknown;
    params?: Record<string, string>;
    headers?: Record<string, unknown>;
    ip?: string;
    socketAddr?: string;
    user?: AuthenticatedUser;
  }): ExecutionContext => {
    const req = {
      method: opts.method ?? 'GET',
      url: opts.url ?? '/test',
      body: opts.body !== undefined ? opts.body : {},
      params: opts.params ?? {},
      query: {},
      headers: { 'user-agent': 'test-agent', ...(opts.headers ?? {}) },
      ip: opts.ip,
      socket: { remoteAddress: opts.socketAddr },
      user: opts.user,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({ statusCode: 200 }),
      }),
      getHandler: () => ({ name: opts.handler ?? 'testHandler' }),
      getClass: () => ({ name: opts.controller ?? 'TestController' }),
    } as ExecutionContext;
  };

  const handle = (responseData?: unknown, error?: unknown): CallHandler => ({
    handle: () => (error ? throwError(() => error) : of(responseData)),
  });

  describe('actorName / actorEmail fallback (line 89)', () => {
    it('uses actorEmail when actorName is undefined', async () => {
      const user = { userId: 'u1', actorName: undefined, actorEmail: 'user@test.com', actorRole: 'editor', tenantId: 'tenant-1', token: { tokenString: 'tok', tenantId: 'tenant-1' }, validClaims: [], validated: {} } as unknown as AuthenticatedUser;
      const ctx = buildContext({ user, handler: 'login', controller: 'AuthController' });
      await firstValueFrom(interceptor.intercept(ctx, handle({})));
      expect(mockAuditService.log.mock.calls[0][0].actorName).toBe('user@test.com');
    });

    it("uses 'anonymous' when both actorName and actorEmail are undefined", async () => {
      const user = { userId: 'u2', actorName: undefined, actorEmail: undefined, actorRole: 'editor', tenantId: 'tenant-1', token: { tokenString: 'tok', tenantId: 'tenant-1' }, validClaims: [], validated: {} } as unknown as AuthenticatedUser;
      const ctx = buildContext({ user, handler: 'login', controller: 'AuthController' });
      await firstValueFrom(interceptor.intercept(ctx, handle({})));
      expect(mockAuditService.log.mock.calls[0][0].actorName).toBe('anonymous');
    });
  });

  describe('extractUpdateChanges private method (line 116)', () => {
    const extract = (handler: string, body: unknown) =>
      (interceptor as any).extractUpdateChanges(handler, body);

    it('returns null when body is null', () => { expect(extract('updateRule', null)).toBeNull(); });
    it('returns null when body is a string', () => { expect(extract('updateRule', 'invalid')).toBeNull(); });
    it('returns null when body is a number', () => { expect(extract('updateRule', 42)).toBeNull(); });
    it('returns null for unknown handler', () => { expect(extract('unknownHandler', { foo: 'bar' })).toBeNull(); });
    it('returns update fields for updateRule handler', () => {
      expect(extract('updateRule', { description: 'desc', version: '1.0', status: 'STATUS_02_DRAFT' })).toEqual({ description: 'desc', version: '1.0', status: 'STATUS_02_DRAFT' });
    });
    it('returns update fields for updateRuleMetadata handler (fallthrough)', () => {
      expect(extract('updateRuleMetadata', { description: 'new', txtp: 'pacs.002' })).toEqual({ description: 'new', txtp: 'pacs.002' });
    });
    it('returns status/comment for updateRuleStatus handler', () => {
      expect(extract('updateRuleStatus', { status: 'APPROVED', comment: 'ok' })).toEqual({ status: 'APPROVED', comment: 'ok' });
    });
    it('returns category and status for updateRuleFlow handler', () => {
      const result = extract('updateRuleFlow', { category: 'cat1', status: 'active', ruleFlow: {} });
      expect(result).toEqual({ category: 'cat1', status: 'active' });
    });
  });

  describe('extractResourceIdFromResponse private method (lines 163, 166)', () => {
    const extract = (data: unknown) => (interceptor as any).extractResourceIdFromResponse(data);

    it('extracts string id', () => { expect(extract({ id: 'r-1' })).toBe('r-1'); });
    it('extracts rule_id when id absent', () => { expect(extract({ rule_id: 'from-rule' })).toBe('from-rule'); });
    it('extracts nodeId when id and rule_id absent', () => { expect(extract({ nodeId: 'n-1' })).toBe('n-1'); });
    it('returns undefined for numeric id', () => { expect(extract({ id: 42 })).toBeUndefined(); });
    it('returns undefined for no id fields', () => { expect(extract({ name: 'x' })).toBeUndefined(); });
    it('returns undefined for string response', () => { expect(extract('str')).toBeUndefined(); });
    it('returns undefined for null', () => { expect(extract(null)).toBeUndefined(); });
  });

  describe('extractSourceIp private method (lines 193, 196, 199)', () => {
    const extractIp = (headers: Record<string, unknown>, ip?: string, socketAddr?: string) =>
      (interceptor as any).extractSourceIp({ headers, ip, socket: { remoteAddress: socketAddr } });

    it('takes first element when x-forwarded-for is an array', () => { expect(extractIp({ 'x-forwarded-for': ['10.0.0.5', '192.168.1.1'] })).toBe('10.0.0.5'); });
    it('takes first element when x-real-ip is an array', () => { expect(extractIp({ 'x-real-ip': ['10.0.0.9', '10.0.0.10'] })).toBe('10.0.0.9'); });
    it('uses x-forwarded-for string split on comma', () => { expect(extractIp({ 'x-forwarded-for': '10.5.5.5, 192.168.0.1' })).toBe('10.5.5.5'); });
    it('uses x-real-ip string directly', () => { expect(extractIp({ 'x-real-ip': '172.16.0.1' })).toBe('172.16.0.1'); });
    it('falls back to request.ip', () => { expect(extractIp({}, '127.0.0.1', undefined)).toBe('127.0.0.1'); });
    it('falls back to socket.remoteAddress when request.ip undefined', () => { expect(extractIp({}, undefined, '10.20.30.40')).toBe('10.20.30.40'); });
    it("falls back to 'unknown' when both undefined", () => { expect(extractIp({}, undefined, undefined)).toBe('unknown'); });
  });

  describe('logAuditAsync non-Error rejection (line 366)', () => {
    it('handles non-Error rejection without crashing', async () => {
      mockAuditService.log.mockRejectedValue('plain string rejection');
      const ctx = buildContext({ handler: 'createRule', controller: 'RulesController' });
      const result = await firstValueFrom(interceptor.intercept(ctx, handle({ id: '1' })));
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('catchError non-Error branch (lines 56-59)', () => {
    it('wraps string error and re-throws as Error', async () => {
      const ctx = buildContext({ handler: 'createRule' });
      await expect(firstValueFrom(interceptor.intercept(ctx, handle(null, 'string-error')))).rejects.toThrow('string-error');
    });

    it('includes statusCode from plain object with status property', async () => {
      const ctx = buildContext({ handler: 'createRule' });
      const errObj = { message: 'bad request', status: 400 };
      await expect(firstValueFrom(interceptor.intercept(ctx, handle(null, errObj)))).rejects.toThrow();
      await new Promise(r => setTimeout(r, 10));
      const failedCall = mockAuditService.log.mock.calls.find((c: any[]) => c[0]?.eventPhase === 'FAILED');
      expect(failedCall?.[0]?.outcome?.statusCode).toBe(400);
    });
  });

  describe('extractResourceIdFromRequest various params', () => {
    it('extracts nodeId param', async () => {
      const ctx = buildContext({ params: { nodeId: 'n-123' } });
      await firstValueFrom(interceptor.intercept(ctx, handle({})));
      expect(mockAuditService.log.mock.calls[0][0].resourceId).toBe('n-123');
    });
    it('extracts id param', async () => {
      const ctx = buildContext({ params: { id: 'generic-id' } });
      await firstValueFrom(interceptor.intercept(ctx, handle({})));
      expect(mockAuditService.log.mock.calls[0][0].resourceId).toBe('generic-id');
    });
    it('extracts resourceId param', async () => {
      const ctx = buildContext({ params: { resourceId: 'res-777' } });
      await firstValueFrom(interceptor.intercept(ctx, handle({})));
      expect(mockAuditService.log.mock.calls[0][0].resourceId).toBe('res-777');
    });
  });
});

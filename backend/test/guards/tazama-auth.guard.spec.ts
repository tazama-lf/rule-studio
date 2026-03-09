import { Test, TestingModule } from '@nestjs/testing';
import { TazamaAuthGuard } from '../../src/guards/tazama-auth.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as authLib from '@tazama-lf/auth-lib';

jest.mock('@tazama-lf/auth-lib');

// Helper to create a valid JWT structure (base64url encoded)
function createMockJWT(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.mock-signature`;
}

describe('TazamaAuthGuard', () => {
  let guard: TazamaAuthGuard;
  let reflector: Reflector;

  const mockValidateTokenAndClaims = authLib.validateTokenAndClaims as jest.MockedFunction<
    typeof authLib.validateTokenAndClaims
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TazamaAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<TazamaAuthGuard>(TazamaAuthGuard);
    reflector = module.get<Reflector>(Reflector);

    jest.clearAllMocks();
  });

  const createMockContext = (headers: any = {}, user?: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          user,
          ip: '127.0.0.1',
          socket: { remoteAddress: '127.0.0.1' },
        }),
      }),
      getHandler: () => ({ name: 'testHandler' }),
      getClass: () => ({ name: 'TestController' }),
    }) as ExecutionContext;

  describe('Public Routes', () => {
    it('should allow access to public routes without token', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const context = createMockContext();

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockValidateTokenAndClaims).not.toHaveBeenCalled();
    });
  });

  describe('Bearer Token Extraction', () => {
    it('should throw UnauthorizedException when no authorization header', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // CLAIMS_KEY
        .mockReturnValueOnce(undefined); // ANY_CLAIMS_KEY
      const context = createMockContext({});

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('No Bearer token provided');
    });

    it('should throw UnauthorizedException when authorization header does not start with Bearer', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // CLAIMS_KEY
        .mockReturnValueOnce(undefined); // ANY_CLAIMS_KEY
      const context = createMockContext({ authorization: 'Basic abc123' });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('No Bearer token provided');
    });

    it('should extract token from valid Bearer authorization header', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // CLAIMS_KEY
        .mockReturnValueOnce(undefined); // ANY_CLAIMS_KEY
      mockValidateTokenAndClaims.mockReturnValue({});

      const innerToken = createMockJWT({
        preferred_username: 'test@example.com',
        name: 'Test User',
        realm_access: { roles: ['editor'] },
      });
      const token = createMockJWT({
        clientId: 'test',
        tenantId: 'tenant1',
        claims: [],
        tokenString: innerToken,
      });
      const context = createMockContext({ authorization: `Bearer ${token}` });

      guard.canActivate(context);

      expect(mockValidateTokenAndClaims).toHaveBeenCalledWith(token, []);
    });
  });

  describe('Token Validation', () => {
    const innerToken = createMockJWT({
      preferred_username: 'test@example.com',
      name: 'Test User',
      realm_access: { roles: ['editor'] },
    });
    const validToken = createMockJWT({
      clientId: 'test',
      tenantId: 'tenant1',
      claims: [],
      tokenString: innerToken,
    });

    it('should throw UnauthorizedException when token is expired', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // CLAIMS_KEY
        .mockReturnValueOnce(undefined); // ANY_CLAIMS_KEY
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      mockValidateTokenAndClaims.mockImplementation(() => {
        throw error;
      });

      const context = createMockContext({ authorization: `Bearer ${validToken}` });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Token has expired. Please log in again.');
    });

    it('should throw UnauthorizedException when token validation fails', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // CLAIMS_KEY
        .mockReturnValueOnce(undefined); // ANY_CLAIMS_KEY
      mockValidateTokenAndClaims.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const context = createMockContext({ authorization: `Bearer ${validToken}` });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Token validation failed');
    });

    it('should successfully validate a valid token', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // CLAIMS_KEY
        .mockReturnValueOnce(undefined); // ANY_CLAIMS_KEY
      mockValidateTokenAndClaims.mockReturnValue({});

      const context = createMockContext({ authorization: `Bearer ${validToken}` });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Claims Validation', () => {
    const innerToken = createMockJWT({
      preferred_username: 'test@example.com',
      name: 'Test User',
      realm_access: { roles: ['editor'] },
    });
    const validToken = createMockJWT({
      clientId: 'test',
      tenantId: 'tenant1',
      claims: [],
      tokenString: innerToken,
    });

    it('should allow access when no claims are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // CLAIMS_KEY
        .mockReturnValueOnce(undefined); // ANY_CLAIMS_KEY
      mockValidateTokenAndClaims.mockReturnValue({});

      const context = createMockContext({ authorization: `Bearer ${validToken}` });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when all required claims are present', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['editor', 'create']) // CLAIMS_KEY
        .mockReturnValueOnce(undefined); // ANY_CLAIMS_KEY

      mockValidateTokenAndClaims.mockReturnValue({
        editor: true,
        create: true,
      });

      const context = createMockContext({ authorization: `Bearer ${validToken}` });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when required claims are missing', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY - first call
        .mockReturnValueOnce(['editor', 'delete']) // CLAIMS_KEY - second call
        .mockReturnValueOnce(undefined); // ANY_CLAIMS_KEY - third call

      mockValidateTokenAndClaims.mockReturnValue({
        editor: true,
        delete: false,
      });

      const context = createMockContext({ authorization: `Bearer ${validToken}` });

      try {
        guard.canActivate(context);
        throw new Error('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Missing or invalid claims: delete');
      }
    });

    it('should allow access when at least one of anyClaims is present', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // CLAIMS_KEY
        .mockReturnValueOnce(['editor', 'approver', 'publisher']); // ANY_CLAIMS_KEY

      mockValidateTokenAndClaims.mockReturnValue({
        editor: false,
        approver: true,
        publisher: false,
      });

      const context = createMockContext({ authorization: `Bearer ${validToken}` });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when none of anyClaims are present', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY - first call
        .mockReturnValueOnce(undefined) // CLAIMS_KEY - second call
        .mockReturnValueOnce(['editor', 'approver']); // ANY_CLAIMS_KEY - third call

      mockValidateTokenAndClaims.mockReturnValue({
        editor: false,
        approver: false,
      });

      const context = createMockContext({ authorization: `Bearer ${validToken}` });

      try {
        guard.canActivate(context);
        throw new Error('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Missing or invalid claims: editor, approver');
      }
    });
  });

  describe('User Extraction', () => {
    const innerToken = createMockJWT({
      preferred_username: 'test@example.com',
      name: 'Test User',
      realm_access: { roles: ['editor'] },
    });
    const validToken = createMockJWT({
      clientId: 'test',
      tenantId: 'tenant1',
      claims: ['editor'],
      tokenString: innerToken,
    });

    it('should attach authenticated user to request', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // CLAIMS_KEY
        .mockReturnValueOnce(undefined); // ANY_CLAIMS_KEY
      mockValidateTokenAndClaims.mockReturnValue({ editor: true });

      const mockRequest = {
        headers: { authorization: `Bearer ${validToken}` },
        ip: '192.168.1.1',
        socket: { remoteAddress: '192.168.1.1' },
        user: undefined,
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({ name: 'testHandler' }),
        getClass: () => ({ name: 'TestController' }),
      } as ExecutionContext;

      guard.canActivate(context);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest?.user?.userId).toBe('test');
      expect(mockRequest?.user?.tenantId).toBe('tenant1');
      expect(mockRequest?.user?.sourceIP).toBe('192.168.1.1');
    });

    it('should extract IP from x-forwarded-for header', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // CLAIMS_KEY
        .mockReturnValueOnce(undefined); // ANY_CLAIMS_KEY
      mockValidateTokenAndClaims.mockReturnValue({ editor: true });

      const mockRequest = {
        headers: {
          authorization: `Bearer ${validToken}`,
          'x-forwarded-for': '10.0.0.1, 192.168.1.1',
        },
        ip: undefined,
        socket: { remoteAddress: '127.0.0.1' },
        user: undefined,
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({ name: 'testHandler' }),
        getClass: () => ({ name: 'TestController' }),
      } as ExecutionContext;

      guard.canActivate(context);

      expect(mockRequest.user.sourceIP).toBe('10.0.0.1');
    });

    it('should extract actor role from realm_access', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // CLAIMS_KEY
        .mockReturnValueOnce(undefined); // ANY_CLAIMS_KEY
      mockValidateTokenAndClaims.mockReturnValue({ editor: true });

      const tokenWithRole =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI6InRlc3QiLCJ0ZW5hbnRJZCI6InRlbmFudDEiLCJjbGFpbXMiOltdLCJ0b2tlblN0cmluZyI6ImV5SmhiR2NpT2lKSVV6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUp3Y21WbVpYSnlaV1JmZFhObGNtNWhiV1VpT2lKMFpYTjBRR1Y0WVcxd2JHVXVZMjl0SWl3aWJtRnRaU0k2SWxSbGMzUWdWWE5sY2lJc0luSmxZV3h0WDJGalkyVnpjeUk2ZXlKeWIyeGxjeUk2V3lKbFpHbDBiM0lpWFgwc0luTjBZWFIxY3lJNkluTjBZWFIxY3kweExITjBZWFIxY3kweUluMC5zaWduYXR1cmUifQ.signature';

      const mockRequest = {
        headers: { authorization: `Bearer ${tokenWithRole}` },
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
        user: undefined,
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({ name: 'testHandler' }),
        getClass: () => ({ name: 'TestController' }),
      } as ExecutionContext;

      guard.canActivate(context);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user.actorRole).toBe('editor');
    });
  });

  describe('Invalid Token Format', () => {
    it('should throw UnauthorizedException for invalid token format', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // CLAIMS_KEY
        .mockReturnValueOnce(undefined); // ANY_CLAIMS_KEY
      mockValidateTokenAndClaims.mockReturnValue({});

      const invalidToken = 'invalid.token.format';
      const context = createMockContext({ authorization: `Bearer ${invalidToken}` });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });
});

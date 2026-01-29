import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { AuthService } from '../../src/services/auth/auth.service';
import { LoggerService } from '@tazama-lf/frms-coe-lib';
import {
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { validateTokenAndClaims } from '@tazama-lf/auth-lib';

jest.mock('@tazama-lf/auth-lib', () => ({
  validateTokenAndClaims: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let httpService: HttpService;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    httpService = module.get<HttpService>(HttpService);
    loggerService = module.get<LoggerService>(LoggerService);

    process.env.TAZAMA_AUTH_URL = 'http://localhost:3001/auth';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.TAZAMA_AUTH_URL;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const username = 'test@example.com';
    const password = 'password123';
    const authUrl = 'http://localhost:3001/auth';

    it('should throw ServiceUnavailableException when TAZAMA_AUTH_URL is not set', async () => {
      delete process.env.TAZAMA_AUTH_URL;

      await expect(service.login(username, password)).rejects.toThrow(
        ServiceUnavailableException,
      );

      expect(loggerService.error).toHaveBeenCalledWith(
        'TAZAMA_AUTH_URL is not set in environment variables',
      );
    });

    it('should login successfully when user has required claims', async () => {
      const token = 'valid-token';

      (httpService.post as jest.Mock).mockReturnValue(
        of({ data: { token, expires_in: 3600 } }),
      );

      (validateTokenAndClaims as jest.Mock).mockReturnValue({
        editor: true,
        approver: false,
        publisher: false,
      });

      const result = await service.login(username, password);

      expect(result).toEqual({
        message: 'Login successful',
        token,
        expiresIn: 3600,
      });

      expect(validateTokenAndClaims).toHaveBeenCalledWith(token, [
        'editor',
        'approver',
        'publisher',
      ]);

      expect(loggerService.log).toHaveBeenCalledWith(
        `User ${username} authenticated successfully`,
        'AuthService',
      );
    });

    it('should throw UnauthorizedException when user lacks required claims', async () => {
      const token = 'no-claims-token';

      (httpService.post as jest.Mock).mockReturnValue(of({ data: { token } }));

      (validateTokenAndClaims as jest.Mock).mockReturnValue({
        editor: false,
        approver: false,
        publisher: false,
      });

      await expect(service.login(username, password)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(loggerService.warn).toHaveBeenCalledWith(
        `User ${username} does not have required claims (editor, approver, or publisher).`,
        'AuthService',
      );
    });

    it('should throw ServiceUnavailableException when response data is missing', async () => {
      (httpService.post as jest.Mock).mockReturnValue(of({}));

      await expect(service.login(username, password)).rejects.toThrow(
        ServiceUnavailableException,
      );

      expect(loggerService.error).toHaveBeenCalledWith(
        'Auth service did not return a valid response',
        'AuthService',
      );
    });
    describe('token extraction priority', () => {
      const username = 'test@example.com';
      const password = 'password123';

      beforeEach(() => {
        // User must have valid claims for successful login
        (validateTokenAndClaims as jest.Mock).mockReturnValue({
          editor: true,
          approver: false,
          publisher: false,
          exporter: false,
        });
      });

      it.each([
        {
          title: 'string response.data',
          data: 'string-token',
          expectedToken: 'string-token',
        },
        {
          title: 'response.data.token',
          data: { token: 'token-field' },
          expectedToken: 'token-field',
        },
        {
          title: 'response.data.access_token',
          data: { access_token: 'access-token-field' },
          expectedToken: 'access-token-field',
        },
        {
          title: 'response.data.jwt',
          data: { jwt: 'jwt-field' },
          expectedToken: 'jwt-field',
        },
        {
          title: 'response.data.user.token',
          data: { user: { token: 'nested-user-token' } },
          expectedToken: 'nested-user-token',
        },
      ])(
        'should extract token from $title',
        async ({ data, expectedToken }) => {
          (httpService.post as jest.Mock).mockReturnValue(of({ data }) as any);

          const result = await service.login(username, password);

          expect(result.token).toBe(expectedToken);
          expect(result.message).toBe('Login successful');
        },
      );
    });

    it('should throw UnauthorizedException for 401 error', async () => {
      const error = {
        response: { status: 401, data: {} },
        message: 'Unauthorized',
      };

      (httpService.post as jest.Mock).mockReturnValue(throwError(() => error));

      await expect(service.login(username, password)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(loggerService.warn).toHaveBeenCalledWith(
        'Authentication failed: Invalid credentials',
      );
    });

    it('should throw UnauthorizedException for 429 (account locked)', async () => {
      const error = {
        response: { status: 429, data: {} },
        message: 'Too Many Requests',
      };

      (httpService.post as jest.Mock).mockReturnValue(throwError(() => error));

      await expect(service.login(username, password)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(loggerService.warn).toHaveBeenCalledWith(
        'Account locked (429): Account temporarily locked due to too many failed login attempts.',
      );
    });

    it('should throw ServiceUnavailableException for network errors', async () => {
      const error = new Error('Network error');

      (httpService.post as jest.Mock).mockReturnValue(throwError(() => error));

      await expect(service.login(username, password)).rejects.toThrow(
        ServiceUnavailableException,
      );

      expect(loggerService.error).toHaveBeenCalledWith(
        'Auth service error during login: Network error',
      );
    });

    it('should throw ServiceUnavailableException for 500 errors', async () => {
      const error = {
        response: { status: 500 },
        message: 'Internal Server Error',
      };

      (httpService.post as jest.Mock).mockReturnValue(throwError(() => error));

      await expect(service.login(username, password)).rejects.toThrow(
        ServiceUnavailableException,
      );

      expect(loggerService.error).toHaveBeenCalledWith(
        'Auth service error during login: Internal Server Error',
      );
    });
  });
});

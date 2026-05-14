import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { of } from 'rxjs';
import { AuthService } from '../../src/services/auth/auth.service';
import { LoggerService } from '@tazama-lf/frms-coe-lib';
import { validateTokenAndClaims } from '@tazama-lf/auth-lib';

jest.mock('@tazama-lf/auth-lib', () => ({
  validateTokenAndClaims: jest.fn(),
}));

describe('AuthService - extended coverage', () => {
  let service: AuthService;
  let httpService: jest.Mocked<HttpService>;
  let loggerService: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: HttpService,
          useValue: { post: jest.fn() },
        },
        {
          provide: LoggerService,
          useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    httpService = module.get(HttpService);
    loggerService = module.get(LoggerService);

    process.env.TAZAMA_AUTH_URL = 'http://localhost:3001/auth';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.TAZAMA_AUTH_URL;
  });

  describe('extractToken - ServiceUnavailableException when no token field found', () => {
    it('throws ServiceUnavailableException when data has no recognized token field', async () => {
      (httpService.post as jest.Mock).mockReturnValue(
        of({ data: { unexpected_field: 'some_value', expires_in: 3600 } }),
      );

      await expect(service.login('user@test.com', 'pass')).rejects.toThrow(ServiceUnavailableException);

      expect(loggerService.error).toHaveBeenCalledWith(
        'Auth service response missing token',
        'AuthService',
      );
    });

    it('throws ServiceUnavailableException when data.user exists but has no token', async () => {
      (httpService.post as jest.Mock).mockReturnValue(
        of({ data: { user: { name: 'John' } } }), // user.token is undefined
      );

      await expect(service.login('user@test.com', 'pass')).rejects.toThrow(ServiceUnavailableException);
    });

    it('throws ServiceUnavailableException when data is an empty object', async () => {
      (httpService.post as jest.Mock).mockReturnValue(of({ data: {} }));

      await expect(service.login('user@test.com', 'pass')).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('validateUserToken - token validation throws', () => {
    it('throws UnauthorizedException when validateTokenAndClaims throws', async () => {
      (httpService.post as jest.Mock).mockReturnValue(
        of({ data: { token: 'some-token' } }),
      );
      (validateTokenAndClaims as jest.Mock).mockImplementation(() => {
        throw new Error('JWT malformed');
      });

      await expect(service.login('user@test.com', 'pass')).rejects.toThrow(UnauthorizedException);

      expect(loggerService.warn).toHaveBeenCalledWith(
        'Token validation failed: JWT malformed',
        'AuthService',
      );
    });

    it('throws UnauthorizedException when validateTokenAndClaims throws with custom message', async () => {
      (httpService.post as jest.Mock).mockReturnValue(
        of({ data: { access_token: 'some-access-token' } }),
      );
      (validateTokenAndClaims as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      await expect(service.login('user@test.com', 'pass')).rejects.toThrow(UnauthorizedException);
    });
  });
});

import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { LoggerService } from '@tazama-lf/frms-coe-lib';
import { validateTokenAndClaims } from '@tazama-lf/auth-lib';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly httpService: HttpService,
    private readonly loggerService: LoggerService,
  ) { }

  async login(
    username: string,
    password: string,
  ): Promise<{ message: string; token: string; expiresIn: number | null }> {
    const authUrl = process.env.TAZAMA_AUTH_URL;
    if (!authUrl) {
      this.loggerService.error(
        'TAZAMA_AUTH_URL is not set in environment variables',
      );
      throw new ServiceUnavailableException(
        'Authentication service unavailable',
      );
    }
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${authUrl}/login`, { username, password }),
      );
      if (!response.data) {
        this.loggerService.error(
          'Auth service did not return a valid response',
          AuthService.name,
        );
        throw new ServiceUnavailableException(
          'Authentication service unavailable',
        );
      }
      this.loggerService.log('Auth service responded', AuthService.name);

      const token =
        typeof response.data === 'string'
          ? response.data
          : (response.data?.token ??
            response.data?.access_token ??
            response.data?.jwt ??
            response.data?.user?.token);

      if (!token) {
        this.loggerService.error(
          'Auth service response missing token',
          AuthService.name,
        );
        throw new ServiceUnavailableException(
          'Authentication service unavailable',
        );
      }

      const claimsToCheck = ['editor', 'approver', 'publisher'];
      const claimResult = validateTokenAndClaims(token, claimsToCheck);

      const hasRequiredClaim =
        claimResult.editor || claimResult.approver || claimResult.publisher;
      if (!hasRequiredClaim) {
        this.loggerService.warn(
          `User ${username} does not have required claims (editor, approver, or publisher).`,
          AuthService.name,
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      this.loggerService.log(
        `User ${username} authenticated successfully`,
        AuthService.name,
      );

      return {
        message: 'Login successful',
        token,
        expiresIn: response.data?.expires_in ?? response.data?.expiresIn,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.handleLoginError(error);
    }
  }

  private handleLoginError(error: any): never {
    if (error.response?.status === 429) {
      const errorMessage =
        error.response.data?.message ??
        error.response.data?.error ??
        'Account temporarily locked due to too many failed login attempts.';
      this.loggerService.warn(`Account locked (429): ${errorMessage}`);
      throw new UnauthorizedException(errorMessage);
    }
    if (error.response?.status === 401) {
      const errorMessage =
        error.response.data?.message ??
        error.response.data?.error ??
        'Invalid credentials';
      this.loggerService.warn(`Authentication failed: ${errorMessage}`);
      throw new UnauthorizedException(errorMessage);
    }
    this.loggerService.error(
      `Auth service error during login: ${error.message}`,
    );
    throw new ServiceUnavailableException('Authentication service unavailable');
  }
}

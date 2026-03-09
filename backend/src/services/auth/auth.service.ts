import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { LoggerService } from '@tazama-lf/frms-coe-lib';
import { validateTokenAndClaims } from '@tazama-lf/auth-lib';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly httpService: HttpService,
    private readonly loggerService: LoggerService,
  ) {}

  private extractToken(data): string {
    const token = typeof data === 'string' ? data : (data?.token ?? data?.access_token ?? data?.jwt ?? data?.user?.token);

    if (!token) {
      this.loggerService.error('Auth service response missing token', AuthService.name);
      throw new ServiceUnavailableException('Authentication service unavailable');
    }
    return token;
  }

  private validateUserToken(token: string, username: string): void {
    const claimsToCheck = ['editor', 'approver', 'publisher'];
    let claimResult;
    try {
      claimResult = validateTokenAndClaims(token, claimsToCheck);
    } catch (err) {
      const e = err as Error;
      this.loggerService.warn(`Token validation failed: ${e.message}`, AuthService.name);
      throw new UnauthorizedException('Token validation failed');
    }

    const hasRequiredClaim = [claimResult.editor, claimResult.approver, claimResult.publisher].some((claim) => !!claim);
    if (!hasRequiredClaim) {
      this.loggerService.warn(`User ${username} does not have required claims (editor, approver, or publisher).`, AuthService.name);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async login(username: string, password: string): Promise<{ message: string; token: string }> {
    const authUrl = process.env.TAZAMA_AUTH_URL;
    if (!authUrl) {
      this.loggerService.error('TAZAMA_AUTH_URL is not set in environment variables', AuthService.name);
      throw new ServiceUnavailableException('Authentication service unavailable');
    }
    try {
      const response = await firstValueFrom(this.httpService.post(`${authUrl}/login`, { username, password }, { timeout: 5000 }));
      if (!response.data) {
        this.loggerService.error('Auth service did not return a valid response', AuthService.name);
        throw new ServiceUnavailableException('Authentication service unavailable');
      }
      this.loggerService.log('Auth service responded', AuthService.name);

      const token = this.extractToken(response.data);
      this.validateUserToken(token, username);

      this.loggerService.log(`User ${username} authenticated successfully`, AuthService.name);

      return {
        message: 'Login successful',
        token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.handleLoginError(error);
    }
  }

  private handleLoginError(error: unknown): never {
    const axiosError = error as {
      response?: {
        status?: number;
        data?: { message?: string; error?: string };
      };
      message?: string;
    };
    if (axiosError.response?.status === 429) {
      const errorMessage =
        axiosError.response.data?.message ??
        axiosError.response.data?.error ??
        'Account temporarily locked due to too many failed login attempts.';
      this.loggerService.warn(`Account locked (429): ${errorMessage}`, AuthService.name);
      throw new UnauthorizedException(errorMessage);
    }
    if (axiosError.response?.status === 401) {
      const errorMessage = axiosError.response.data?.message ?? axiosError.response.data?.error ?? 'Invalid credentials';
      this.loggerService.warn(`Authentication failed: ${errorMessage}`, AuthService.name);
      throw new UnauthorizedException(errorMessage);
    }
    this.loggerService.error(`Auth service error during login: ${axiosError.message ?? 'Unknown error'}`, AuthService.name);
    throw new ServiceUnavailableException('Authentication service unavailable');
  }
}

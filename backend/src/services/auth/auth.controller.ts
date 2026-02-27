import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  ServiceUnavailableException,
  InternalServerErrorException,
  HttpCode,
  ValidationPipe,
} from '@nestjs/common';
import { LoggerService } from '@tazama-lf/frms-coe-lib';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Audit } from '../../decorators/audit.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @Audit()
  async login(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    body: LoginDto,
  ): Promise<{ message: string; token: string }> {
    try {
      const result = await this.authService.login(body.username, body.password);

      const response: { token: string; message: string; expiresIn?: number } = {
        message: 'Login successful',
        token: result.token,
      };

      return response;
    } catch (error) {
      this.handleLoginError(error, body.username);
    }
  }

  private handleLoginError(error: unknown, username: string): never {
    if (error instanceof UnauthorizedException) {
      this.logger.warn('Authentication failed', AuthController.name);
      throw error;
    }

    if (error instanceof ServiceUnavailableException) {
      this.logger.error('Auth service unavailable during login attempt', AuthController.name);
      throw error;
    }

    const err = error as Error;
    this.logger.error(`Unexpected error during login: ${err.message}`, AuthController.name);
    throw new InternalServerErrorException('An unexpected error occurred during login');
  }
}

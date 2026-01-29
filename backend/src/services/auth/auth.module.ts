import { Module, Global } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from 'src/logger-service/logger-service.module';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';

@Global()
@Module({
  imports: [LoggerModule, HttpModule],
  providers: [AuthService, TazamaAuthGuard],
  exports: [AuthService, TazamaAuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}

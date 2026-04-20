import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from '@tazama-lf/frms-coe-lib';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { RedisIoAdapter } from './adapters/redis-io.adapter';

/**
 * Bootstraps, configures, and starts the NestJS application.
 *
 * Configures global validation, CORS (based on NODE_ENV and ALLOWED_ORIGINS), integrates a LoggerService,
 * sets up Swagger UI and OpenAPI document generation, optionally writes the Swagger JSON to ./docs/swagger.json
 * when WRITE_SWAGGER_JSON is "true", and begins listening on the PORT (default 3005) while logging startup info.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  const logger = app.get(LoggerService);
  app.useLogger(logger);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const isDev = ['dev', 'development'].includes((process.env.NODE_ENV ?? '').toLowerCase());

  app.enableCors({
    origin: isDev ? true : allowedOrigins,
    credentials: true,
  });

  // Swagger Configuration
  const apiHost = process.env.API_HOST ?? 'localhost';
  const apiPort = process.env.PORT ?? '3005';
  const baseUrl = `http://${apiHost}:${apiPort}`;

  const config = new DocumentBuilder()
    .setTitle('Tazama Model Management API')
    .setDescription('Complete API documentation for Tazama Model Management Backend organized by service modules')
    .setVersion('1.0.0')
    .addServer(baseUrl, 'API Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: `Enter JWT token (Login at: ${baseUrl}/auth/login)`,
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', `JWT token management - Login URL: ${baseUrl}/auth/login`)
    .addTag('Configuration', 'System configuration and transaction types')
    .addTag('Nodes', 'Node management operations')
    .addTag('Parse & Extract', 'ISO 20022 message parsing and validation')
    .addTag('Rules', 'Transaction rules management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Save Swagger JSON to docs folder, only if enabled and possible
  if (process.env.WRITE_SWAGGER_JSON === 'true') {
    try {
      const docsDir = path.join(__dirname, '..', 'docs');
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(docsDir, 'swagger.json'), JSON.stringify(document, null, 2));
    } catch (err) {
      logger.warn(`Swagger JSON write skipped: ${String(err)}`);
    }
  }
  const port = process.env.PORT ?? 3005;
  await app.listen(port);

  logger.log(`🚀 Application started on port ${port} (env=${process.env.NODE_ENV})`);
  logger.log(`📚 API Documentation available at: http://10.10.80.37:${port}/api/docs`);
}
bootstrap();

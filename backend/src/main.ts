import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from '@tazama-lf/frms-coe-lib';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const logger = app.get(LoggerService);
  app.useLogger(logger);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Tazama Model Management API')
    .setDescription('Complete API documentation for Tazama Model Management Backend organized by service modules')
    .setVersion('1.0.0')
    .addServer('http://10.10.80.37:3005', 'Production Server')
    .addServer('http://localhost:3005', 'Local Development Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token (Login at: http://10.10.80.37:3005/auth/login)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'JWT token management - Login URL: http://10.10.80.37:3005/auth/login')
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

  // Save Swagger JSON to docs folder
  const docsDir = path.join(__dirname, '..', 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(docsDir, 'swagger.json'), JSON.stringify(document, null, 2));

  const port = process.env.PORT ?? 3005;
  await app.listen(port);
  
  logger.log(
    `🚀 Application started on port ${port} (env=${process.env.NODE_ENV})`,
  );
  logger.log(
    `📚 API Documentation available at: http://10.10.80.37:${port}/api/docs`,
  );
}
bootstrap();

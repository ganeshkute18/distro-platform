import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as cookieParser from 'cookie-parser';

const DEFAULT_DATABASE_URL =
  'postgresql://distro_user:distro_pass@localhost:5432/distro_platform?schema=public';

async function bootstrap() {
  if (!process.env.DATABASE_URL?.trim()) {
    process.env.DATABASE_URL = DEFAULT_DATABASE_URL;
    console.warn(
      `DATABASE_URL was missing or empty. Falling back to default local PostgreSQL URL: ${DEFAULT_DATABASE_URL}`,
    );
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  // Render.com injects $PORT — use that first, then API_PORT, then 4000
  const port = process.env.PORT || configService.get<number>('API_PORT', 4000);
  const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:3000');

  // Middleware
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: corsOrigins.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Distro Platform API')
      .setDescription('B2B Ordering & Inventory Management')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // '0.0.0.0' is required by Railway, Render, and other cloud platforms
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API running on port ${port} (${process.env.NODE_ENV || 'development'})`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
  }
}

bootstrap();

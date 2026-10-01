import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as cookieParser from 'cookie-parser';

function ensureDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) return;

  throw new Error(
    [
      'DATABASE_URL is required and cannot be empty.',
      'For Railway, use the PostgreSQL connection string from the Postgres service Variables tab.',
      'Example format: postgresql://postgres:<PASSWORD>@<HOST>:<PORT>/railway?sslmode=require',
    ].join(' '),
  );
}

async function bootstrap() {
  ensureDatabaseUrl();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // ============================================================
  // CORS
  // ============================================================
  // Reflect the requesting origin.
  // This allows Vercel preview URLs to work even when their
  // deployment URL changes.
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Tenant-ID',
      'X-Tenant-Slug',
      'Accept',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
    optionsSuccessStatus: 200,
  });

  const configService = app.get(ConfigService);

  // Railway provides PORT.
  // Fall back to API_PORT and then 4000 for local development.
  const port =
    process.env.PORT || configService.get<number>('API_PORT', 4000);

  // Healthcheck
  app.use('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
    });
  });

  // Cookie parser
  app.use(cookieParser());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
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

  // Railway requires 0.0.0.0
  await app.listen(port, '0.0.0.0');

  console.log(
    `🚀 API running on port ${port} (${process.env.NODE_ENV || 'development'})`,
  );

  if (process.env.NODE_ENV !== 'production') {
    console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
  }
}

bootstrap();

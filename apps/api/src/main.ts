import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
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

  const configService = app.get(ConfigService);
  // Render.com injects $PORT — use that first, then API_PORT, then 4000
  const port = process.env.PORT || configService.get<number>('API_PORT', 4000);
  
  // Parse CORS_ORIGINS: comma-separated list with wildcard support
  // Examples:
  //   'http://localhost:3000,https://example.vercel.app' (exact matches)
  //   'http://localhost:3000,https://*.vercel.app' (with wildcards)
  //   '*' (allow all - dev only)
  // For Railway production, set: CORS_ORIGINS="https://distro-platform-web.vercel.app,https://*.vercel.app"
  const corsOriginConfig = configService.get<string>(
    'CORS_ORIGINS',
    'http://localhost:3000,http://localhost:3001',
  );

  // Function to check if origin matches allowed patterns (supports wildcards)
  function isOriginAllowed(origin: string, allowedPatterns: string[]): boolean {
    if (allowedPatterns.includes('*')) return true;
    
    return allowedPatterns.some(pattern => {
      if (pattern === origin) return true;
      
      // Support wildcard patterns like 'https://*.vercel.app'
      if (pattern.includes('*')) {
        const regexPattern = pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '[^/]+');
        return new RegExp(`^${regexPattern}$`).test(origin);
      }
      
      return false;
    });
  }

  const allowedOrigins = corsOriginConfig === '*' ? ['*'] : corsOriginConfig.split(',').map(o => o.trim());

  // Explicit platform-level healthcheck path (not behind API version prefix).
  app.use('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
    });
  });

  // Middleware
  app.use(cookieParser());

  // CORS configuration — permissive defaults for local/staging, restrict for production
  // Log allowed origins for debugging
  console.log('✅ CORS Configuration:');
  console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`   Credentials: true`);
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin "${origin}" not allowed`), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Tenant-Slug', 'Accept'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
    preflightContinue: false,
    optionsSuccessStatus: 200,
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

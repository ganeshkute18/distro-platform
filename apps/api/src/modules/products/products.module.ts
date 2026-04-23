import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuditModule,
    MulterModule.register({ storage: memoryStorage() }),
    ConfigModule,
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    {
      provide: 'CLOUDINARY',
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        cloudinary.config({
          cloud_name: cfg.get('CLOUDINARY_CLOUD_NAME'),
          api_key: cfg.get('CLOUDINARY_API_KEY'),
          api_secret: cfg.get('CLOUDINARY_API_SECRET'),
        });
        return cloudinary;
      },
    },
  ],
  exports: [ProductsService],
})
export class ProductsModule {}

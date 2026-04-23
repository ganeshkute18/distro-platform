import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private service: ProductsService) {}

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.OWNER)
  @Post()
  create(@Body() dto: CreateProductDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.id);
  }

  @Roles(Role.OWNER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: User) {
    return this.service.update(id, dto, user.id);
  }

  @Roles(Role.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.remove(id, user.id);
  }

  @Roles(Role.OWNER)
  @Post(':id/images')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 5))
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const uploads = await Promise.all(
      files.map((file) =>
        new Promise<string>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: 'distro/products' }, (err, result) => {
              if (err || !result) return reject(err);
              resolve(result.secure_url);
            })
            .end(file.buffer);
        }),
      ),
    );
    return this.service.addImages(id, uploads);
  }
}

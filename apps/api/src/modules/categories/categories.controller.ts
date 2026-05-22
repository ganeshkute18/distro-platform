import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { Role } from '@prisma/client';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private service: CategoriesService) {}

  @Get()
  findAll(@CurrentTenant() tenantId?: string) { return this.service.findAll(tenantId); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Roles(Role.OWNER)
  @Post()
  create(@Body() dto: CreateCategoryDto, @CurrentTenant() tenantId?: string) { return this.service.create(dto, tenantId); }

  @Roles(Role.OWNER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) { return this.service.update(id, dto); }

  @Roles(Role.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}

import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant, TenantRequired } from '../../common/decorators/tenant.decorator';
import { Role } from '@prisma/client';

@ApiTags('Categories')
@ApiBearerAuth()
@TenantRequired()
@Controller('categories')
export class CategoriesController {
  constructor(private service: CategoriesService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  @Roles(Role.OWNER)
  @Post()
  create(@Body() dto: CreateCategoryDto, @CurrentTenant() tenantId: string) {
    return this.service.create(dto, tenantId);
  }

  @Roles(Role.OWNER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @CurrentTenant() tenantId: string) {
    return this.service.update(id, dto, tenantId);
  }

  @Roles(Role.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.service.remove(id, tenantId);
  }
}

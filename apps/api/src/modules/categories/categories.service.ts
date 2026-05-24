import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { tenantWhere, tenantFindOne, assertTenantId } from '../../common/helpers/tenant-query.helper';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto, tenantId: string) {
    assertTenantId(tenantId);
    return this.prisma.category.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    assertTenantId(tenantId);
    const categories = await this.prisma.category.findMany({
      where: tenantWhere(tenantId, { parentId: null }),
      include: { children: true },
      orderBy: { name: 'asc' },
    });
    return categories;
  }

  async findOne(id: string, tenantId: string) {
    assertTenantId(tenantId);
    const cat = await this.prisma.category.findFirst({
      where: tenantFindOne(id, tenantId),
      include: { children: true, parent: true },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async update(id: string, dto: UpdateCategoryDto, tenantId: string) {
    assertTenantId(tenantId);
    await this.findOne(id, tenantId); // validates tenant ownership
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string, tenantId: string) {
    assertTenantId(tenantId);
    await this.findOne(id, tenantId); // validates tenant ownership
    return this.prisma.category.delete({ where: { id } });
  }
}

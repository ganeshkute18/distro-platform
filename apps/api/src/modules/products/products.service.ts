import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { AuditAction } from '@prisma/client';
import { tenantWhere, tenantFindOne, assertTenantId } from '../../common/helpers/tenant-query.helper';

const PRODUCT_INCLUDE = {
  agency: { select: { id: true, name: true, logoUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
  inventory: { select: { totalStock: true, reservedStock: true, lowStockThreshold: true } },
};

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(dto: CreateProductDto, userId: string, tenantId: string) {
    assertTenantId(tenantId);

    // Validate agency belongs to this tenant
    if (dto.agencyId) {
      const agency = await this.prisma.agency.findFirst({
        where: { id: dto.agencyId, tenantId },
      });
      if (!agency) throw new BadRequestException('Agency not found or does not belong to this tenant');
    }

    // Validate category belongs to this tenant
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, tenantId },
      });
      if (!category) throw new BadRequestException('Category not found or does not belong to this tenant');
    }

    const product = await this.prisma.product.create({
      data: {
        ...dto,
        taxPercent: dto.taxPercent ?? 0,
        imageUrls: dto.imageUrls ?? [],
        tenantId,
      },
      include: PRODUCT_INCLUDE,
    });

    // Auto-create inventory record
    await this.prisma.inventory.create({
      data: { productId: product.id, totalStock: 0, reservedStock: 0 },
    });

    await this.audit.log({
      userId, action: AuditAction.PRODUCT_CREATED,
      entity: 'Product', entityId: product.id,
      after: product as never,
      tenantId,
    });

    return product;
  }

  async findAll(query: ProductQueryDto, tenantId: string) {
    assertTenantId(tenantId);
    const { search, categoryId, agencyId, inStock, featured, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = tenantWhere(tenantId, { isActive: true });

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (agencyId) where.agencyId = agencyId;
    if (featured) where.isFeatured = true;
    if (inStock) {
      where.inventory = { totalStock: { gt: 0 } };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where, skip, take: limit,
        include: PRODUCT_INCLUDE,
        orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, tenantId: string) {
    assertTenantId(tenantId);
    const product = await this.prisma.product.findFirst({
      where: tenantFindOne(id, tenantId),
      include: PRODUCT_INCLUDE,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto, userId: string, tenantId: string) {
    assertTenantId(tenantId);
    const before = await this.findOne(id, tenantId);
    const updated = await this.prisma.product.update({
      where: { id }, data: dto, include: PRODUCT_INCLUDE,
    });

    await this.audit.log({
      userId, action: AuditAction.PRODUCT_UPDATED,
      entity: 'Product', entityId: id,
      before: before as never, after: updated as never,
      tenantId,
    });

    return updated;
  }

  async remove(id: string, userId: string, tenantId: string) {
    assertTenantId(tenantId);
    await this.findOne(id, tenantId); // validates tenant ownership
    const orderRefs = await this.prisma.orderItem.count({ where: { productId: id } });
    if (orderRefs > 0) {
      throw new BadRequestException('Cannot delete product already used in orders');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.inventoryAdjustment.deleteMany({
        where: { inventory: { productId: id } },
      });
      await tx.inventory.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    await this.audit.log({
      userId, action: AuditAction.PRODUCT_DELETED,
      entity: 'Product', entityId: id,
      tenantId,
    });

    return { success: true };
  }

  async addImages(id: string, urls: string[], tenantId: string) {
    assertTenantId(tenantId);
    const product = await this.findOne(id, tenantId);
    return this.prisma.product.update({
      where: { id },
      data: { imageUrls: [...product.imageUrls, ...urls] },
      include: PRODUCT_INCLUDE,
    });
  }
}

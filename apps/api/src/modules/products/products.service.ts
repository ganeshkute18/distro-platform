import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { AuditAction } from '@prisma/client';

const PRODUCT_INCLUDE = {
  agency: { select: { id: true, name: true, logoUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
  inventory: { select: { totalStock: true, reservedStock: true, lowStockThreshold: true } },
};

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(dto: CreateProductDto, userId: string) {
    const product = await this.prisma.product.create({
      data: {
        ...dto,
        taxPercent: dto.taxPercent ?? 0,
        imageUrls: dto.imageUrls ?? [],
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
    });

    return product;
  }

  async findAll(query: ProductQueryDto) {
    const { search, categoryId, agencyId, inStock, featured, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isActive: true };
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

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    const before = await this.findOne(id);
    const updated = await this.prisma.product.update({
      where: { id }, data: dto, include: PRODUCT_INCLUDE,
    });

    await this.audit.log({
      userId, action: AuditAction.PRODUCT_UPDATED,
      entity: 'Product', entityId: id,
      before: before as never, after: updated as never,
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);
    const updated = await this.prisma.product.update({
      where: { id }, data: { isActive: false },
    });

    await this.audit.log({
      userId, action: AuditAction.PRODUCT_DELETED,
      entity: 'Product', entityId: id,
    });

    return updated;
  }

  async addImages(id: string, urls: string[]) {
    const product = await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { imageUrls: [...product.imageUrls, ...urls] },
      include: PRODUCT_INCLUDE,
    });
  }
}

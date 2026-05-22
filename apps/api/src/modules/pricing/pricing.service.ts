import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePricingRuleDto, UpdatePricingRuleDto } from './dto/pricing.dto';
import { AuditAction, PriceType, CustomerType } from '@prisma/client';

export interface ResolvedPrice {
  productId: string;
  basePrice: number;         // Original product price (paise)
  resolvedPrice: number;     // Final price after rule application (paise)
  discount: number;          // Discount amount (paise)
  ruleApplied: string | null; // Rule ID that was applied
  ruleName: string | null;   // Rule name
  priceType: PriceType | null;
}

@Injectable()
export class PricingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ─── CRUD ──────────────────────────────────────────────────

  async create(dto: CreatePricingRuleDto, tenantId: string, userId: string) {
    // Validate at least one target or scope
    if (!dto.customerId && !dto.customerType && !dto.productId && !dto.categoryId) {
      throw new BadRequestException('At least one of customerId, customerType, productId, or categoryId must be specified');
    }

    const rule = await this.prisma.pricingRule.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        customerId: dto.customerId,
        customerType: dto.customerType,
        productId: dto.productId,
        categoryId: dto.categoryId,
        priceType: dto.priceType,
        value: dto.value,
        minQuantity: dto.minQuantity,
        maxQuantity: dto.maxQuantity,
        priority: dto.priority ?? 0,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      },
      include: {
        customer: { select: { id: true, user: { select: { name: true, businessName: true } } } },
        product: { select: { id: true, name: true, sku: true } },
        category: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      userId,
      action: AuditAction.PRICING_RULE_CREATED,
      entity: 'PricingRule',
      entityId: rule.id,
      after: rule as never,
      tenantId,
    });

    return rule;
  }

  async findAll(tenantId: string, filters?: {
    productId?: string;
    customerId?: string;
    customerType?: CustomerType;
    categoryId?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { productId, customerId, customerType, categoryId, active, page = 1, limit = 50 } = filters || {};
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (productId) where.productId = productId;
    if (customerId) where.customerId = customerId;
    if (customerType) where.customerType = customerType;
    if (categoryId) where.categoryId = categoryId;
    if (active !== undefined) where.isActive = active;

    const [data, total] = await Promise.all([
      this.prisma.pricingRule.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, user: { select: { name: true, businessName: true } } } },
          product: { select: { id: true, name: true, sku: true } },
          category: { select: { id: true, name: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.pricingRule.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, tenantId: string) {
    const rule = await this.prisma.pricingRule.findFirst({
      where: { id, tenantId },
      include: {
        customer: { select: { id: true, user: { select: { name: true, businessName: true } } } },
        product: { select: { id: true, name: true, sku: true } },
        category: { select: { id: true, name: true } },
      },
    });
    if (!rule) throw new NotFoundException('Pricing rule not found');
    return rule;
  }

  async update(id: string, dto: UpdatePricingRuleDto, tenantId: string, userId: string) {
    const before = await this.findOne(id, tenantId);

    const updated = await this.prisma.pricingRule.update({
      where: { id },
      data: {
        ...dto,
        value: dto.value !== undefined ? dto.value : undefined,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
      include: {
        customer: { select: { id: true, user: { select: { name: true, businessName: true } } } },
        product: { select: { id: true, name: true, sku: true } },
        category: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      userId,
      action: AuditAction.PRICING_RULE_UPDATED,
      entity: 'PricingRule',
      entityId: id,
      before: before as never,
      after: updated as never,
      tenantId,
    });

    return updated;
  }

  async remove(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.pricingRule.delete({ where: { id } });

    await this.audit.log({
      userId,
      action: AuditAction.PRICING_RULE_DELETED,
      entity: 'PricingRule',
      entityId: id,
      tenantId,
    });

    return { success: true };
  }

  // ─── PRICING ENGINE ───────────────────────────────────────

  /**
   * Resolve the effective price for a product + customer combination.
   *
   * Resolution order (highest priority wins):
   * 1. Customer-specific + Product-specific rule
   * 2. Customer-specific + Category rule
   * 3. CustomerType + Product rule
   * 4. CustomerType + Category rule
   * 5. Product-only rule (general discount)
   * 6. Category-only rule (general discount)
   * 7. Base product price (fallback)
   *
   * Within each level, quantity-based rules are checked.
   */
  async resolvePrice(
    tenantId: string,
    productId: string,
    customerId?: string,
    customerType?: CustomerType,
    quantity: number = 1,
  ): Promise<ResolvedPrice> {
    // Get product base price
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      select: { id: true, pricePerUnit: true, categoryId: true },
    });

    if (!product) throw new NotFoundException('Product not found');

    const basePrice = product.pricePerUnit;
    const now = new Date();

    // Fetch all applicable active rules for this tenant
    const rules = await this.prisma.pricingRule.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          // Customer-specific rules
          ...(customerId ? [
            { customerId, productId },
            { customerId, categoryId: product.categoryId },
            { customerId, productId: null, categoryId: null },
          ] : []),
          // CustomerType rules
          ...(customerType ? [
            { customerType, productId, customerId: null },
            { customerType, categoryId: product.categoryId, customerId: null },
            { customerType, productId: null, categoryId: null, customerId: null },
          ] : []),
          // General product/category rules
          { productId, customerId: null, customerType: null },
          { categoryId: product.categoryId, customerId: null, customerType: null, productId: null },
        ],
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
          { OR: [{ minQuantity: null }, { minQuantity: { lte: quantity } }] },
          { OR: [{ maxQuantity: null }, { maxQuantity: { gte: quantity } }] },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    if (rules.length === 0) {
      return {
        productId,
        basePrice,
        resolvedPrice: basePrice,
        discount: 0,
        ruleApplied: null,
        ruleName: null,
        priceType: null,
      };
    }

    // Score rules by specificity
    const scoredRules = rules.map((rule) => {
      let score = rule.priority * 1000;

      // Customer-specific > CustomerType > General
      if (rule.customerId) score += 400;
      else if (rule.customerType) score += 200;

      // Product-specific > Category > All
      if (rule.productId) score += 40;
      else if (rule.categoryId) score += 20;

      // Quantity-specific > any quantity
      if (rule.minQuantity && rule.minQuantity > 1) score += 5;

      return { rule, score };
    });

    // Sort by score descending and pick the best
    scoredRules.sort((a, b) => b.score - a.score);
    const bestRule = scoredRules[0].rule;

    // Calculate resolved price
    const ruleValue = Number(bestRule.value);
    let resolvedPrice: number;

    switch (bestRule.priceType) {
      case 'FIXED_PRICE':
        resolvedPrice = ruleValue;
        break;
      case 'PERCENTAGE_OFF':
        resolvedPrice = Math.round(basePrice * (1 - ruleValue / 100));
        break;
      case 'FLAT_DISCOUNT':
        resolvedPrice = Math.max(0, basePrice - ruleValue);
        break;
      default:
        resolvedPrice = basePrice;
    }

    return {
      productId,
      basePrice,
      resolvedPrice,
      discount: basePrice - resolvedPrice,
      ruleApplied: bestRule.id,
      ruleName: bestRule.name,
      priceType: bestRule.priceType,
    };
  }

  /**
   * Resolve prices for multiple products at once (for cart/catalogue).
   */
  async resolvePrices(
    tenantId: string,
    items: Array<{ productId: string; quantity?: number }>,
    customerId?: string,
    customerType?: CustomerType,
  ): Promise<ResolvedPrice[]> {
    return Promise.all(
      items.map((item) =>
        this.resolvePrice(tenantId, item.productId, customerId, customerType, item.quantity ?? 1),
      ),
    );
  }
}

import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { CustomerType } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomerDto, tenantId: string) {
    // Check if this user is already a customer for this tenant
    const existing = await this.prisma.customer.findUnique({
      where: { tenantId_userId: { tenantId, userId: dto.userId } },
    });
    if (existing) throw new ConflictException('Customer already exists for this tenant');

    // Verify user exists
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.customer.create({
      data: {
        tenantId,
        userId: dto.userId,
        customerType: dto.customerType,
        creditLimit: dto.creditLimit,
        paymentTerms: dto.paymentTerms,
        notes: dto.notes,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, businessName: true, address: true } },
      },
    });
  }

  async findAll(tenantId: string, filters?: {
    customerType?: CustomerType;
    active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { customerType, active, search, page = 1, limit = 20 } = filters || {};
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (customerType) where.customerType = customerType;
    if (active !== undefined) where.isActive = active;
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { businessName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, businessName: true, address: true } },
          _count: { select: { pricingRules: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, tenantId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, businessName: true, address: true } },
        pricingRules: {
          where: { isActive: true },
          include: {
            product: { select: { id: true, name: true, sku: true } },
            category: { select: { id: true, name: true } },
          },
          orderBy: { priority: 'desc' },
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  /**
   * Find customer record for a user within a tenant.
   */
  async findByUserId(userId: string, tenantId: string) {
    return this.prisma.customer.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, businessName: true } },
      },
    });
  }

  async update(id: string, dto: UpdateCustomerDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.customer.update({
      where: { id },
      data: dto,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, businessName: true, address: true } },
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.customer.delete({ where: { id } });
    return { success: true };
  }
}

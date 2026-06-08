import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTenantDto, UpdateTenantDto, OnboardTenantDto } from './dto/tenant.dto';
import { AuditAction, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateTenantDto, userId: string) {
    // Check slug uniqueness
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Tenant slug already exists');

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        domain: dto.domain,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        gstNumber: dto.gstNumber,
        panNumber: dto.panNumber,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        plan: dto.plan,
      },
    });

    // Link the creating user as OWNER of this tenant
    await this.prisma.tenantUser.create({
      data: { tenantId: tenant.id, userId, role: Role.OWNER },
    });

    await this.audit.log({
      userId,
      action: AuditAction.TENANT_CREATED,
      entity: 'Tenant',
      entityId: tenant.id,
      after: tenant as never,
    });

    return tenant;
  }

  /**
   * Full onboarding: creates tenant + owner user in one transaction.
   * Used for self-service SaaS signup.
   */
  async onboard(dto: OnboardTenantDto) {
    // Check slug uniqueness
    const existingTenant = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existingTenant) throw new ConflictException('Tenant slug already taken');

    // Check email uniqueness
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.ownerEmail } });
    if (existingUser) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.ownerPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          domain: dto.domain,
          contactEmail: dto.contactEmail || dto.ownerEmail,
          contactPhone: dto.contactPhone,
          gstNumber: dto.gstNumber,
          panNumber: dto.panNumber,
          address: dto.address,
          city: dto.city,
          state: dto.state,
          pincode: dto.pincode,
          plan: dto.plan,
        },
      });

      // Create owner user
      const user = await tx.user.create({
        data: {
          email: dto.ownerEmail,
          name: dto.ownerName,
          passwordHash,
          role: Role.OWNER,
          isActive: true,
          emailVerified: true,
          approvalStatus: 'APPROVED',
        },
      });

      // Link user to tenant
      await tx.tenantUser.create({
        data: { tenantId: tenant.id, userId: user.id, role: Role.OWNER },
      });

      // Create default app settings for tenant
      await tx.appSetting.create({
        data: {
          tenantId: tenant.id,
          companyName: dto.name,
        },
      });

      return { tenant, user };
    });

    return {
      tenant: result.tenant,
      owner: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      message: 'Tenant onboarded successfully',
    };
  }

  async findAll(page?: number, limit?: number) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;
    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { tenantUsers: true, products: true, orders: true } },
        },
      }),
      this.prisma.tenant.count(),
    ]);

    return { data, meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { tenantUsers: true, products: true, orders: true, customers: true } },
        tenantUsers: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
          take: 50,
        },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto, userId: string) {
    const before = await this.findOne(id);
    const updated = await this.prisma.tenant.update({ where: { id }, data: dto });

    await this.audit.log({
      userId,
      action: AuditAction.TENANT_UPDATED,
      entity: 'Tenant',
      entityId: id,
      before: before as never,
      after: updated as never,
    });

    return updated;
  }

  /**
   * Get all tenants a user belongs to.
   */
  async getTenantsForUser(userId: string) {
    const memberships = await this.prisma.tenantUser.findMany({
      where: { userId, isActive: true },
      include: {
        tenant: {
          select: {
            id: true, name: true, slug: true, logoUrl: true, plan: true, isActive: true,
          },
        },
      },
    });
    return memberships.map((m) => ({
      ...m.tenant,
      role: m.role,
    }));
  }

  /**
   * Add a user to a tenant.
   */
  async addUser(tenantId: string, userId: string, role: Role, performedBy: string) {
    const existing = await this.prisma.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    if (existing) throw new ConflictException('User already belongs to this tenant');

    return this.prisma.tenantUser.create({
      data: { tenantId, userId, role },
    });
  }

  /**
   * Remove a user from a tenant.
   */
  async removeUser(tenantId: string, userId: string) {
    return this.prisma.tenantUser.delete({
      where: { tenantId_userId: { tenantId, userId } },
    });
  }

  /**
   * Remove a tenant entirely. Prevent deletion if tenant has linked products/orders/customers.
   */
  async remove(id: string, performedBy: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const [productCount, orderCount, customerCount] = await Promise.all([
      this.prisma.product.count({ where: { tenantId: id } }),
      this.prisma.order.count({ where: { tenantId: id } }),
      this.prisma.customer.count({ where: { tenantId: id } }),
    ]);

    if (productCount > 0 || orderCount > 0 || customerCount > 0) {
      throw new BadRequestException('Tenant has associated data and cannot be deleted');
    }

    // remove tenant users and settings first to keep referential integrity
    await this.prisma.tenantUser.deleteMany({ where: { tenantId: id } });
    await this.prisma.appSetting.deleteMany({ where: { tenantId: id } });

    const deleted = await this.prisma.tenant.delete({ where: { id } });

    await this.audit.log({
      userId: performedBy,
      action: AuditAction.TENANT_DELETED,
      entity: 'Tenant',
      entityId: id,
      before: tenant as never,
    });

    return deleted;
  }
}

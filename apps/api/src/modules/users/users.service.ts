import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto/user.dto';
import { ApprovalStatus, AuditAction, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const USER_SELECT = {
  id: true, email: true, name: true, role: true, isActive: true,
  phone: true, businessName: true, address: true, createdAt: true,
  profileImageUrl: true,
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateUserDto, createdById: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: dto.role ?? Role.CUSTOMER,
        phone: dto.phone,
        businessName: dto.businessName,
        address: dto.address,
        isActive: true,
        // If the Owner is creating the account, treat it as "admin-provisioned":
        // - no email verification loop
        // - no separate approval loop
        emailVerified: true,
        approvalStatus: ApprovalStatus.APPROVED,
        approvedBy: createdById,
        approvedAt: new Date(),
      },
      select: USER_SELECT,
    });

    await this.auditService.log({
      userId: createdById,
      action: AuditAction.USER_CREATED,
      entity: 'User',
      entityId: user.id,
      after: user as Record<string, unknown>,
    });

    return user;
  }

  async findAll(page = 1, limit = 20, role?: Role, includeInactive = false) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (!includeInactive) where.isActive = true;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: where as never, skip, take: limit,
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: where as never }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getSupportContacts() {
    const owner = await this.prisma.user.findFirst({
      where: { role: Role.OWNER, isActive: true },
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { createdAt: 'asc' },
    });

    const staff = await this.prisma.user.findMany({
      where: { role: Role.STAFF, isActive: true },
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { name: 'asc' },
    });

    return { owner, staff };
  }

  async update(id: string, dto: UpdateUserDto, updatedById: string) {
    const user = await this.findOne(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SELECT,
    });

    await this.auditService.log({
      userId: updatedById,
      action: AuditAction.USER_UPDATED,
      entity: 'User',
      entityId: id,
      before: user as Record<string, unknown>,
      after: updated as Record<string, unknown>,
    });

    return updated;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const data: Record<string, unknown> = { ...dto };
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
      delete data.password;
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  async deactivate(id: string, deactivatedById: string) {
    if (id === deactivatedById) throw new ForbiddenException('Cannot deactivate yourself');
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: USER_SELECT,
    });

    await this.auditService.log({
      userId: deactivatedById,
      action: AuditAction.USER_DEACTIVATED,
      entity: 'User',
      entityId: id,
    });

    return updated;
  }

  async removePermanent(id: string, removedById: string) {
    if (id === removedById) throw new ForbiddenException('Cannot delete yourself');

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === Role.OWNER) {
      throw new ForbiddenException('Owner accounts cannot be permanently deleted');
    }

    await this.prisma.$transaction(async (tx) => {
      // Orders where this user acted as approver should remain; detach approver reference.
      await tx.order.updateMany({
        where: { approvedById: id },
        data: { approvedById: null, approvedAt: null },
      });

      // Remove customer orders (cascades items + status history)
      await tx.order.deleteMany({ where: { customerId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.auditLog.deleteMany({ where: { userId: id } });
      await tx.invitation.updateMany({
        where: { usedBy: id },
        data: { usedBy: null },
      });

      await tx.user.delete({ where: { id } });
    });

    await this.auditService.log({
      userId: removedById,
      action: AuditAction.USER_DEACTIVATED,
      entity: 'User',
      entityId: id,
      after: { permanentDelete: true } as Record<string, unknown>,
    });

    return { success: true };
  }

  async reactivate(id: string, reactivatedById: string) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: USER_SELECT,
    });

    await this.auditService.log({
      userId: reactivatedById,
      action: AuditAction.USER_UPDATED,
      entity: 'User',
      entityId: id,
    });

    return updated;
  }
}

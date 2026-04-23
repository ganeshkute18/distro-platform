import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto/user.dto';
import { AuditAction, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const USER_SELECT = {
  id: true, email: true, name: true, role: true, isActive: true,
  phone: true, businessName: true, address: true, createdAt: true,
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

  async findAll(page = 1, limit = 20, role?: Role) {
    const skip = (page - 1) * limit;
    const where = role ? { role } : {};

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip, take: limit,
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return user;
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
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAgencyDto, UpdateAgencyDto } from './dto/agency.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AgenciesService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(dto: CreateAgencyDto, userId: string) {
    const agency = await this.prisma.agency.create({ data: dto });
    await this.audit.log({ userId, action: AuditAction.AGENCY_CREATED, entity: 'Agency', entityId: agency.id, after: agency as never });
    return agency;
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.agency.findMany({ skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.agency.count(),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const a = await this.prisma.agency.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Agency not found');
    return a;
  }

  async update(id: string, dto: UpdateAgencyDto, userId: string) {
    const before = await this.findOne(id);
    const after = await this.prisma.agency.update({ where: { id }, data: dto });
    await this.audit.log({ userId, action: AuditAction.AGENCY_UPDATED, entity: 'Agency', entityId: id, before: before as never, after: after as never });
    return after;
  }

  async remove(id: string) {
    const linkedProducts = await this.prisma.product.count({ where: { agencyId: id } });
    if (linkedProducts > 0) {
      throw new BadRequestException('Cannot delete agency with linked products');
    }
    return this.prisma.agency.delete({ where: { id } });
  }
}

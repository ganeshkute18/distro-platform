import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAgencyDto, UpdateAgencyDto } from './dto/agency.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';
import { tenantWhere, tenantFindOne, assertTenantId } from '../../common/helpers/tenant-query.helper';

@Injectable()
export class AgenciesService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(dto: CreateAgencyDto, userId: string, tenantId: string) {
    assertTenantId(tenantId);
    const agency = await this.prisma.agency.create({
      data: { ...dto, tenantId },
    });
    await this.audit.log({
      userId, action: AuditAction.AGENCY_CREATED,
      entity: 'Agency', entityId: agency.id,
      after: agency as never, tenantId,
    });
    return agency;
  }

  async findAll(tenantId: string, page = 1, limit = 20) {
    assertTenantId(tenantId);
    const skip = (page - 1) * limit;
    const where = tenantWhere(tenantId);
    const [data, total] = await Promise.all([
      this.prisma.agency.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.agency.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, tenantId: string) {
    assertTenantId(tenantId);
    const a = await this.prisma.agency.findFirst({
      where: tenantFindOne(id, tenantId),
      include: { products: { select: { id: true, name: true, sku: true }, take: 20 } },
    });
    if (!a) throw new NotFoundException('Agency not found');
    return a;
  }

  async update(id: string, dto: UpdateAgencyDto, userId: string, tenantId: string) {
    assertTenantId(tenantId);
    const before = await this.findOne(id, tenantId);
    const after = await this.prisma.agency.update({ where: { id }, data: dto });
    await this.audit.log({
      userId, action: AuditAction.AGENCY_UPDATED,
      entity: 'Agency', entityId: id,
      before: before as never, after: after as never, tenantId,
    });
    return after;
  }

  async remove(id: string, tenantId: string) {
    assertTenantId(tenantId);
    await this.findOne(id, tenantId);
    const linkedProducts = await this.prisma.product.count({ where: { agencyId: id } });
    if (linkedProducts > 0) {
      throw new BadRequestException('Cannot delete agency with linked products');
    }
    return this.prisma.agency.delete({ where: { id } });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    const existing = await (this.prisma as any).appSetting.findFirst({
      where: { tenantId },
    });
    if (existing) return existing;

    return (this.prisma as any).appSetting.create({
      data: { companyName: 'Nath Sales', tenantId },
    });
  }

  async updateSettings(dto: UpdateSettingsDto, tenantId: string) {
    const existing = await (this.prisma as any).appSetting.findFirst({
      where: { tenantId },
      select: { id: true },
    });

    if (!existing) {
      return (this.prisma as any).appSetting.create({
        data: { companyName: dto.companyName ?? 'Nath Sales', tenantId, ...dto },
      });
    }

    return (this.prisma as any).appSetting.update({
      where: { id: existing.id },
      data: dto,
    });
  }
}

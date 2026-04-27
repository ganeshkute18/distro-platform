import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    const existing = await (this.prisma as any).appSetting.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (existing) return existing;

    return (this.prisma as any).appSetting.create({
      data: { companyName: 'Nath Sales' },
    });
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const existing = await (this.prisma as any).appSetting.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!existing) {
      return (this.prisma as any).appSetting.create({
        data: { companyName: dto.companyName ?? 'Nath Sales', ...dto },
      });
    }

    return (this.prisma as any).appSetting.update({
      where: { id: existing.id },
      data: dto,
    });
  }
}


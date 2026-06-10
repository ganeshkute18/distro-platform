import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/settings.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentTenant, TenantRequired } from '../../common/decorators/tenant.decorator';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @TenantRequired()
  @Get()
  getSettings(@CurrentTenant() tenantId: string) {
    return this.settingsService.getSettings(tenantId);
  }

  @ApiBearerAuth()
  @Roles(Role.OWNER)
  @TenantRequired()
  @Patch()
  updateSettings(@Body() dto: UpdateSettingsDto, @CurrentTenant() tenantId: string) {
    return this.settingsService.updateSettings(dto, tenantId);
  }
}

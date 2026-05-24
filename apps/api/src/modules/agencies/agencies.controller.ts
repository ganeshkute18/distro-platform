import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto, UpdateAgencyDto } from './dto/agency.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant, TenantRequired } from '../../common/decorators/tenant.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Agencies')
@ApiBearerAuth()
@TenantRequired()
@Controller('agencies')
export class AgenciesController {
  constructor(private service: AgenciesService) {}

  @Get()
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAll(tenantId, Number(page), Number(limit));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  @Roles(Role.OWNER)
  @Post()
  create(@Body() dto: CreateAgencyDto, @CurrentUser() user: User, @CurrentTenant() tenantId: string) {
    return this.service.create(dto, user.id, tenantId);
  }

  @Roles(Role.OWNER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAgencyDto,
    @CurrentUser() user: User,
    @CurrentTenant() tenantId: string,
  ) {
    return this.service.update(id, dto, user.id, tenantId);
  }

  @Roles(Role.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.service.remove(id, tenantId);
  }
}

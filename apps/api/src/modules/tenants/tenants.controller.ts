import {
  Controller, Get, Post, Patch, Body, Param, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, OnboardTenantDto } from './dto/tenant.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private service: TenantsService) {}

  /**
   * Self-service onboarding: creates a new tenant + owner user.
   * Public endpoint for SaaS signup.
   */
  @Public()
  @Post('onboard')
  onboard(@Body() dto: OnboardTenantDto) {
    return this.service.onboard(dto);
  }

  /**
   * Create a new tenant (owner only, for existing users).
   */
  @Roles(Role.OWNER)
  @Post()
  create(@Body() dto: CreateTenantDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.id);
  }

  /**
   * List all tenants (super-admin or owner).
   */
  @Roles(Role.OWNER)
  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.findAll(page, limit);
  }

  /**
   * Get tenants for the current user.
   */
  @Get('my')
  getMyTenants(@CurrentUser() user: User) {
    return this.service.getTenantsForUser(user.id);
  }

  /**
   * Resolve tenant by slug (public for login/discovery).
   */
  @Public()
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Roles(Role.OWNER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.OWNER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto, @CurrentUser() user: User) {
    return this.service.update(id, dto, user.id);
  }

  @Roles(Role.OWNER)
  @Post(':id/users/:userId')
  addUser(
    @Param('id') tenantId: string,
    @Param('userId') userId: string,
    @Body('role') role: Role,
    @CurrentUser() user: User,
  ) {
    return this.service.addUser(tenantId, userId, role, user.id);
  }
}

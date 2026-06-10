import {
  Controller, Get, Post, Patch, Body, Param, Query, Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, OnboardTenantDto, ResetTenantUserPasswordDto } from './dto/tenant.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private service: TenantsService) {}

  /**
   * Onboard a new tenant + owner user.
   * Restricted to PLATFORM_ADMIN — not a public endpoint.
   */
  @Roles(Role.PLATFORM_ADMIN)
  @Post('onboard')
  onboard(@Body() dto: OnboardTenantDto, @CurrentUser() user: User) {
    return this.service.onboard(dto, user.id);
  }

  /**
   * Create a new tenant (PLATFORM_ADMIN only).
   */
  @Roles(Role.PLATFORM_ADMIN)
  @Post()
  create(@Body() dto: CreateTenantDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.id);
  }

  /**
   * List all tenants (PLATFORM_ADMIN only).
   */
  @Roles(Role.PLATFORM_ADMIN)
  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.findAll(page, limit);
  }

  /**
   * Get tenants the current user belongs to.
   * Available to any authenticated user.
   */
  @Get('my')
  getMyTenants(@CurrentUser() user: User) {
    return this.service.getTenantsForUser(user.id);
  }

  /**
   * Resolve tenant by slug (public for login/discovery).
   */
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  /**
   * Get a specific tenant (PLATFORM_ADMIN or the tenant's OWNER).
   */
  @Roles(Role.PLATFORM_ADMIN, Role.OWNER)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOneForUser(id, user.id, user.role);
  }

  /**
   * Update a tenant (PLATFORM_ADMIN only).
   */
  @Roles(Role.PLATFORM_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto, @CurrentUser() user: User) {
    return this.service.update(id, dto, user.id);
  }

  /**
   * Delete a tenant (PLATFORM_ADMIN only).
   */
  @Roles(Role.PLATFORM_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.remove(id, user.id);
  }

  /**
   * Add a user to a tenant (PLATFORM_ADMIN only).
   */
  @Roles(Role.PLATFORM_ADMIN)
  @Post(':id/users/:userId')
  addUser(
    @Param('id') tenantId: string,
    @Param('userId') userId: string,
    @Body('role') role: Role,
    @CurrentUser() user: User,
  ) {
    return this.service.addUser(tenantId, userId, role, user.id);
  }

  @Roles(Role.PLATFORM_ADMIN)
  @Get(':id/available-users')
  findAvailableUsers(@Param('id') tenantId: string, @Query('email') email?: string) {
    return this.service.findAvailableUsers(tenantId, email);
  }

  @Roles(Role.PLATFORM_ADMIN)
  @Delete(':id/users/:userId')
  removeUser(@Param('id') tenantId: string, @Param('userId') userId: string) {
    return this.service.removeUser(tenantId, userId);
  }

  @Roles(Role.PLATFORM_ADMIN)
  @Post(':id/users/:userId/reset-password')
  resetUserPassword(
    @Param('id') tenantId: string,
    @Param('userId') userId: string,
    @Body() dto: ResetTenantUserPasswordDto,
    @CurrentUser() user: User,
  ) {
    return this.service.resetUserPassword(tenantId, userId, dto.password, user.id);
  }

  @Roles(Role.PLATFORM_ADMIN)
  @Post(':id/users/:userId/suspend')
  suspendUser(@Param('id') tenantId: string, @Param('userId') userId: string, @CurrentUser() user: User) {
    return this.service.setUserActive(tenantId, userId, false, user.id);
  }

  @Roles(Role.PLATFORM_ADMIN)
  @Post(':id/users/:userId/activate')
  activateUser(@Param('id') tenantId: string, @Param('userId') userId: string, @CurrentUser() user: User) {
    return this.service.setUserActive(tenantId, userId, true, user.id);
  }

  @Roles(Role.PLATFORM_ADMIN)
  @Post(':id/transfer-ownership/:userId')
  transferOwnership(@Param('id') tenantId: string, @Param('userId') userId: string, @CurrentUser() user: User) {
    return this.service.transferOwnership(tenantId, userId, user.id);
  }
}

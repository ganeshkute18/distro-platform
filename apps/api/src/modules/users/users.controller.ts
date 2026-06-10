import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto/user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant, TenantRequired } from '../../common/decorators/tenant.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: User) {
    return this.usersService.findOne(user.id);
  }

  @Get('support-contacts')
  @TenantRequired()
  getSupportContacts(@CurrentTenant() tenantId: string) {
    return this.usersService.getSupportContacts(tenantId);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Roles(Role.OWNER)
  @TenantRequired()
  @Get()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'role', enum: Role, required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('role') role?: Role,
    @Query('includeInactive') includeInactive?: string | boolean,
    @CurrentTenant() tenantId?: string,
  ) {
    const includeInactiveBool =
      includeInactive === true || includeInactive === 'true' || includeInactive === '1';
    return this.usersService.findAll(tenantId!, Number(page), Number(limit), role, includeInactiveBool);
  }

  @Roles(Role.OWNER)
  @TenantRequired()
  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() user: User, @CurrentTenant() tenantId: string) {
    return this.usersService.create(dto, user.id, tenantId);
  }

  @Roles(Role.OWNER)
  @TenantRequired()
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.usersService.findOneForTenant(id, tenantId);
  }

  @Roles(Role.OWNER)
  @TenantRequired()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: User, @CurrentTenant() tenantId: string) {
    return this.usersService.update(id, dto, user.id, tenantId);
  }

  @Roles(Role.OWNER)
  @TenantRequired()
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: User, @CurrentTenant() tenantId: string) {
    return this.usersService.deactivate(id, user.id, tenantId);
  }

  @Roles(Role.OWNER)
  @TenantRequired()
  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  reactivate(@Param('id') id: string, @CurrentUser() user: User, @CurrentTenant() tenantId: string) {
    return this.usersService.reactivate(id, user.id, tenantId);
  }
}

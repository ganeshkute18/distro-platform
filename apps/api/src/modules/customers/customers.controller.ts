import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { Role, CustomerType } from '@prisma/client';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private service: CustomersService) {}

  @Roles(Role.OWNER)
  @Post()
  create(@Body() dto: CreateCustomerDto, @CurrentTenant() tenantId: string) {
    return this.service.create(dto, tenantId);
  }

  @Roles(Role.OWNER, Role.STAFF)
  @Get()
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('customerType') customerType?: CustomerType,
    @Query('active') active?: boolean,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.findAll(tenantId, { customerType, active, search, page, limit });
  }

  @Roles(Role.OWNER, Role.STAFF)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  @Roles(Role.OWNER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @CurrentTenant() tenantId: string) {
    return this.service.update(id, dto, tenantId);
  }

  @Roles(Role.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.service.remove(id, tenantId);
  }
}

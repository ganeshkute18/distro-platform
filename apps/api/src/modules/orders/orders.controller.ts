import {
  Controller, Get, Post, Patch, Body, Param, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto, RejectOrderDto, UpdateOrderStatusDto, OrderQueryDto,
} from './dto/order.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private service: OrdersService) {}

  @Roles(Role.CUSTOMER)
  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.id);
  }

  @Get()
  findAll(@Query() query: OrderQueryDto, @CurrentUser() user: User) {
    return this.service.findAll(query, { id: user.id, role: user.role });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, { id: user.id, role: user.role });
  }

  @Roles(Role.OWNER)
  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.approve(id, user.id);
  }

  @Roles(Role.OWNER)
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectOrderDto, @CurrentUser() user: User) {
    return this.service.reject(id, dto, user.id);
  }

  @Roles(Role.STAFF, Role.OWNER)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto, @CurrentUser() user: User) {
    return this.service.updateStatus(id, dto, user.id);
  }

  @Roles(Role.CUSTOMER)
  @Post(':id/repeat')
  repeatOrder(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.repeatOrder(id, user.id);
  }
}

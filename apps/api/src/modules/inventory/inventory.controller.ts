import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { AdjustInventoryDto } from './dto/inventory.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private service: InventoryService) {}

  @Roles(Role.OWNER, Role.STAFF)
  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.service.findAll(Number(page), Number(limit), lowStock === 'true');
  }

  @Roles(Role.OWNER, Role.STAFF)
  @Get(':productId')
  findByProduct(@Param('productId') productId: string) {
    return this.service.findByProduct(productId);
  }

  @Roles(Role.OWNER)
  @Post(':productId/adjust')
  adjust(
    @Param('productId') productId: string,
    @Body() dto: AdjustInventoryDto,
    @CurrentUser() user: User,
  ) {
    return this.service.adjust(productId, dto.delta, dto.reason, user.id);
  }

  @Roles(Role.OWNER, Role.STAFF)
  @Get(':productId/history')
  getHistory(
    @Param('productId') productId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.getHistory(productId, Number(page), Number(limit));
  }
}

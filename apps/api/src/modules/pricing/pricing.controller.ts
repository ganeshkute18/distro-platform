import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { CreatePricingRuleDto, UpdatePricingRuleDto, ResolvePriceDto, BulkResolvePriceDto } from './dto/pricing.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { Role, User, CustomerType } from '@prisma/client';

@ApiTags('Pricing')
@ApiBearerAuth()
@Controller('pricing')
export class PricingController {
  constructor(private service: PricingService) {}

  /**
   * Create a new pricing rule (OWNER only).
   */
  @Roles(Role.OWNER)
  @Post('rules')
  create(
    @Body() dto: CreatePricingRuleDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.create(dto, tenantId, user.id);
  }

  /**
   * List pricing rules for the tenant.
   */
  @Roles(Role.OWNER, Role.STAFF)
  @Get('rules')
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('productId') productId?: string,
    @Query('customerId') customerId?: string,
    @Query('customerType') customerType?: CustomerType,
    @Query('categoryId') categoryId?: string,
    @Query('active') active?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.findAll(tenantId, {
      productId, customerId, customerType, categoryId, active, page, limit,
    });
  }

  /**
   * Get a specific pricing rule.
   */
  @Roles(Role.OWNER)
  @Get('rules/:id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  /**
   * Update a pricing rule.
   */
  @Roles(Role.OWNER)
  @Patch('rules/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePricingRuleDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, dto, tenantId, user.id);
  }

  /**
   * Delete a pricing rule.
   */
  @Roles(Role.OWNER)
  @Delete('rules/:id')
  remove(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.remove(id, tenantId, user.id);
  }

  /**
   * Resolve price for a single product (used by frontend catalogue/cart).
   */
  @Post('resolve')
  resolvePrice(
    @Body() dto: ResolvePriceDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.service.resolvePrice(
      tenantId, dto.productId, dto.customerId, dto.customerType, dto.quantity,
    );
  }

  /**
   * Resolve prices for multiple products at once (bulk).
   */
  @Post('resolve/bulk')
  resolvePrices(
    @Body() dto: BulkResolvePriceDto,
    @CurrentTenant() tenantId: string,
    @Query('customerId') customerId?: string,
    @Query('customerType') customerType?: CustomerType,
  ) {
    return this.service.resolvePrices(tenantId, dto.items, customerId, customerType);
  }
}

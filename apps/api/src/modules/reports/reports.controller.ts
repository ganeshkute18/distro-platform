import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant, TenantRequired } from '../../common/decorators/tenant.decorator';
import { Role } from '@prisma/client';

@ApiTags('Reports')
@ApiBearerAuth()
@Roles(Role.OWNER)
@TenantRequired()
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('sales-summary')
  salesSummary(@CurrentTenant() tenantId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.salesSummary(tenantId, from, to);
  }

  @Get('top-products')
  topProducts(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit = 10,
  ) {
    return this.service.topProducts(tenantId, from, to, Number(limit));
  }

  @Get('pending-orders')
  pendingOrders(@CurrentTenant() tenantId: string) {
    return this.service.pendingOrders(tenantId);
  }

  @Get('low-stock')
  lowStock(@CurrentTenant() tenantId: string) {
    return this.service.lowStockReport(tenantId);
  }

  @Get('customer-frequency')
  customerFrequency(@CurrentTenant() tenantId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.customerFrequency(tenantId, from, to);
  }

  @Get('dashboard')
  dashboard(@CurrentTenant() tenantId: string) {
    return this.service.dashboard(tenantId);
  }
}

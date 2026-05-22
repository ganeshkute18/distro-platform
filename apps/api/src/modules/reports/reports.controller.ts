import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { Role } from '@prisma/client';

@ApiTags('Reports')
@ApiBearerAuth()
@Roles(Role.OWNER)
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('sales-summary')
  salesSummary(@Query('from') from?: string, @Query('to') to?: string, @CurrentTenant() tenantId?: string) {
    return this.service.salesSummary(from, to, tenantId);
  }

  @Get('top-products')
  topProducts(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit = 10,
    @CurrentTenant() tenantId?: string,
  ) {
    return this.service.topProducts(from, to, Number(limit), tenantId);
  }

  @Get('pending-orders')
  pendingOrders(@CurrentTenant() tenantId?: string) {
    return this.service.pendingOrders(tenantId);
  }

  @Get('low-stock')
  lowStock(@CurrentTenant() tenantId?: string) {
    return this.service.lowStockReport(tenantId);
  }

  @Get('customer-frequency')
  customerFrequency(@Query('from') from?: string, @Query('to') to?: string, @CurrentTenant() tenantId?: string) {
    return this.service.customerFrequency(from, to, tenantId);
  }

  @Get('dashboard')
  dashboard(@CurrentTenant() tenantId?: string) {
    return this.service.dashboard(tenantId);
  }
}

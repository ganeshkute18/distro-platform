import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Reports')
@ApiBearerAuth()
@Roles(Role.OWNER)
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('sales-summary')
  salesSummary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.salesSummary(from, to);
  }

  @Get('top-products')
  topProducts(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit = 10,
  ) {
    return this.service.topProducts(from, to, Number(limit));
  }

  @Get('pending-orders')
  pendingOrders() {
    return this.service.pendingOrders();
  }

  @Get('low-stock')
  lowStock() {
    return this.service.lowStockReport();
  }

  @Get('customer-frequency')
  customerFrequency(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.customerFrequency(from, to);
  }

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }
}

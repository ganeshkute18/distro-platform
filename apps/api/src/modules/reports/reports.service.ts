import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async salesSummary(from?: string, to?: string) {
    const where: Record<string, unknown> = {
      status: { in: [OrderStatus.DISPATCHED, OrderStatus.DELIVERED] },
    };
    if (from || to) {
      where.createdAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }

    const orders = await this.prisma.order.findMany({
      where,
      select: { totalAmount: true, taxAmount: true, createdAt: true, status: true },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalTax = orders.reduce((sum, o) => sum + o.taxAmount, 0);
    const totalOrders = orders.length;

    // Group by date
    const byDate = orders.reduce<Record<string, { orders: number; revenue: number }>>((acc, o) => {
      const date = o.createdAt.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { orders: 0, revenue: 0 };
      acc[date].orders++;
      acc[date].revenue += o.totalAmount;
      return acc;
    }, {});

    return {
      totalRevenue,
      totalTax,
      netRevenue: totalRevenue - totalTax,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      dailyBreakdown: Object.entries(byDate)
        .map(([date, val]) => ({ date, ...val }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async topProducts(from?: string, to?: string, limit = 10) {
    const where: Record<string, unknown> = {
      order: { status: { in: [OrderStatus.DISPATCHED, OrderStatus.DELIVERED] } },
    };
    if (from || to) {
      where.order = {
        ...(where.order as Record<string, unknown>),
        createdAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      };
    }

    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where,
      _sum: { quantity: true, subtotal: true },
      _count: { id: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: Number(limit),
    });

    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sku: true, name: true, unitType: true, agency: { select: { name: true } } },
    });

    return items.map((item) => ({
      product: products.find((p) => p.id === item.productId),
      totalQuantity: item._sum.quantity,
      totalRevenue: item._sum.subtotal,
      orderCount: item._count.id,
    }));
  }

  async pendingOrders() {
    const [pending, byAge] = await Promise.all([
      this.prisma.order.findMany({
        where: { status: OrderStatus.PENDING_APPROVAL },
        include: {
          customer: { select: { name: true, businessName: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { status: { in: [OrderStatus.PENDING_APPROVAL, OrderStatus.APPROVED, OrderStatus.PROCESSING] } },
      }),
    ]);

    return {
      pendingApproval: pending.map((o) => ({
        ...o,
        ageInHours: Math.floor((Date.now() - o.createdAt.getTime()) / 3600000),
      })),
      statusCounts: byAge,
    };
  }

  async lowStockReport() {
    const inventory = await this.prisma.inventory.findMany({
      include: {
        product: {
          select: { id: true, sku: true, name: true, isActive: true, agency: { select: { name: true } } },
        },
      },
    });

    const lowStock = inventory
      .filter((inv) => inv.totalStock - inv.reservedStock <= inv.lowStockThreshold && inv.product.isActive)
      .map((inv) => ({
        product: inv.product,
        totalStock: inv.totalStock,
        reservedStock: inv.reservedStock,
        availableStock: inv.totalStock - inv.reservedStock,
        threshold: inv.lowStockThreshold,
        deficit: inv.lowStockThreshold - (inv.totalStock - inv.reservedStock),
      }))
      .sort((a, b) => a.availableStock - b.availableStock);

    return { count: lowStock.length, items: lowStock };
  }

  async customerFrequency(from?: string, to?: string) {
    const where: any = {
      status: { in: [OrderStatus.APPROVED, OrderStatus.PROCESSING, OrderStatus.DISPATCHED, OrderStatus.DELIVERED] },
    };
    if (from || to) {
      where.createdAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }

    const grouped = await this.prisma.order.groupBy({
      by: ['customerId'],
      where,
      _count: { id: true },
      _sum: { totalAmount: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    const customerIds = grouped.map((g) => g.customerId);
    const customers = await this.prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, businessName: true, email: true, phone: true },
    });

    return grouped.map((g) => ({
      customer: customers.find((c) => c.id === g.customerId),
      orderCount: g._count.id,
      totalSpend: g._sum.totalAmount,
    }));
  }

  async dashboard() {
    const [totalOrders, pendingApproval, todayOrders, recentOrders, revenue] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING_APPROVAL } }),
      this.prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, businessName: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.DELIVERED },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      stats: {
        totalOrders,
        pendingApproval,
        todayOrders,
        totalRevenue: revenue._sum.totalAmount ?? 0,
      },
      recentOrders,
    };
  }
}

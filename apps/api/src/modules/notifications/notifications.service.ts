import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Order, Role } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, title: string, message: string, type: string, referenceId?: string) {
    return this.prisma.notification.create({
      data: { userId, title, message, type, referenceId },
    });
  }

  async findForUser(userId: string, page = 1, limit = 20, unreadOnly = false) {
    const skip = (page - 1) * limit;
    const where = { userId, ...(unreadOnly ? { isRead: false } : {}) };

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit), unreadCount } };
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // ─── Event Listeners ──────────────────────────────────────

  @OnEvent('order.created')
  async handleOrderCreated(order: Order & { customer?: { name: string } }) {
    // Notify all owners
    const owners = await this.prisma.user.findMany({
      where: { role: Role.OWNER, isActive: true },
      select: { id: true },
    });

    await Promise.all(
      owners.map((owner) =>
        this.create(
          owner.id,
          '🆕 New Order Pending Approval',
          `Order #${(order as never as { orderNumber: string }).orderNumber} requires your approval`,
          'ORDER_PLACED',
          order.id,
        ),
      ),
    );
  }

  @OnEvent('order.approved')
  async handleOrderApproved(order: Order & { orderNumber?: string }) {
    // Notify staff
    const staff = await this.prisma.user.findMany({
      where: { role: Role.STAFF, isActive: true },
      select: { id: true },
    });

    await Promise.all(
      staff.map((s) =>
        this.create(
          s.id,
          '✅ Order Ready to Process',
          `Order #${(order as never as { orderNumber: string }).orderNumber} has been approved`,
          'ORDER_APPROVED',
          order.id,
        ),
      ),
    );

    // Notify customer
    await this.create(
      order.customerId,
      '✅ Your Order is Approved',
      `Order #${(order as never as { orderNumber: string }).orderNumber} has been approved and will be processed soon`,
      'ORDER_APPROVED',
      order.id,
    );
  }

  @OnEvent('order.rejected')
  async handleOrderRejected(order: Order) {
    await this.create(
      order.customerId,
      '❌ Order Rejected',
      `Order #${(order as never as { orderNumber: string }).orderNumber} was rejected. Reason: ${order.rejectionReason}`,
      'ORDER_REJECTED',
      order.id,
    );
  }

  @OnEvent('order.dispatched')
  async handleOrderDispatched(order: Order) {
    await this.create(
      order.customerId,
      '🚚 Order Dispatched',
      `Order #${(order as never as { orderNumber: string }).orderNumber} is on its way!`,
      'ORDER_DISPATCHED',
      order.id,
    );
  }

  @OnEvent('order.delivered')
  async handleOrderDelivered(order: Order) {
    await this.create(
      order.customerId,
      '📦 Order Delivered',
      `Order #${(order as never as { orderNumber: string }).orderNumber} has been delivered`,
      'ORDER_DELIVERED',
      order.id,
    );
  }

  @OnEvent('inventory.lowStock')
  async handleLowStock(payload: { productId: string; available: number; threshold: number }) {
    const product = await this.prisma.product.findUnique({
      where: { id: payload.productId },
      select: { name: true, sku: true },
    });
    if (!product) return;

    const owners = await this.prisma.user.findMany({
      where: { role: Role.OWNER, isActive: true },
      select: { id: true },
    });

    await Promise.all(
      owners.map((owner) =>
        this.create(
          owner.id,
          '⚠️ Low Stock Alert',
          `${product.name} (${product.sku}) is running low. Available: ${payload.available}`,
          'LOW_STOCK',
          payload.productId,
        ),
      ),
    );
  }
}

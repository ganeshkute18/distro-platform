import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Order, Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

const PUSH_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelayMs: 1000,
};

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService, private config: ConfigService) {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT', 'mailto:support@nathsales.local');
    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    }
  }

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

  async savePushSubscription(userId: string, endpoint: string, p256dh: string, auth: string) {
    return (this.prisma as any).pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh, auth, userId },
      create: { endpoint, p256dh, auth, userId },
    });
  }

  async removePushSubscription(userId: string, endpoint: string) {
    await (this.prisma as any).pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return { success: true };
  }

  // ─── Push Notification with Retry + Error Handling ───
  private async sendPushWithRetry(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: string,
    retries = 0,
  ): Promise<boolean> {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        payload,
      );
      return true;
    } catch (error: any) {
      // Handle subscription no longer valid (410 Gone, 404 Not Found)
      if (error.statusCode === 410 || error.statusCode === 404) {
        await (this.prisma as any).pushSubscription.deleteMany({
          where: { endpoint: subscription.endpoint },
        });
        return false;
      }

      // Retry on other network/temporary errors
      if (retries < PUSH_RETRY_CONFIG.maxRetries && error.statusCode >= 500) {
        await new Promise((resolve) => setTimeout(resolve, PUSH_RETRY_CONFIG.retryDelayMs));
        return this.sendPushWithRetry(subscription, payload, retries + 1);
      }

      console.error(`Push notification failed for ${subscription.endpoint}:`, error.message);
      return false;
    }
  }

  private async sendPushToUsers(userIds: string[], title: string, message: string, url: string) {
    if (!userIds.length) return;

    const subs = await (this.prisma as any).pushSubscription.findMany({
      where: { userId: { in: userIds } },
    });
    if (!subs.length) return;

    const payload = JSON.stringify({ title, message, url });

    // Send with better error handling and retries
    const results = await Promise.allSettled(
      subs.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
        this.sendPushWithRetry(sub, payload),
      ),
    );

    // Log metrics (successful vs failed)
    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value).length;
    if (successCount < results.length) {
      console.warn(
        `Push notifications: ${successCount}/${results.length} delivered (${results.length - successCount} failed)`,
      );
    }
  }

  // ─── Event Listeners ──────────────────────────────────────

  @OnEvent('order.created')
  async handleOrderCreated(order: Order & { customer?: { name: string } }) {
    const owners = await this.prisma.user.findMany({
      where: { role: Role.OWNER, isActive: true },
      select: { id: true },
    });

    const title = '🆕 New Order Pending Approval';
    const message = `Order #${(order as never as { orderNumber: string }).orderNumber} was placed and is pending approval`;

    await Promise.all([...owners.map((o) => this.create(o.id, title, message, 'ORDER_PLACED', order.id))]);
    await this.sendPushToUsers(owners.map((o) => o.id), title, message, `/owner/orders/${order.id}`);
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
    await this.sendPushToUsers(
      staff.map((s) => s.id),
      'Order Ready to Process',
      `Order #${(order as never as { orderNumber: string }).orderNumber} has been approved`,
      `/staff/orders/${order.id}`,
    );
  }

  @OnEvent('order.rejected')
  async handleOrderRejected(order: Order) {
    // Notify customer of rejection
    await this.create(
      order.customerId,
      '❌ Order Rejected',
      `Order #${(order as never as { orderNumber: string }).orderNumber} was rejected. Reason: ${order.rejectionReason || 'Not specified'}`,
      'ORDER_REJECTED',
      order.id,
    );

    // Also send push notification to customer
    await this.sendPushToUsers(
      [order.customerId],
      'Order Rejected',
      `Order #${(order as never as { orderNumber: string }).orderNumber} was rejected`,
      `/orders/${order.id}`,
    );
  }

  @OnEvent('order.dispatched')
  async handleOrderDispatched(order: Order) {
    // Notify customer
    await this.create(
      order.customerId,
      '🚚 Order Dispatched',
      `Order #${(order as never as { orderNumber: string }).orderNumber} is on its way!`,
      'ORDER_DISPATCHED',
      order.id,
    );
    await this.sendPushToUsers(
      [order.customerId],
      'Order Dispatched',
      `Order #${(order as never as { orderNumber: string }).orderNumber} is on its way`,
      `/orders/${order.id}`,
    );
  }

  @OnEvent('order.delivered')
  async handleOrderDelivered(order: Order) {
    // Notify customer of delivery
    await this.create(
      order.customerId,
      '📦 Order Delivered',
      `Order #${(order as never as { orderNumber: string }).orderNumber} has been delivered`,
      'ORDER_DELIVERED',
      order.id,
    );

    // Send push notification
    await this.sendPushToUsers(
      [order.customerId],
      'Order Delivered',
      `Order #${(order as never as { orderNumber: string }).orderNumber} has been delivered`,
      `/orders/${order.id}`,
    );
  }

  @OnEvent('payment.made')
  async handlePaymentMade(order: Order & { customer?: { name: string } }) {
    // Notify owners of payment received
    const owners = await this.prisma.user.findMany({
      where: { role: Role.OWNER, isActive: true },
      select: { id: true },
    });

    const title = '💰 Payment Received';
    const message = `Payment received for Order #${(order as never as { orderNumber: string }).orderNumber}`;

    await Promise.all([...owners.map((o) => this.create(o.id, title, message, 'PAYMENT_RECEIVED', order.id))]);

    // Send push notification to owners
    await this.sendPushToUsers(owners.map((o) => o.id), title, message, `/owner/orders/${order.id}`);

    // Also notify customer of payment confirmation
    await this.create(
      order.customerId,
      '✅ Payment Confirmed',
      `Your payment for Order #${(order as never as { orderNumber: string }).orderNumber} has been received`,
      'PAYMENT_CONFIRMED',
      order.id,
    );

    await this.sendPushToUsers(
      [order.customerId],
      'Payment Confirmed',
      `Payment received for Order #${(order as never as { orderNumber: string }).orderNumber}`,
      `/orders/${order.id}`,
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

    const title = '⚠️ Low Stock Alert';
    const message = `${product.name} (${product.sku}) is running low. Available: ${payload.available}`;

    await Promise.all([...owners.map((o) => this.create(o.id, title, message, 'LOW_STOCK', payload.productId))]);

    // Send push notification to owners
    await this.sendPushToUsers(owners.map((o) => o.id), title, message, `/owner/inventory`);
  }
}

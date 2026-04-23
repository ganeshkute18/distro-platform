import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CreateOrderDto, RejectOrderDto, UpdateOrderStatusDto, OrderQueryDto,
} from './dto/order.dto';
import { AuditAction, OrderStatus, Role } from '@prisma/client';

const ORDER_INCLUDE = {
  customer: { select: { id: true, name: true, email: true, businessName: true, phone: true } },
  approvedBy: { select: { id: true, name: true } },
  items: {
    include: {
      product: { select: { id: true, sku: true, name: true, unitType: true, imageUrls: true } },
    },
  },
  statusHistory: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private notificationsService: NotificationsService,
    private audit: AuditService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateOrderDto, customerId: string) {
    // Validate products and compute totals
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { inventory: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products are invalid or inactive');
    }

    // Check stock availability
    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId)!;
      if (!product.inventory) throw new BadRequestException(`No inventory for product ${product.sku}`);

      const available = product.inventory.totalStock - product.inventory.reservedStock;
      if (available < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${available}, Requested: ${item.quantity}`,
        );
      }
      if (product.minOrderQty && item.quantity < product.minOrderQty) {
        throw new BadRequestException(`Minimum order quantity for ${product.name} is ${product.minOrderQty}`);
      }
      if (product.maxOrderQty && item.quantity > product.maxOrderQty) {
        throw new BadRequestException(`Maximum order quantity for ${product.name} is ${product.maxOrderQty}`);
      }
    }

    // Generate order number
    const count = await this.prisma.order.count();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Compute totals
    let totalAmount = 0;
    let taxAmount = 0;
    const itemsData = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const subtotal = product.pricePerUnit * item.quantity;
      const taxDecimal = Number(product.taxPercent) / 100;
      const tax = Math.round(subtotal * taxDecimal);
      totalAmount += subtotal;
      taxAmount += tax;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.pricePerUnit,
        taxPercent: product.taxPercent,
        subtotal,
      };
    });

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId,
        totalAmount: totalAmount + taxAmount,
        taxAmount,
        notes: dto.notes,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
        deliveryAddress: dto.deliveryAddress,
        items: { create: itemsData },
        statusHistory: {
          create: { fromStatus: null, toStatus: OrderStatus.PENDING_APPROVAL, changedBy: customerId },
        },
      },
      include: ORDER_INCLUDE,
    });

    await this.audit.log({
      userId: customerId,
      action: AuditAction.ORDER_PLACED,
      entity: 'Order',
      entityId: order.id,
      after: { orderNumber, totalAmount } as never,
    });

    // Notify owners
    this.eventEmitter.emit('order.created', order);

    return order;
  }

  async findAll(query: OrderQueryDto, requestingUser: { id: string; role: Role }) {
    const { status, customerId, from, to, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Role-based filtering
    if (requestingUser.role === Role.CUSTOMER) {
      where.customerId = requestingUser.id;
    } else if (requestingUser.role === Role.STAFF) {
      where.status = { in: [OrderStatus.APPROVED, OrderStatus.PROCESSING, OrderStatus.DISPATCHED, OrderStatus.DELIVERED] };
    }

    if (status) where.status = status;
    if (customerId && requestingUser.role === Role.OWNER) where.customerId = customerId;
    if (from || to) {
      where.createdAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where, skip, take: limit,
        include: {
          customer: { select: { id: true, name: true, businessName: true } },
          items: { select: { id: true, quantity: true, subtotal: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, requestingUser: { id: string; role: Role }) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!order) throw new NotFoundException('Order not found');

    if (requestingUser.role === Role.CUSTOMER && order.customerId !== requestingUser.id) {
      throw new ForbiddenException('Access denied');
    }
    if (requestingUser.role === Role.STAFF) {
      const staffVisible = [OrderStatus.APPROVED, OrderStatus.PROCESSING, OrderStatus.DISPATCHED, OrderStatus.DELIVERED] as const;
      if (!staffVisible.includes(order.status as any)) throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async approve(id: string, approverId: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Order is ${order.status}, cannot approve`);
    }

    // Reserve inventory for all items
    for (const item of order.items) {
      await this.inventoryService.reserveStock(item.productId, item.quantity, id);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.APPROVED,
        approvedById: approverId,
        approvedAt: new Date(),
        statusHistory: {
          create: { fromStatus: OrderStatus.PENDING_APPROVAL, toStatus: OrderStatus.APPROVED, changedBy: approverId },
        },
      },
      include: ORDER_INCLUDE,
    });

    await this.audit.log({ userId: approverId, action: AuditAction.ORDER_APPROVED, entity: 'Order', entityId: id });
    this.eventEmitter.emit('order.approved', updated);

    return updated;
  }

  async reject(id: string, dto: RejectOrderDto, rejectorId: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Order is ${order.status}, cannot reject`);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.REJECTED,
        rejectionReason: dto.reason,
        statusHistory: {
          create: { fromStatus: OrderStatus.PENDING_APPROVAL, toStatus: OrderStatus.REJECTED, changedBy: rejectorId, note: dto.reason },
        },
      },
      include: ORDER_INCLUDE,
    });

    await this.audit.log({ userId: rejectorId, action: AuditAction.ORDER_REJECTED, entity: 'Order', entityId: id, after: { reason: dto.reason } as never });
    this.eventEmitter.emit('order.rejected', updated);

    return updated;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, staffId: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');

    const ALLOWED_TRANSITIONS: Record<string, OrderStatus> = {
      APPROVED: OrderStatus.PROCESSING,
      PROCESSING: OrderStatus.DISPATCHED,
      DISPATCHED: OrderStatus.DELIVERED,
    };

    const nextStatus = ALLOWED_TRANSITIONS[order.status];
    if (!nextStatus || nextStatus !== dto.status) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${dto.status}`);
    }

    const timestampField: Record<string, string> = {
      PROCESSING: 'processingAt',
      DISPATCHED: 'dispatchedAt',
      DELIVERED: 'deliveredAt',
    };

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status as OrderStatus,
        [timestampField[dto.status]]: new Date(),
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: dto.status as OrderStatus,
            changedBy: staffId,
            note: dto.note,
          },
        },
      },
      include: ORDER_INCLUDE,
    });

    // Deduct inventory on dispatch
    if (dto.status === 'DISPATCHED') {
      for (const item of order.items) {
        await this.inventoryService.deductOnDispatch(item.productId, item.quantity, id, staffId);
      }
    }

    await this.audit.log({
      userId: staffId,
      action: AuditAction.ORDER_STATUS_CHANGED,
      entity: 'Order', entityId: id,
      before: { status: order.status } as never,
      after: { status: dto.status } as never,
    });

    this.eventEmitter.emit(`order.${dto.status.toLowerCase()}`, updated);

    return updated;
  }

  async repeatOrder(id: string, customerId: string) {
    const original = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!original || original.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }

    const createDto: CreateOrderDto = {
      items: original.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      deliveryAddress: original.deliveryAddress ?? undefined,
    };

    return this.create(createDto, customerId);
  }
}

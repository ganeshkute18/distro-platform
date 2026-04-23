import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction } from '@prisma/client';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(page = 1, limit = 20, lowStock = false) {
    const skip = (page - 1) * limit;

    // Fetch all and filter in-memory (lowStock filter needs cross-column comparison)
    const allInventory = await this.prisma.inventory.findMany({
      include: {
        product: {
          select: { id: true, sku: true, name: true, unitType: true, isActive: true,
            agency: { select: { name: true } }, category: { select: { name: true } } },
        },
      },
      orderBy: { product: { name: 'asc' } },
    });

    const filtered = lowStock
      ? allInventory.filter((inv) => inv.totalStock - inv.reservedStock <= inv.lowStockThreshold)
      : allInventory;

    const paginated = filtered.slice(skip, skip + limit);

    return {
      data: paginated.map((inv) => ({
        ...inv,
        availableStock: inv.totalStock - inv.reservedStock,
        isLowStock: (inv.totalStock - inv.reservedStock) <= inv.lowStockThreshold,
      })),
      meta: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) },
    };
  }

  async findByProduct(productId: string) {
    const inv = await this.prisma.inventory.findUnique({
      where: { productId },
      include: { product: { select: { id: true, sku: true, name: true } } },
    });
    if (!inv) throw new NotFoundException('Inventory not found');
    return { ...inv, availableStock: inv.totalStock - inv.reservedStock };
  }

  async adjust(productId: string, delta: number, reason: string, performedBy: string, orderId?: string) {
    const inv = await this.prisma.inventory.findUnique({ where: { productId } });
    if (!inv) throw new NotFoundException('Inventory not found');

    const newTotal = inv.totalStock + delta;
    if (newTotal < 0) throw new BadRequestException('Insufficient stock for this adjustment');

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.inventory.update({
        where: { productId },
        data: { totalStock: newTotal },
      });

      await tx.inventoryAdjustment.create({
        data: { inventoryId: inv.id, delta, reason, orderId, performedBy },
      });

      return result;
    });

    await this.audit.log({
      userId: performedBy,
      action: AuditAction.INVENTORY_ADJUSTED,
      entity: 'Inventory',
      entityId: inv.id,
      before: { totalStock: inv.totalStock } as never,
      after: { totalStock: newTotal } as never,
    });

    // Emit low stock event if threshold crossed
    const available = updated.totalStock - updated.reservedStock;
    if (available <= updated.lowStockThreshold) {
      this.eventEmitter.emit('inventory.lowStock', { productId, available, threshold: updated.lowStockThreshold });
    }

    return { ...updated, availableStock: updated.totalStock - updated.reservedStock };
  }

  /** Reserve stock when an order is approved (uses transaction for safety) */
  async reserveStock(productId: string, quantity: number, orderId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.findUnique({ where: { productId } });
      if (!inv) throw new NotFoundException('Inventory not found');

      const available = inv.totalStock - inv.reservedStock;
      if (available < quantity) {
        throw new BadRequestException(`Insufficient stock for product ${productId}. Available: ${available}, Requested: ${quantity}`);
      }

      await tx.inventory.update({
        where: { productId },
        data: { reservedStock: { increment: quantity } },
      });
    });
  }

  /** Release reservation without deducting (on rejection/cancellation) */
  async releaseReservation(productId: string, quantity: number): Promise<void> {
    await this.prisma.inventory.update({
      where: { productId },
      data: { reservedStock: { decrement: quantity } },
    });
  }

  /** Deduct stock on dispatch (reduces both total and reserved) */
  async deductOnDispatch(productId: string, quantity: number, orderId: string, performedBy: string): Promise<void> {
    const inv = await this.prisma.inventory.findUnique({ where: { productId } });
    if (!inv) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.inventory.update({
        where: { productId },
        data: {
          totalStock: { decrement: quantity },
          reservedStock: { decrement: quantity },
        },
      });

      await tx.inventoryAdjustment.create({
        data: {
          inventoryId: inv.id,
          delta: -quantity,
          reason: 'ORDER_DISPATCH',
          orderId,
          performedBy,
        },
      });
    });
  }

  async getHistory(productId: string, page = 1, limit = 20) {
    const inv = await this.prisma.inventory.findUnique({ where: { productId } });
    if (!inv) throw new NotFoundException('Inventory not found');

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.inventoryAdjustment.findMany({
        where: { inventoryId: inv.id },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inventoryAdjustment.count({ where: { inventoryId: inv.id } }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

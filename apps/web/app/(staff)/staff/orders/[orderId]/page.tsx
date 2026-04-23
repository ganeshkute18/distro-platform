'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PlayCircle, Truck, CheckCheck, Package } from 'lucide-react';
import { useOrder, useUpdateOrderStatus } from '../../../../../hooks/use-api';
import { PageLoader, StatusBadge, Card, CardHeader, CardTitle } from '../../../../../components/shared';
import { formatCurrency, formatDate, type OrderItem, type OrderStatusHistory, ORDER_STATUS_LABEL } from '../../../../../types';
import StaffShell from '../../../../../components/layout/StaffShell';

export default function StaffOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useOrder(orderId);
  const updateStatus = useUpdateOrderStatus();

  async function handleAction(status: string) {
    await updateStatus.mutateAsync({ id: orderId, status });
    router.refresh();
  }

  if (isLoading) return <StaffShell><PageLoader /></StaffShell>;
  if (!order) return <StaffShell><p className="py-12 text-center text-muted-foreground">Order not found.</p></StaffShell>;

  return (
    <StaffShell>
      <Link href="/staff/orders" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {order.customer?.businessName || order.customer?.name} · {formatDate(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Action bar */}
      <div className="mb-6 flex flex-wrap gap-3">
        {order.status === 'APPROVED' && (
          <button
            onClick={() => handleAction('PROCESSING')}
            disabled={updateStatus.isPending}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            <PlayCircle className="h-4 w-4" />
            Mark as Processing
          </button>
        )}
        {order.status === 'PROCESSING' && (
          <button
            onClick={() => handleAction('DISPATCHED')}
            disabled={updateStatus.isPending}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60 transition-colors"
          >
            <Truck className="h-4 w-4" />
            Mark as Dispatched
          </button>
        )}
        {order.status === 'DISPATCHED' && (
          <button
            onClick={() => handleAction('DELIVERED')}
            disabled={updateStatus.isPending}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark as Delivered
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Items ({order.items?.length})</CardTitle></CardHeader>
            <div className="divide-y">
              {order.items?.map((item: OrderItem) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.product.imageUrls?.[0] ? (
                      <img src={item.product.imageUrls[0]} alt={item.product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: <strong>{item.quantity}</strong> {item.product.unitType}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardTitle className="mb-3">Customer</CardTitle>
            <p className="font-medium text-sm">{order.customer?.name}</p>
            {order.customer?.businessName && (
              <p className="text-xs text-muted-foreground">{order.customer.businessName}</p>
            )}
            {order.customer?.phone && (
              <p className="mt-1 text-xs text-muted-foreground">📞 {order.customer.phone}</p>
            )}
          </Card>

          {order.deliveryAddress && (
            <Card>
              <CardTitle className="mb-2">Delivery Address</CardTitle>
              <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
              {order.deliveryDate && (
                <p className="mt-1 text-sm">Expected: <strong>{formatDate(order.deliveryDate)}</strong></p>
              )}
            </Card>
          )}

          {order.notes && (
            <Card>
              <CardTitle className="mb-2">Notes</CardTitle>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </Card>
          )}

          <Card>
            <CardTitle className="mb-3">Status History</CardTitle>
            <div className="space-y-3">
              {order.statusHistory?.map((h: OrderStatusHistory) => (
                <div key={h.id} className="flex items-start gap-2 text-xs">
                  <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">{ORDER_STATUS_LABEL[h.toStatus]}</p>
                    <p className="text-muted-foreground">{formatDate(h.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </StaffShell>
  );
}

'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Package, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useOrder } from '../../../../hooks/use-api';
import { api } from '../../../../lib/api-client';
import { PageLoader, StatusBadge, Card, CardHeader, CardTitle } from '../../../../components/shared';
import { formatCurrency, formatDate, type OrderItem, type OrderStatusHistory, ORDER_STATUS_LABEL } from '../../../../types';
import CustomerShell from '../../../../components/layout/CustomerShell';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'] as const;

export default function CustomerOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useOrder(orderId);

  async function handleRepeat() {
    try {
      await api.post(`/orders/${orderId}/repeat`);
      toast.success('Items added to a new order!');
      router.push('/cart');
    } catch {
      toast.error('Failed to repeat order');
    }
  }

  if (isLoading) return <CustomerShell><PageLoader /></CustomerShell>;
  if (!order) return <CustomerShell><p className="text-center py-12 text-muted-foreground">Order not found.</p></CustomerShell>;

  const currentStepIndex = STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]);
  const isRejected = order.status === 'REJECTED';
  const isCancelled = order.status === 'CANCELLED';

  return (
    <CustomerShell>
      <Link href="/orders" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          {['DELIVERED', 'REJECTED', 'CANCELLED'].includes(order.status) && (
            <button
              onClick={handleRepeat}
              className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Repeat Order
            </button>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      {!isRejected && !isCancelled && (
        <Card className="mb-6">
          <CardTitle className="mb-6">Order Progress</CardTitle>
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, index) => {
              const done = currentStepIndex >= index;
              const current = currentStepIndex === index;
              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center gap-2 text-center flex-1">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                        done
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30 text-muted-foreground'
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <span className={`text-xs font-medium ${done ? 'text-primary' : 'text-muted-foreground'}`}>
                      {ORDER_STATUS_LABEL[step]}
                    </span>
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 ${currentStepIndex > index ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </Card>
      )}

      {/* Rejection notice */}
      {isRejected && order.rejectionReason && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Order Rejected</p>
            <p className="text-sm text-muted-foreground">{order.rejectionReason}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Items Ordered</CardTitle></CardHeader>
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-semibold text-sm">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 border-t pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>{formatCurrency(order.totalAmount - order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span><span>{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t">
                <span>Total</span><span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {order.deliveryDate && (
            <Card>
              <CardTitle className="mb-2">Delivery Details</CardTitle>
              <p className="text-sm">Expected: <strong>{formatDate(order.deliveryDate)}</strong></p>
              {order.deliveryAddress && (
                <p className="mt-1 text-sm text-muted-foreground">{order.deliveryAddress}</p>
              )}
            </Card>
          )}
          {order.notes && (
            <Card>
              <CardTitle className="mb-2">Notes</CardTitle>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </Card>
          )}
          {/* Activity log */}
          <Card>
            <CardTitle className="mb-3">Activity</CardTitle>
            <div className="space-y-3">
              {order.statusHistory?.map((h: OrderStatusHistory) => (
                <div key={h.id} className="flex items-start gap-2 text-xs">
                  <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">{ORDER_STATUS_LABEL[h.toStatus]}</p>
                    <p className="text-muted-foreground">{formatDate(h.createdAt)}</p>
                    {h.note && <p className="text-muted-foreground italic">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </CustomerShell>
  );
}

'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, ArrowLeft, Package, Truck, User } from 'lucide-react';
import { useOrder, useApproveOrder, useRejectOrder } from '../../../../../hooks/use-api';
import { PageLoader, StatusBadge, Card, CardHeader, CardTitle } from '../../../../../components/shared';
import { formatCurrency, formatDate, type OrderItem } from '../../../../../types';
import OwnerShell from '../../../../../components/layout/OwnerShell';
import Link from 'next/link';

export default function ApprovalDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useOrder(orderId);
  const approveOrder = useApproveOrder();
  const rejectOrder = useRejectOrder();

  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  async function handleApprove() {
    await approveOrder.mutateAsync(orderId);
    router.push('/owner/approvals');
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    await rejectOrder.mutateAsync({ id: orderId, reason: rejectReason });
    router.push('/owner/approvals');
  }

  if (isLoading) return <OwnerShell><PageLoader /></OwnerShell>;
  if (!order) return <OwnerShell><p>Order not found</p></OwnerShell>;

  const isActionable = order.status === 'PENDING_APPROVAL';

  return (
    <OwnerShell>
      {/* Back */}
      <Link href="/owner/approvals" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Approvals
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Order Items ({order.items?.length})</CardTitle></CardHeader>
            <div className="divide-y">
              {order.items?.map((item: OrderItem) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {item.product.imageUrls?.[0] ? (
                      <img src={item.product.imageUrls[0]} alt={item.product.name} className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(item.subtotal)}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 space-y-1 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.totalAmount - order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardTitle>Order Notes</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">{order.notes}</p>
            </Card>
          )}
        </div>

        {/* Right: Customer + Actions */}
        <div className="space-y-4">
          {/* Customer info */}
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                {order.customer?.name?.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm">{order.customer?.name}</p>
                {order.customer?.businessName && (
                  <p className="text-xs text-muted-foreground">{order.customer.businessName}</p>
                )}
              </div>
            </div>
            {order.customer?.email && (
              <p className="mt-2 text-xs text-muted-foreground">{order.customer.email}</p>
            )}
          </Card>

          {/* Delivery info */}
          {(order.deliveryDate || order.deliveryAddress) && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-4 w-4" />Delivery</CardTitle></CardHeader>
              {order.deliveryDate && (
                <p className="text-sm">Expected: <strong>{formatDate(order.deliveryDate)}</strong></p>
              )}
              {order.deliveryAddress && (
                <p className="mt-1 text-sm text-muted-foreground">{order.deliveryAddress}</p>
              )}
            </Card>
          )}

          {/* Actions */}
          {isActionable && (
            <Card>
              <CardTitle className="mb-4">Actions</CardTitle>
              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={approveOrder.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Order
                </button>
                <button
                  onClick={() => setRejectModal(true)}
                  disabled={rejectOrder.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Order
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">Reject Order</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Please provide a reason. The customer will be notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="e.g. Product out of stock, delivery not available for this area…"
              className="w-full rounded-lg border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setRejectModal(false)}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejectOrder.isPending}
                className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </OwnerShell>
  );
}

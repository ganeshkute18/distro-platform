'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { useOrder } from '../../../../../hooks/use-api';
import { PageLoader, StatusBadge, Card, CardHeader, CardTitle } from '../../../../../components/shared';
import { formatCurrency, formatDate, type OrderItem, type OrderStatusHistory, ORDER_STATUS_LABEL } from '../../../../../types';
import OwnerShell from '../../../../../components/layout/OwnerShell';
import { useAppSettings } from '../../../../../hooks/use-api';
import { downloadInvoicePdf } from '../../../../../lib/invoice-pdf';

export default function OwnerOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useOrder(orderId);
  const { data: settings } = useAppSettings();

  async function handleInvoiceDownload() {
    if (!order) return;
    downloadInvoicePdf(order as any, settings as any);
  }

  if (isLoading) return <OwnerShell><PageLoader /></OwnerShell>;
  if (!order) return <OwnerShell><p>Not found</p></OwnerShell>;

  return (
    <OwnerShell>
      <Link href="/owner/orders" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <div className="mb-6 flex items-start justify-between">
        <div><h1 className="text-2xl font-bold">{order.orderNumber}</h1><p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p></div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <button onClick={handleInvoiceDownload} className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted">Download Invoice</button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Items</CardTitle></CardHeader>
            <div className="divide-y">
              {order.items?.map((item: OrderItem) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
                    {item.product.imageUrls?.[0] ? <img src={item.product.imageUrls[0]} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Package className="h-5 w-5 text-muted-foreground/40" /></div>}
                  </div>
                  <div className="flex-1"><p className="font-medium text-sm">{item.product.name}</p><p className="text-xs text-muted-foreground">Qty: {item.quantity}</p></div>
                  <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-4 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{formatCurrency(order.taxAmount)}</span></div>
              <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(order.totalAmount)}</span></div>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card><CardTitle className="mb-3">Customer</CardTitle>
            <p className="font-medium text-sm">{order.customer?.name}</p>
            {order.customer?.businessName && <p className="text-xs text-muted-foreground">{order.customer.businessName}</p>}
            {order.deliveryAddress && <p className="mt-2 text-xs text-muted-foreground">Delivery: {order.deliveryAddress}</p>}
            {order.deliveryDate && <p className="text-xs text-muted-foreground">Date: {formatDate(order.deliveryDate)}</p>}
          </Card>
          <Card>
            <CardTitle className="mb-2">Payment</CardTitle>
            <p className="text-sm text-muted-foreground">Method: {order.paymentMethod === 'QR' ? 'QR Payment' : 'Cash on Delivery'}</p>
            {order.paymentStatus && <p className="text-sm text-muted-foreground">Status: {order.paymentStatus}</p>}
            {order.paymentReceiptUrl && (
              order.paymentReceiptUrl.startsWith('data:image') ? (
                <img src={order.paymentReceiptUrl} alt="Payment receipt" className="mt-2 h-32 w-full rounded-lg border object-contain bg-white p-1" />
              ) : (
                <a href={order.paymentReceiptUrl} target="_blank" className="text-sm text-primary underline">View receipt</a>
              )
            )}
          </Card>
          {order.rejectionReason && <Card><CardTitle className="mb-2 text-destructive">Rejection Reason</CardTitle><p className="text-sm text-muted-foreground">{order.rejectionReason}</p></Card>}
          <Card><CardTitle className="mb-3">Status History</CardTitle>
            <div className="space-y-3">
              {order.statusHistory?.map((h: OrderStatusHistory) => (
                <div key={h.id} className="flex items-start gap-2 text-xs">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <div><p className="font-medium">{ORDER_STATUS_LABEL[h.toStatus]}</p><p className="text-muted-foreground">{formatDate(h.createdAt)}</p></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </OwnerShell>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useOrders, useUpdateOrderStatus } from '../../../../hooks/use-api';
import { PageLoader, EmptyState, StatusBadge, Pagination } from '../../../../components/shared';
import { formatCurrency, formatDate, type Order, type OrderStatus } from '../../../../types';
import StaffShell from '../../../../components/layout/StaffShell';
import { ChevronRight, Truck, PlayCircle, CheckCheck } from 'lucide-react';

const STATUS_TABS: { label: string; value: OrderStatus | '' }[] = [
  { label: 'All Active', value: '' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Dispatched', value: 'DISPATCHED' },
  { label: 'Delivered', value: 'DELIVERED' },
];

export default function StaffOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrders({ status: status || undefined, page, limit: 20 });
  const updateStatus = useUpdateOrderStatus();

  async function quickAction(orderId: string, newStatus: string, e: React.MouseEvent) {
    e.preventDefault();
    await updateStatus.mutateAsync({ id: orderId, status: newStatus });
  }

  return (
    <StaffShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">Process and manage approved orders</p>
      </div>

      {/* Status tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border bg-muted p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1); }}
            className={`flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
              status === tab.value
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : !data?.data?.length ? (
        <EmptyState title="No orders" description="No orders in this status." />
      ) : (
        <>
          <div className="space-y-3">
            {data.data.map((order: Order) => (
              <Link key={order.id} href={`/staff/orders/${order.id}`}>
                <div className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:border-primary transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold">{order.orderNumber}</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(order as unknown as { customer?: { businessName?: string; name?: string } }).customer?.businessName ||
                       (order as unknown as { customer?: { name?: string } }).customer?.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(order.createdAt)} · {formatCurrency(order.totalAmount)}
                    </p>
                  </div>

                  {/* Quick action buttons */}
                  <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                    {order.status === 'APPROVED' && (
                      <button
                        onClick={(e) => quickAction(order.id, 'PROCESSING', e)}
                        disabled={updateStatus.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        Start
                      </button>
                    )}
                    {order.status === 'PROCESSING' && (
                      <button
                        onClick={(e) => quickAction(order.id, 'DISPATCHED', e)}
                        disabled={updateStatus.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-60 transition-colors"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        Dispatch
                      </button>
                    )}
                    {order.status === 'DISPATCHED' && (
                      <button
                        onClick={(e) => quickAction(order.id, 'DELIVERED', e)}
                        disabled={updateStatus.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Delivered
                      </button>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
          <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
        </>
      )}
    </StaffShell>
  );
}

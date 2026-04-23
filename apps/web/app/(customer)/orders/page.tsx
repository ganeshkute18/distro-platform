'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useOrders } from '../../../hooks/use-api';
import { PageLoader, EmptyState, StatusBadge, Pagination } from '../../../components/shared';
import { formatCurrency, formatDate, type Order } from '../../../types';
import CustomerShell from '../../../components/layout/CustomerShell';
import { ChevronRight, Package } from 'lucide-react';

export default function CustomerOrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrders({ page, limit: 15 });

  return (
    <CustomerShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-sm text-muted-foreground">Track and manage your orders</p>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : !data?.data?.length ? (
        <EmptyState
          title="No orders yet"
          description="Your placed orders will appear here."
          action={
            <Link href="/catalog" className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Browse Catalog
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {data.data.map((order: Order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="flex items-center justify-between rounded-xl border bg-card p-4 hover:border-primary hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-medium">{formatCurrency(order.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {(order as unknown as { _count?: { items?: number } })._count?.items ?? order.items?.length ?? 0} item(s)
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
        </>
      )}
    </CustomerShell>
  );
}

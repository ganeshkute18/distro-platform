'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useOrders } from '../../../../hooks/use-api';
import { PageHeader, PageLoader, EmptyState, StatusBadge, Pagination, ScrollTabs } from '../../../../components/shared';
import { formatCurrency, formatDate, type Order } from '../../../../types';
import OwnerShell from '../../../../components/layout/OwnerShell';
import { ChevronRight } from 'lucide-react';

const STATUSES = ['', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'REJECTED'] as const;

export default function OwnerOrdersPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrders({ status: status || undefined, page, limit: 20 });

  return (
    <OwnerShell>
      <PageHeader title="All Orders" />

      <ScrollTabs
        className="mb-6"
        value={status}
        onChange={(next) => {
          setStatus(next);
          setPage(1);
        }}
        options={STATUSES.map((s) => ({
          value: s,
          label: s === '' ? 'All' : s.replace(/_/g, ' '),
        }))}
      />

      {isLoading ? <PageLoader /> : !data?.data?.length ? <EmptyState title="No orders found" /> : (
        <>
          <div className="space-y-3 md:hidden">
            {data.data.map((order: Order) => (
              <Link key={order.id} href={`/owner/orders/${order.id}`} className="block rounded-xl border bg-card p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {(order as unknown as { customer?: { businessName?: string; name?: string } }).customer?.businessName ||
                       (order as unknown as { customer?: { name?: string } }).customer?.name}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-mono text-base font-semibold">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Order</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.data.map((order: Order) => (
                  <tr key={order.id} className="bg-card transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {(order as unknown as { customer?: { businessName?: string; name?: string } }).customer?.businessName ||
                       (order as unknown as { customer?: { name?: string } }).customer?.name}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3"><Link href={`/owner/orders/${order.id}`} className="flex items-center justify-center"><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
        </>
      )}
    </OwnerShell>
  );
}

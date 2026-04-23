'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useOrders } from '../../../../hooks/use-api';
import { PageHeader, PageLoader, EmptyState, StatusBadge, Pagination } from '../../../../components/shared';
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
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border bg-muted p-1">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${status === s ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {s === '' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
      {isLoading ? <PageLoader /> : !data?.data?.length ? <EmptyState title="No orders found" /> : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Order</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Customer</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.data.map((order: Order) => (
                  <tr key={order.id} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {(order as unknown as { customer?: { businessName?: string; name?: string } }).customer?.businessName ||
                       (order as unknown as { customer?: { name?: string } }).customer?.name}
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{formatDate(order.createdAt)}</td>
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

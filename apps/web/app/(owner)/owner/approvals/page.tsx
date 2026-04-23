'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, ChevronRight } from 'lucide-react';
import { useOrders } from '../../../../hooks/use-api';
import { PageHeader, Card, PageLoader, EmptyState, Pagination } from '../../../../components/shared';
import { formatCurrency, formatDate, type Order } from '../../../../types';
import OwnerShell from '../../../../components/layout/OwnerShell';

export default function ApprovalsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrders({ status: 'PENDING_APPROVAL', page, limit: 20 });

  return (
    <OwnerShell>
      <PageHeader
        title="Pending Approvals"
        description="Orders waiting for your approval"
      />

      {isLoading ? (
        <PageLoader />
      ) : !data?.data?.length ? (
        <EmptyState
          title="All clear!"
          description="No orders pending approval right now."
        />
      ) : (
        <>
          <div className="space-y-3">
            {data.data.map((order: Order) => {
              const ageMinutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
              const ageText = ageMinutes < 60
                ? `${ageMinutes}m ago`
                : ageMinutes < 1440
                ? `${Math.floor(ageMinutes / 60)}h ago`
                : `${Math.floor(ageMinutes / 1440)}d ago`;

              return (
                <Link key={order.id} href={`/owner/approvals/${order.id}`}>
                  <Card className="cursor-pointer hover:border-primary transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {(order as unknown as { customer?: { businessName?: string; name?: string } }).customer?.businessName ||
                             (order as unknown as { customer?: { name?: string } }).customer?.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="hidden sm:block text-center">
                          <p className="text-sm font-medium">{formatCurrency(order.totalAmount)}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div className="hidden sm:block text-center">
                          <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
                          <p className="text-xs text-muted-foreground">Placed</p>
                        </div>
                        <div className={`text-center ${ageMinutes > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          <p className="text-sm font-medium">{ageText}</p>
                          <p className="text-xs">Waiting</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          <Pagination
            page={page}
            totalPages={data.meta.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </OwnerShell>
  );
}

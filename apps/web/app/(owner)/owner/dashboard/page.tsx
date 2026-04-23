'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Clock, TrendingUp, Package, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { useDashboard, useOrders } from '../../../../hooks/use-api';
import { StatCard, PageHeader, Card, CardHeader, CardTitle, PageLoader, StatusBadge } from '../../../../components/shared';
import { formatCurrency, formatDate, type Order } from '../../../../types';
import OwnerShell from '../../../../components/layout/OwnerShell';

export default function OwnerDashboardPage() {
  const { data: dashboard, isLoading } = useDashboard();
  const { data: pendingOrders } = useOrders({ status: 'PENDING_APPROVAL', limit: 5 });

  if (isLoading) return <OwnerShell><PageLoader /></OwnerShell>;

  const stats = (dashboard as { stats?: Record<string, number> })?.stats;
  const recent = (dashboard as { recentOrders?: Order[] })?.recentOrders ?? [];

  return (
    <OwnerShell>
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here's what's happening today."
      />

      {/* KPI Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Pending Approvals"
          value={stats?.pendingApproval ?? 0}
          icon={<Clock className="h-4 w-4" />}
          className={stats?.pendingApproval > 0 ? 'border-yellow-200' : ''}
        />
        <StatCard
          label="Orders Today"
          value={stats?.todayOrders ?? 0}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <StatCard
          label="Total Orders"
          value={stats?.totalOrders ?? 0}
          icon={<Package className="h-4 w-4" />}
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <Link
              href="/owner/approvals"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>

          {!pendingOrders?.data?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              ✅ No pending approvals
            </p>
          ) : (
            <div className="space-y-3">
              {pendingOrders.data.map((order: Order) => (
                <Link
                  key={order.id}
                  href={`/owner/approvals/${order.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.customer?.businessName || order.customer?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <Link
              href="/owner/orders"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>

          {!recent.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recent.map((order: Order) => (
                <Link
                  key={order.id}
                  href={`/owner/orders/${order.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {(order as unknown as { customer?: { businessName?: string; name?: string } }).customer?.businessName ||
                       (order as unknown as { customer?: { name?: string } }).customer?.name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={order.status} />
                    <p className="text-xs text-muted-foreground">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </OwnerShell>
  );
}

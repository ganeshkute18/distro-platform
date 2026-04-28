'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Clock, TrendingUp, Package, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { useDashboard, useOrders } from '../../../../hooks/use-api';
import { StatCard, PageHeader, Card, CardHeader } from '../../../../components/shared';
import { SkeletonDashboard, SkeletonTable } from '../../../../components/shared/SkeletonLoader';
import { SectionHeading, ListItem } from '../../../../components/shared/DashboardComponents';
import { formatCurrency, formatDate, type Order } from '../../../../types';
import OwnerShell from '../../../../components/layout/OwnerShell';

export default function OwnerDashboardPage() {
  const { data: dashboard, isLoading } = useDashboard();
  const { data: pendingOrders } = useOrders({ status: 'PENDING_APPROVAL', limit: 5 });

  if (isLoading) return <OwnerShell><SkeletonDashboard /></OwnerShell>;

  const stats = (dashboard as { stats?: Record<string, number> })?.stats;
  const recent = (dashboard as { recentOrders?: Order[] })?.recentOrders ?? [];

  return (
    <OwnerShell>
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here's what's happening today."
      />

      {/* KPI Stats */}
      <div className="scroll-fade-x mb-6">
        <div className="touch-scroll grid min-w-max grid-flow-col auto-cols-[minmax(165px,1fr)] gap-3 overflow-x-auto sm:min-w-0 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Pending Approvals"
          value={stats?.pendingApproval ?? 0}
          icon={<Clock className="h-4 w-4" />}
          className={(stats?.pendingApproval ?? 0) > 0 ? 'border-yellow-200' : ''}
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <SectionHeading 
              title="Pending Approvals"
              action={{
                label: 'View all',
                onClick: () => window.location.href = '/owner/approvals'
              }}
            />
          </CardHeader>

          {!pendingOrders?.data?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              ✅ No pending approvals
            </p>
          ) : (
            <div className="space-y-3 p-4">
              {pendingOrders.data.map((order: Order) => (
                <div key={order.id} onClick={() => window.location.href = `/owner/approvals/${order.id}`}>
                  <ListItem
                    primary={order.orderNumber}
                    secondary={order.customer?.businessName || order.customer?.name}
                    amount={formatCurrency(order.totalAmount)}
                    status="pending"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <SectionHeading 
              title="Recent Orders"
              action={{
                label: 'View all',
                onClick: () => window.location.href = '/owner/orders'
              }}
            />
          </CardHeader>

          {!recent.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders yet</p>
          ) : (
            <div className="space-y-3 p-4">
              {recent.map((order: Order) => (
                <div key={order.id} onClick={() => window.location.href = `/owner/orders/${order.id}`}>
                  <ListItem
                    primary={order.orderNumber}
                    secondary={(order as unknown as { customer?: { businessName?: string; name?: string } }).customer?.businessName ||
                     (order as unknown as { customer?: { name?: string } }).customer?.name}
                    amount={formatCurrency(order.totalAmount)}
                    status={order.status.toLowerCase() as any}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </OwnerShell>
  );
}

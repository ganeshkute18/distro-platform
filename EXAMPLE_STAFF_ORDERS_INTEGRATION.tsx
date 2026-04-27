// Example Integration: Staff Orders Page with ResponsiveTable
// File would be: apps/web/app/(staff)/orders/page.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';

// Phase 2 Components
import { ResponsiveTable } from '@/components/shared/ResponsiveTable';
import { NoOrders } from '@/components/shared/EmptyState';
import { SectionHeading, ListItem } from '@/components/shared/DashboardComponents';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

// API & Types
import { api } from '@/lib/api-client';
import { Order } from '@shared-types';

export default function StaffOrdersPage() {
  const router = useRouter();

  // Fetch orders
  const { data: orders, isLoading, refetch } = useQuery(
    ['orders'],
    () => api.orders.list(),
    {
      staleTime: 30 * 1000,
      retry: 1,
    }
  );

  // Pull-to-refresh hook
  const { containerRef } = usePullToRefresh({
    onRefresh: async () => {
      await refetch();
    },
    triggerDistance: 100,
  });

  // Table columns configuration
  const columns = [
    {
      header: 'Order ID',
      accessor: 'id',
      cell: (value: string) => `#${value.slice(0, 8)}`,
      width: '100px',
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      width: '150px',
    },
    {
      header: 'Items',
      accessor: 'items',
      cell: (value: any[]) => `${value?.length || 0} items`,
      width: '80px',
    },
    {
      header: 'Total',
      accessor: 'total',
      cell: (value: number) => `₹${value.toFixed(2)}`,
      width: '100px',
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (value: string) => {
        const statusConfig = {
          pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
          processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
          shipped: { bg: 'bg-purple-100', text: 'text-purple-800', icon: AlertCircle },
          delivered: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
        };
        const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.pending;
        const Icon = config.icon;
        return (
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${config.bg} ${config.text}`}>
            <Icon className="w-3 h-3" />
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </div>
        );
      },
      width: '120px',
    },
    {
      header: 'Date',
      accessor: 'createdAt',
      cell: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
      width: '100px',
    },
  ];

  // Render: Empty State
  if (!isLoading && (!orders || orders.length === 0)) {
    return (
      <div className="space-y-6">
        <SectionHeading
          title="Orders"
          subtitle="Manage customer orders"
        />
        <NoOrders />
      </div>
    );
  }

  const handleRowClick = (order: Order) => {
    router.push(`/orders/${order.id}`);
  };

  // Render: Orders with ResponsiveTable
  return (
    <div
      ref={containerRef}
      className="space-y-6 h-screen overflow-y-auto"
    >
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-20 pb-4">
        <SectionHeading
          title="Orders"
          subtitle={`${orders?.length || 0} orders`}
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card border rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
          <p className="text-2xl font-bold">{orders?.length || 0}</p>
        </div>
        <div className="p-4 bg-card border rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-bold">
            {orders?.filter(o => o.status === 'pending').length || 0}
          </p>
        </div>
        <div className="p-4 bg-card border rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Processing</p>
          <p className="text-2xl font-bold">
            {orders?.filter(o => o.status === 'processing').length || 0}
          </p>
        </div>
        <div className="p-4 bg-card border rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Delivered</p>
          <p className="text-2xl font-bold">
            {orders?.filter(o => o.status === 'delivered').length || 0}
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <ResponsiveTable
        data={orders || []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No orders found"
        onRowClick={handleRowClick}
        mobileCardView={true}
      />

      {/* Mobile: Pull-to-Refresh Hint */}
      <div className="md:hidden text-center text-xs text-muted-foreground pb-4">
        Pull down to refresh
      </div>
    </div>
  );
}

// ============================================================================
// INTEGRATION NOTES:
// ============================================================================
// 1. ResponsiveTable handles both desktop and mobile views
// 2. Pull-to-refresh hook enables gesture-based refresh on mobile
// 3. Stats show order summary
// 4. Custom cell renderers show status badges
// 5. Row click handler navigates to order details
// 6. Sticky header stays visible while scrolling
// 7. NoOrders empty state shown when no data
//
// Best Practices Applied:
// ✓ Mobile pull-to-refresh gesture
// ✓ Responsive layout with grid stats
// ✓ Status badges with icons
// ✓ Custom cell formatting
// ✓ Click handlers for navigation
// ✓ Sticky header for UX
// ✓ Empty state handling
// ============================================================================

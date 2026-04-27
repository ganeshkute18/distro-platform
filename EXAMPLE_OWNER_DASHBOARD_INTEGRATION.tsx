// Example Integration: Owner Dashboard Page
// File would be: apps/web/app/(owner)/dashboard/page.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, Package, Users, TrendingUp } from 'lucide-react';

// Phase 2 Components
import {
  StatCard,
  SectionHeading,
  ListItem,
  ProgressBar,
  MetricWithTrend,
} from '@/components/shared/DashboardComponents';
import { SkeletonDashboard } from '@/components/shared/SkeletonLoader';
import { ResponsiveTable } from '@/components/shared/ResponsiveTable';

// API & Types
import { api } from '@/lib/api-client';
import { format } from 'date-fns';

export default function OwnerDashboard() {
  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery(
    ['dashboard', 'metrics'],
    () => api.dashboard.metrics(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    }
  );

  // Fetch recent orders
  const { data: recentOrders, isLoading: ordersLoading } = useQuery(
    ['orders', 'recent'],
    () => api.orders.list({ limit: 5 }),
    {
      staleTime: 2 * 60 * 1000,
      retry: 1,
    }
  );

  // Fetch top products
  const { data: topProducts, isLoading: productsLoading } = useQuery(
    ['products', 'top'],
    () => api.products.topSelling({ limit: 5 }),
    {
      staleTime: 10 * 60 * 1000,
      retry: 1,
    }
  );

  // Show skeleton while loading
  if (metricsLoading) {
    return <SkeletonDashboard />;
  }

  const ordersColumns = [
    {
      header: 'Order ID',
      accessor: 'id',
      cell: (value: string) => `#${value.slice(0, 8)}`,
    },
    {
      header: 'Customer',
      accessor: 'customerName',
    },
    {
      header: 'Amount',
      accessor: 'total',
      cell: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'completed'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : value === 'pending'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        }`}>
          {value}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: 'createdAt',
      cell: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
    },
  ];

  const productsColumns = [
    {
      header: 'Product',
      accessor: 'name',
    },
    {
      header: 'Sales',
      accessor: 'totalSold',
    },
    {
      header: 'Revenue',
      accessor: 'revenue',
      cell: (value: number) => `₹${value.toFixed(2)}`,
    },
  ];

  // Key metrics
  const metrics_data = metrics || {
    totalRevenue: 0,
    totalOrders: 0,
    activeCustomers: 0,
    totalProducts: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    conversionRate: 0,
    inventoryUtilization: 45,
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's your business overview.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`₹${metrics_data.totalRevenue.toLocaleString()}`}
          change={metrics_data.revenueGrowth}
          icon={<DollarSign className="w-6 h-6" />}
          color="success"
        />
        <StatCard
          label="Total Orders"
          value={metrics_data.totalOrders}
          change={metrics_data.orderGrowth}
          icon={<Package className="w-6 h-6" />}
          color="primary"
        />
        <StatCard
          label="Active Customers"
          value={metrics_data.activeCustomers}
          change={5}
          icon={<Users className="w-6 h-6" />}
          color="warning"
        />
        <StatCard
          label="Total Products"
          value={metrics_data.totalProducts}
          change={2}
          icon={<TrendingUp className="w-6 h-6" />}
          color="error"
        />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricWithTrend
          label="Conversion Rate"
          value={`${metrics_data.conversionRate.toFixed(1)}%`}
          trend={8}
        />
        <MetricWithTrend
          label="Average Order Value"
          value="₹2,450"
          trend={12}
        />
        <MetricWithTrend
          label="Customer Retention"
          value="78%"
          trend={-3}
        />
      </div>

      {/* Inventory Utilization */}
      <div className="bg-card border rounded-lg p-6">
        <SectionHeading
          title="Inventory Status"
          subtitle="Storage and stock levels"
        />
        <div className="space-y-4 mt-4">
          <ProgressBar
            label="Storage Capacity"
            value={metrics_data.inventoryUtilization}
            max={100}
            color="primary"
          />
          <ProgressBar
            label="Low Stock Items"
            value={15}
            max={100}
            color="warning"
          />
          <ProgressBar
            label="Out of Stock"
            value={3}
            max={100}
            color="error"
          />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-card border rounded-lg p-6">
        <SectionHeading
          title="Recent Orders"
          subtitle="Last 5 orders"
          action={{
            label: 'View All',
            onClick: () => window.location.href = '/orders',
          }}
        />
        <div className="mt-4">
          <ResponsiveTable
            data={recentOrders || []}
            columns={ordersColumns}
            isLoading={ordersLoading}
            emptyMessage="No orders yet"
            mobileCardView={true}
          />
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-card border rounded-lg p-6">
        <SectionHeading
          title="Top Selling Products"
          subtitle="Best performers this month"
        />
        <div className="mt-4 space-y-3">
          {topProducts && topProducts.length > 0 ? (
            topProducts.map((product) => (
              <ListItem
                key={product.id}
                primary={product.name}
                secondary={`${product.totalSold || 0} sold`}
                amount={`₹${(product.revenue || 0).toFixed(2)}`}
                icon={<Package className="w-5 h-5" />}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">No sales data yet</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => window.location.href = '/products/new'}
          className="p-6 bg-card border rounded-lg hover:shadow-md transition-shadow text-left"
        >
          <h3 className="font-semibold text-foreground mb-1">Create Product</h3>
          <p className="text-sm text-muted-foreground">Add a new item to your catalog</p>
        </button>
        <button
          onClick={() => window.location.href = '/reports'}
          className="p-6 bg-card border rounded-lg hover:shadow-md transition-shadow text-left"
        >
          <h3 className="font-semibold text-foreground mb-1">View Reports</h3>
          <p className="text-sm text-muted-foreground">Detailed analytics and insights</p>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// INTEGRATION NOTES:
// ============================================================================
// 1. StatCard displays KPIs with trend indicators
// 2. MetricWithTrend shows focused metrics with growth rates
// 3. ProgressBar shows inventory status visually
// 4. ResponsiveTable shows recent orders (desktop + mobile views)
// 5. ListItem displays top products with sales info
// 6. SectionHeading provides consistent section titles with actions
// 7. SkeletonDashboard shows loading state
//
// Best Practices Applied:
// ✓ Multiple data visualizations
// ✓ Loading states with skeleton
// ✓ Trending indicators show performance
// ✓ Color-coded status indicators
// ✓ Responsive grid layouts
// ✓ Quick action buttons
// ✓ Consistent visual hierarchy
// ✓ Dark mode compatible
// ============================================================================

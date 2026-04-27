'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSalesSummary, useTopProducts, useLowStock, useOrders } from '../../../../hooks/use-api';
import { PageHeader, Card, CardHeader, CardTitle, PageLoader, StatusBadge } from '../../../../components/shared';
import { formatCurrency, formatDate, type Order } from '../../../../types';
import OwnerShell from '../../../../components/layout/OwnerShell';
import { DatePicker } from '../../../../components/shared/DatePicker';
import { TrendingUp, Package, AlertTriangle, ClipboardList } from 'lucide-react';

const TABS = ['Sales', 'Top Products', 'Low Stock', 'Pending Orders'] as const;
type Tab = typeof TABS[number];

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('Sales');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: sales, isLoading: salesLoading } = useSalesSummary(from || undefined, to || undefined);
  const { data: topProducts, isLoading: topLoading } = useTopProducts(from || undefined, to || undefined);
  const { data: lowStock, isLoading: lowLoading } = useLowStock();
  const { data: pendingOrders, isLoading: pendingLoading } = useOrders({ status: 'PENDING_APPROVAL', limit: 50 });

  const salesData = sales as {
    totalRevenue?: number;
    totalOrders?: number;
    dailyBreakdown?: { date: string; revenue: number; orders: number }[];
  };

  return (
    <OwnerShell>
      <PageHeader title="Reports" description="Business insights and analytics" />

      {/* Date filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <label className="text-sm font-medium whitespace-nowrap">From</label>
          <DatePicker value={from} onChange={setFrom} placeholder="Start date" />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <label className="text-sm font-medium whitespace-nowrap">To</label>
          <DatePicker value={to} onChange={setTo} placeholder="End date" />
        </div>
        {(from || to) && (
          <button onClick={() => { setFrom(''); setTo(''); }} className="text-sm text-muted-foreground hover:text-foreground">
            Clear dates
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border bg-muted p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              tab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Sales Tab ── */}
      {tab === 'Sales' && (
        salesLoading ? <PageLoader /> : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <Card>
                <div className="flex items-center gap-3 mb-1">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
                <p className="text-3xl font-bold">{formatCurrency(salesData?.totalRevenue ?? 0)}</p>
              </Card>
              <Card>
                <div className="flex items-center gap-3 mb-1">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">Orders Delivered</p>
                </div>
                <p className="text-3xl font-bold">{salesData?.totalOrders ?? 0}</p>
              </Card>
              <Card>
                <div className="flex items-center gap-3 mb-1">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                </div>
                <p className="text-3xl font-bold">
                  {salesData?.totalOrders
                    ? formatCurrency(Math.round((salesData.totalRevenue ?? 0) / salesData.totalOrders))
                    : '₹0'}
                </p>
              </Card>
            </div>

            {(salesData?.dailyBreakdown?.length ?? 0) > 0 && (
              <Card>
                <CardTitle className="mb-4">Daily Revenue</CardTitle>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={salesData?.dailyBreakdown?.map((d) => ({ ...d, revenue: d.revenue / 100 }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        )
      )}

      {/* ── Top Products Tab ── */}
      {tab === 'Top Products' && (
        topLoading ? <PageLoader /> : (
          <Card>
            <CardTitle className="mb-4">Top Products by Revenue</CardTitle>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">#</th>
                    <th className="px-4 py-3 text-left font-medium">Product</th>
                    <th className="px-4 py-3 text-right font-medium">Orders</th>
                    <th className="px-4 py-3 text-right font-medium">Qty Sold</th>
                    <th className="px-4 py-3 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {((topProducts as unknown[]) ?? []).map((item: unknown, i: number) => {
                    const p = item as {
                      product?: { name: string; sku: string; agency?: { name: string } };
                      totalQuantity: number;
                      totalRevenue: number;
                      orderCount: number;
                    };
                    return (
                      <tr key={i} className="bg-card hover:bg-muted/30">
                        <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{p.product?.name}</p>
                          <p className="text-xs text-muted-foreground">{p.product?.agency?.name}</p>
                        </td>
                        <td className="px-4 py-3 text-right">{p.orderCount}</td>
                        <td className="px-4 py-3 text-right">{p.totalQuantity}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(p.totalRevenue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      {/* ── Low Stock Tab ── */}
      {tab === 'Low Stock' && (
        lowLoading ? <PageLoader /> : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Product</th>
                    <th className="px-4 py-3 text-right font-medium">Available</th>
                    <th className="px-4 py-3 text-right font-medium">Threshold</th>
                    <th className="px-4 py-3 text-right font-medium">Reserved</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {((Array.isArray(lowStock) ? lowStock : []) as unknown[]).map((inv: unknown) => {
                    const item = inv as {
                      id: string;
                      availableStock: number;
                      lowStockThreshold: number;
                      reservedStock: number;
                      product: { name: string; sku: string };
                    };
                    return (
                      <tr key={item.id} className="bg-red-50/30">
                        <td className="px-4 py-3">
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-xs text-muted-foreground">{item.product?.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-destructive">{item.availableStock}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{item.lowStockThreshold}</td>
                        <td className="px-4 py-3 text-right text-orange-600">{item.reservedStock}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      {/* ── Pending Orders Tab ── */}
      {tab === 'Pending Orders' && (
        pendingLoading ? <PageLoader /> : (
          <Card>
            <CardTitle className="mb-4">Pending Approval Queue</CardTitle>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Order</th>
                    <th className="px-4 py-3 text-left font-medium">Customer</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 text-right font-medium">Waiting</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(pendingOrders?.data ?? []).map((order: Order) => {
                    const ageMin = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                    return (
                      <tr key={order.id} className="bg-card hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {(order as unknown as { customer?: { businessName?: string; name?: string } }).customer?.businessName ||
                           (order as unknown as { customer?: { name?: string } }).customer?.name}
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(order.totalAmount)}</td>
                        <td className={`px-4 py-3 text-right ${ageMin > 60 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                          {ageMin < 60 ? `${ageMin}m` : `${Math.floor(ageMin / 60)}h`}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={order.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}
    </OwnerShell>
  );
}

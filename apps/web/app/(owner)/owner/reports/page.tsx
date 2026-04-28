'use client';

import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSalesSummary, useTopProducts, useLowStock, useOrders } from '../../../../hooks/use-api';
import { PageHeader, Card, CardHeader, CardTitle, PageLoader, StatusBadge, ScrollTabs } from '../../../../components/shared';
import { formatCurrency, formatDate, type Order } from '../../../../types';
import OwnerShell from '../../../../components/layout/OwnerShell';
import { DatePicker } from '../../../../components/shared/DatePicker';
import { TrendingUp, AlertTriangle, ClipboardList, Download } from 'lucide-react';

const TABS = ['Sales', 'Top Products', 'Low Stock', 'Pending Orders'] as const;
type Tab = typeof TABS[number];

type TopProductItem = {
  product?: { name: string; sku: string; agency?: { name: string } };
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
};

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

  const topProductsData = ((topProducts as unknown[]) ?? []) as TopProductItem[];

  const exportRows = useMemo<Record<string, string | number>[]>(() => {
    if (tab === 'Top Products') {
      return topProductsData.map((p) => ({
        product: p.product?.name ?? 'Unknown',
        orders: p.orderCount,
        quantity_sold: p.totalQuantity,
        revenue: formatCurrency(p.totalRevenue),
        stock_impact: `-${p.totalQuantity}`,
      }));
    }
    if (tab === 'Pending Orders') {
      return (pendingOrders?.data ?? []).map((o) => ({
        order_number: o.orderNumber,
        customer: o.customer?.businessName || o.customer?.name,
        amount: formatCurrency(o.totalAmount),
        status: o.status,
        created_at: formatDate(o.createdAt),
      }));
    }
    return [];
  }, [tab, topProductsData, pendingOrders?.data]);

  function exportCsv() {
    if (!exportRows.length) return;
    const headers = Object.keys(exportRows[0]);
    const csv = [headers.join(','), ...exportRows.map((row) => headers.map((h) => JSON.stringify((row as Record<string, string | number>)[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${tab.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <OwnerShell>
      <PageHeader
        title="Reports"
        description="Business insights and analytics"
        action={
          <button onClick={exportCsv} disabled={!exportRows.length} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted disabled:opacity-50 max-sm:w-full">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-2 min-w-0">
          <label className="text-sm font-medium whitespace-nowrap">From</label>
          <DatePicker value={from} onChange={setFrom} placeholder="Start date" />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <label className="text-sm font-medium whitespace-nowrap">To</label>
          <DatePicker value={to} onChange={setTo} placeholder="End date" />
        </div>
        {(from || to) && (
          <button onClick={() => { setFrom(''); setTo(''); }} className="text-left text-sm text-muted-foreground hover:text-foreground">
            Clear dates
          </button>
        )}
      </div>

      <ScrollTabs
        className="mb-6"
        value={tab}
        onChange={(next) => setTab(next as Tab)}
        options={TABS.map((t) => ({ label: t, value: t }))}
      />

      {tab === 'Sales' && (
        salesLoading ? <PageLoader /> : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <Card><div className="mb-1 flex items-center gap-3"><TrendingUp className="h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">Total Revenue</p></div><p className="break-words text-[clamp(1.1rem,5vw,1.8rem)] font-bold">{formatCurrency(salesData?.totalRevenue ?? 0)}</p></Card>
              <Card><div className="mb-1 flex items-center gap-3"><ClipboardList className="h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">Orders Delivered</p></div><p className="text-[clamp(1.1rem,5vw,1.8rem)] font-bold">{salesData?.totalOrders ?? 0}</p></Card>
              <Card className="col-span-2 lg:col-span-1"><div className="mb-1 flex items-center gap-3"><TrendingUp className="h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">Avg Order Value</p></div><p className="break-words text-[clamp(1.1rem,5vw,1.8rem)] font-bold">{salesData?.totalOrders ? formatCurrency(Math.round((salesData.totalRevenue ?? 0) / salesData.totalOrders)) : '₹0'}</p></Card>
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

      {tab === 'Top Products' && (
        topLoading ? <PageLoader /> : (
          <>
            <div className="space-y-3 md:hidden">
              {topProductsData.map((p, i) => (
                <Card key={`${p.product?.sku}-${i}`}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">#{i + 1} {p.product?.name}</p>
                      <p className="text-xs text-muted-foreground">{p.product?.agency?.name} • {p.product?.sku}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(p.totalRevenue)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Mini label="Orders" value={p.orderCount} />
                    <Mini label="Quantity Sold" value={p.totalQuantity} />
                    <Mini label="Revenue" value={formatCurrency(p.totalRevenue)} />
                    <Mini label="Stock Impact" value={`-${p.totalQuantity}`} />
                  </div>
                </Card>
              ))}
            </div>

            <Card className="hidden md:block">
              <CardTitle className="mb-4">Top Products by Revenue</CardTitle>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50"><tr><th className="px-4 py-3 text-left font-medium">#</th><th className="px-4 py-3 text-left font-medium">Product</th><th className="px-4 py-3 text-right font-medium">Orders</th><th className="px-4 py-3 text-right font-medium">Qty Sold</th><th className="px-4 py-3 text-right font-medium">Revenue</th><th className="px-4 py-3 text-right font-medium">Stock Impact</th></tr></thead>
                  <tbody className="divide-y">
                    {topProductsData.map((p, i) => (
                      <tr key={i} className="bg-card hover:bg-muted/30">
                        <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-3"><p className="font-medium">{p.product?.name}</p><p className="text-xs text-muted-foreground">{p.product?.agency?.name}</p></td>
                        <td className="px-4 py-3 text-right">{p.orderCount}</td><td className="px-4 py-3 text-right">{p.totalQuantity}</td><td className="px-4 py-3 text-right font-semibold">{formatCurrency(p.totalRevenue)}</td><td className="px-4 py-3 text-right text-muted-foreground">-{p.totalQuantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )
      )}

      {tab === 'Low Stock' && (
        lowLoading ? <PageLoader /> : (
          <>
            <div className="space-y-3 md:hidden">
              {((Array.isArray(lowStock) ? lowStock : []) as any[]).map((item) => (
                <Card key={item.id}>
                  <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold">{item.product?.name}</p><span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">Low</span></div>
                  <p className="mb-2 text-xs text-muted-foreground">{item.product?.sku}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <Mini label="Available" value={item.availableStock} danger />
                    <Mini label="Threshold" value={item.lowStockThreshold} />
                    <Mini label="Reserved" value={item.reservedStock} />
                  </div>
                </Card>
              ))}
            </div>

            <Card className="hidden md:block">
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Low Stock Items</CardTitle></CardHeader>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50"><tr><th className="px-4 py-3 text-left font-medium">Product</th><th className="px-4 py-3 text-right font-medium">Available</th><th className="px-4 py-3 text-right font-medium">Threshold</th><th className="px-4 py-3 text-right font-medium">Reserved</th></tr></thead>
                  <tbody className="divide-y">{((Array.isArray(lowStock) ? lowStock : []) as any[]).map((item) => (<tr key={item.id} className="bg-red-50/30"><td className="px-4 py-3"><p className="font-medium">{item.product?.name}</p><p className="text-xs text-muted-foreground">{item.product?.sku}</p></td><td className="px-4 py-3 text-right font-bold text-destructive">{item.availableStock}</td><td className="px-4 py-3 text-right text-muted-foreground">{item.lowStockThreshold}</td><td className="px-4 py-3 text-right text-orange-600">{item.reservedStock}</td></tr>))}</tbody>
                </table>
              </div>
            </Card>
          </>
        )
      )}

      {tab === 'Pending Orders' && (
        pendingLoading ? <PageLoader /> : (
          <>
            <div className="space-y-3 md:hidden">
              {(pendingOrders?.data ?? []).map((order: Order) => {
                const ageMin = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                return (
                  <Card key={order.id}>
                    <div className="mb-2 flex items-start justify-between gap-2"><div><p className="text-sm font-semibold">{order.orderNumber}</p><p className="text-xs text-muted-foreground">{order.customer?.businessName || order.customer?.name}</p></div><StatusBadge status={order.status} /></div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Mini label="Amount" value={formatCurrency(order.totalAmount)} />
                      <Mini label="Waiting" value={ageMin < 60 ? `${ageMin}m` : `${Math.floor(ageMin / 60)}h`} danger={ageMin > 60} />
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="hidden md:block">
              <CardTitle className="mb-4">Pending Approval Queue</CardTitle>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50"><tr><th className="px-4 py-3 text-left font-medium">Order</th><th className="px-4 py-3 text-left font-medium">Customer</th><th className="px-4 py-3 text-right font-medium">Amount</th><th className="px-4 py-3 text-right font-medium">Waiting</th><th className="px-4 py-3 text-center font-medium">Status</th></tr></thead>
                  <tbody className="divide-y">{(pendingOrders?.data ?? []).map((order: Order) => {const ageMin = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);return (<tr key={order.id} className="bg-card hover:bg-muted/30"><td className="px-4 py-3 font-medium">{order.orderNumber}</td><td className="px-4 py-3 text-muted-foreground">{order.customer?.businessName || order.customer?.name}</td><td className="px-4 py-3 text-right">{formatCurrency(order.totalAmount)}</td><td className={`px-4 py-3 text-right ${ageMin > 60 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>{ageMin < 60 ? `${ageMin}m` : `${Math.floor(ageMin / 60)}h`}</td><td className="px-4 py-3 text-center"><StatusBadge status={order.status} /></td></tr>);})}</tbody>
                </table>
              </div>
            </Card>
          </>
        )
      )}
    </OwnerShell>
  );
}

function Mini({ label, value, danger }: { label: string; value: string | number; danger?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/30 p-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-xs font-semibold ${danger ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  );
}

'use client';
import React, { useState } from 'react';
import { useInventory } from '../../../../hooks/use-api';
import { api } from '../../../../lib/api-client';
import { PageHeader, Pagination } from '../../../../components/shared';
import { SkeletonTable } from '../../../../components/shared/SkeletonLoader';
import { NoInventory } from '../../../../components/shared/EmptyState';
import OwnerShell from '../../../../components/layout/OwnerShell';
import { AlertTriangle, Package, History, X } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate } from '../../../../types';

type InventoryItem = {
  id: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  isLowStock: boolean;
  lowStockThreshold?: number;
  product: { id: string; name: string; sku: string };
};

type HistoryItem = {
  id: string;
  delta: number;
  reason: string;
  createdAt: string;
  note?: string;
  adjustedBy?: { name?: string };
};

export default function OwnerInventoryPage() {
  const [page, setPage] = useState(1);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('MANUAL_RESTOCK');
  const [historyFor, setHistoryFor] = useState<InventoryItem | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { data, isLoading } = useInventory({ page, limit: 30, lowStock: lowStockOnly });
  const qc = useQueryClient();
  const inventory = (data as { data?: InventoryItem[] })?.data ?? [];
  const meta = (data as { meta?: { page: number; totalPages: number } })?.meta;

  async function handleAdjust(productId: string) {
    if (!delta) return;
    try {
      await api.post(`/inventory/${productId}/adjust`, { delta: parseInt(delta), reason });
      toast.success('Stock adjusted!');
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setAdjusting(null);
      setDelta('');
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  }

  async function openHistory(item: InventoryItem) {
    setHistoryFor(item);
    setHistoryLoading(true);
    try {
      const res = await api.get<{ data: HistoryItem[] }>(`/inventory/${item.product.id}/history`, { params: { limit: 30 } });
      setHistory(res.data ?? []);
    } catch {
      toast.error('Unable to load history');
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <OwnerShell>
      <PageHeader title="Inventory" description="Manage stock levels"
        action={<button onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1); }}
          className={cn('flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium', lowStockOnly ? 'bg-destructive text-destructive-foreground' : 'hover:bg-muted')}>
          <AlertTriangle className="h-4 w-4" />{lowStockOnly ? 'Show All' : 'Low Stock Only'}
        </button>} />
      {isLoading ? <SkeletonTable rows={15} /> : !inventory.length ? <NoInventory /> : (
        <>
          <div className="grid gap-3 md:hidden">
            {inventory.map((item) => (
              <div key={item.id} className={cn('rounded-xl border bg-card p-4 shadow-sm', item.isLowStock && 'border-destructive/40')}>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.product?.name}</p>
                      <p className="text-xs text-muted-foreground">{item.product?.sku}</p>
                    </div>
                  </div>
                  {item.isLowStock ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">Low Stock</span> : null}
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Total" value={item.totalStock} />
                  <Stat label="Reserved" value={item.reservedStock} />
                  <Stat label="Available" value={item.availableStock} emphasis={item.isLowStock} />
                  <Stat label="Threshold" value={item.lowStockThreshold ?? '—'} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setReason('MANUAL_RESTOCK'); setDelta(''); setAdjusting(adjusting === item.product.id ? null : item.product.id); }} className="min-h-11 rounded-lg border text-xs font-medium hover:bg-muted">Add Stock</button>
                  <button onClick={() => { setReason('CORRECTION'); setDelta(''); setAdjusting(adjusting === item.product.id ? null : item.product.id); }} className="min-h-11 rounded-lg border text-xs font-medium hover:bg-muted">Reduce Stock</button>
                  <button onClick={() => { setReason('CORRECTION'); setAdjusting(adjusting === item.product.id ? null : item.product.id); }} className="min-h-11 rounded-lg border text-xs font-medium hover:bg-muted">Adjust</button>
                  <button onClick={() => openHistory(item)} className="flex min-h-11 items-center justify-center gap-1 rounded-lg border text-xs font-medium hover:bg-muted"><History className="h-3.5 w-3.5" /> History</button>
                </div>

                {adjusting === item.product?.id && (
                  <div className="mt-3 space-y-2 rounded-lg border p-3">
                    <div className="flex gap-2">
                      <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="+50 or -10" className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
                      <select value={reason} onChange={(e) => setReason(e.target.value)} className="h-11 rounded-lg border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary">
                        <option value="MANUAL_RESTOCK">Restock</option><option value="DAMAGE">Damage</option><option value="RETURN">Return</option><option value="CORRECTION">Correction</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAdjust(item.product?.id)} className="min-h-11 flex-1 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">Save</button>
                      <button onClick={() => setAdjusting(null)} className="min-h-11 flex-1 rounded-lg border text-sm font-medium">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Reserved</th>
                  <th className="px-4 py-3 text-right font-medium">Available</th>
                  <th className="px-4 py-3 text-center font-medium">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inventory.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr className={cn('bg-card hover:bg-muted/30', item.isLowStock && 'bg-red-50/50')}>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><Package className="h-4 w-4 text-muted-foreground" /><div><p className="font-medium">{item.product?.name}</p><p className="text-xs text-muted-foreground">{item.product?.sku}</p></div></div></td>
                      <td className="px-4 py-3 text-right">{item.totalStock}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{item.reservedStock}</td>
                      <td className="px-4 py-3 text-right font-semibold"><span className={item.isLowStock ? 'text-destructive' : 'text-green-600'}>{item.availableStock}</span></td>
                      <td className="px-4 py-3 text-center"><button onClick={() => setAdjusting(adjusting === item.product?.id ? null : item.product?.id)} className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted">Adjust</button></td>
                    </tr>
                    {adjusting === item.product?.id && (
                      <tr className="bg-muted/20"><td colSpan={5} className="px-4 py-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="+50 or -10" className="w-32 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                          <select value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
                            <option value="MANUAL_RESTOCK">Restock</option><option value="DAMAGE">Damage</option><option value="RETURN">Return</option><option value="CORRECTION">Correction</option>
                          </select>
                          <button onClick={() => handleAdjust(item.product?.id)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Save</button>
                          <button onClick={() => setAdjusting(null)} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                          <button onClick={() => openHistory(item)} className="rounded-lg border px-3 py-2 text-sm hover:bg-muted">History</button>
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}
        </>
      )}

      {historyFor && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center" onClick={() => setHistoryFor(null)}>
          <div className="w-full rounded-t-2xl border bg-card p-4 sm:max-w-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Stock History • {historyFor.product.name}</h3>
              <button onClick={() => setHistoryFor(null)} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {historyLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : history.length ? history.map((h) => (
                <div key={h.id} className="rounded-lg border p-2">
                  <div className="flex items-center justify-between">
                    <p className={cn('text-sm font-semibold', h.delta >= 0 ? 'text-green-600' : 'text-destructive')}>{h.delta >= 0 ? `+${h.delta}` : h.delta}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(h.createdAt)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{h.reason} {h.adjustedBy?.name ? `• by ${h.adjustedBy.name}` : ''}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No history available.</p>}
            </div>
          </div>
        </div>
      )}
    </OwnerShell>
  );
}

function Stat({ label, value, emphasis }: { label: string; value: string | number; emphasis?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/30 p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className={cn('font-semibold', emphasis && label === 'Available' && 'text-destructive')}>{value}</p>
    </div>
  );
}

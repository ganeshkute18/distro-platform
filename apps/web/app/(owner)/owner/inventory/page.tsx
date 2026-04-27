'use client';
import React, { useState } from 'react';
import { useInventory } from '../../../../hooks/use-api';
import { api } from '../../../../lib/api-client';
import { PageHeader, EmptyState, Pagination } from '../../../../components/shared';
import { SkeletonTable } from '../../../../components/shared/SkeletonLoader';
import { NoInventory } from '../../../../components/shared/EmptyState';
import OwnerShell from '../../../../components/layout/OwnerShell';
import { AlertTriangle, Package } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function OwnerInventoryPage() {
  const [page, setPage] = useState(1);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('MANUAL_RESTOCK');
  const { data, isLoading } = useInventory({ page, limit: 30, lowStock: lowStockOnly });
  const qc = useQueryClient();
  const inventory = (data as { data?: unknown[] })?.data ?? [];
  const meta = (data as { meta?: { page: number; totalPages: number } })?.meta;

  async function handleAdjust(productId: string) {
    if (!delta) return;
    try {
      await api.post(`/inventory/${productId}/adjust`, { delta: parseInt(delta), reason });
      toast.success('Stock adjusted!');
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setAdjusting(null); setDelta('');
    } catch (e: unknown) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'); }
  }

  return (
    <OwnerShell>
      <PageHeader title="Inventory" description="Manage stock levels"
        action={<button onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1); }}
          className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium', lowStockOnly ? 'bg-destructive text-destructive-foreground' : 'hover:bg-muted')}>
          <AlertTriangle className="h-4 w-4" />{lowStockOnly ? 'Show All' : 'Low Stock Only'}
        </button>} />
      {isLoading ? <SkeletonTable rows={15} /> : !inventory.length ? <NoInventory /> : (
        <>
          <div className="overflow-hidden rounded-xl border">
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
                {inventory.map((inv: unknown) => {
                  const item = inv as { id: string; totalStock: number; reservedStock: number; availableStock: number; isLowStock: boolean; product: { id: string; name: string; sku: string } };
                  return (
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
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}
        </>
      )}
    </OwnerShell>
  );
}

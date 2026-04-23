'use client';

import React, { useState } from 'react';
import { useInventory } from '../../../../hooks/use-api';
import { PageLoader, EmptyState, PageHeader, Pagination } from '../../../../components/shared';
import StaffShell from '../../../../components/layout/StaffShell';
import { AlertTriangle, Package } from 'lucide-react';
import { cn } from '../../../../lib/utils';

export default function StaffInventoryPage() {
  const [page, setPage] = useState(1);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const { data, isLoading } = useInventory({ page, limit: 30, lowStock: lowStockOnly });

  const inventory = (data as { data?: unknown[] })?.data ?? [];
  const meta = (data as { meta?: { page: number; totalPages: number } })?.meta;

  return (
    <StaffShell>
      <PageHeader
        title="Inventory"
        description="Current stock levels"
        action={
          <button
            onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1); }}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              lowStockOnly ? 'bg-destructive text-destructive-foreground border-destructive' : 'hover:bg-muted'
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            {lowStockOnly ? 'Show All' : 'Low Stock Only'}
          </button>
        }
      />

      {isLoading ? (
        <PageLoader />
      ) : !inventory.length ? (
        <EmptyState title="No inventory records" />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">SKU</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Reserved</th>
                  <th className="px-4 py-3 text-right font-medium">Available</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inventory.map((inv: unknown) => {
                  const item = inv as {
                    id: string;
                    totalStock: number;
                    reservedStock: number;
                    availableStock: number;
                    isLowStock: boolean;
                    lowStockThreshold: number;
                    product: { id: string; name: string; sku: string; unitType: string };
                  };
                  return (
                    <tr key={item.id} className={cn('bg-card hover:bg-muted/30 transition-colors', item.isLowStock && 'bg-red-50/50')}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium">{item.product?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.product?.sku}</td>
                      <td className="px-4 py-3 text-right">{item.totalStock}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{item.reservedStock}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        <span className={item.isLowStock ? 'text-destructive' : 'text-green-600'}>
                          {item.availableStock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.isLowStock ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {meta && (
            <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </StaffShell>
  );
}

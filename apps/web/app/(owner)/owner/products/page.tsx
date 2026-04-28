'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Package, Edit2, ToggleLeft, Trash2 } from 'lucide-react';
import { useProducts } from '../../../../hooks/use-api';
import { api } from '../../../../lib/api-client';
import { PageHeader, Pagination } from '../../../../components/shared';
import { SkeletonTable } from '../../../../components/shared/SkeletonLoader';
import { NoProducts } from '../../../../components/shared/EmptyState';
import { formatCurrency, type Product } from '../../../../types';
import OwnerShell from '../../../../components/layout/OwnerShell';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function OwnerProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const { data, isLoading } = useProducts({ search: search || undefined, page, limit: 20 });

  async function toggleActive(product: Product) {
    try {
      await api.patch(`/products/${product.id}`, { isActive: !product.isActive });
      toast.success(`Product ${product.isActive ? 'deactivated' : 'activated'}`);
      qc.invalidateQueries({ queryKey: ['products'] });
    } catch {
      toast.error('Failed to update product');
    }
  }

  async function deleteProduct(product: Product) {
    if (!confirm(`Remove "${product.name}" from catalog?`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      toast.success('Product removed');
      qc.invalidateQueries({ queryKey: ['products'] });
    } catch {
      toast.error('Failed to remove product');
    }
  }

  return (
    <OwnerShell>
      <PageHeader
        title="Products"
        description="Manage your product catalog"
        action={
          <Link
            href="/owner/products/new"
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 max-sm:w-full"
          >
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        }
      />

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search by name or SKU…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-11 w-full max-w-md rounded-lg border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {isLoading ? <SkeletonTable rows={10} /> : !data?.data?.length ? (
        <NoProducts />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <div className="touch-scroll overflow-x-auto">
              <table className="min-w-[860px] w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left font-medium">Product</th>
                    <th className="px-4 py-3 text-left font-medium">Agency</th>
                    <th className="px-4 py-3 text-right font-medium">Price</th>
                    <th className="px-4 py-3 text-right font-medium">Stock</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.data.map((product: Product) => {
                    const available = (product.inventory?.totalStock ?? 0) - (product.inventory?.reservedStock ?? 0);
                    return (
                      <tr key={product.id} className="bg-card transition-colors hover:bg-muted/30">
                        <td className="sticky left-0 z-10 bg-card px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                              {product.imageUrls?.[0]
                                ? <img src={product.imageUrls[0]} alt={product.name} className="h-full w-full object-cover" />
                                : <div className="flex h-full items-center justify-center"><Package className="h-4 w-4 text-muted-foreground/40" /></div>}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium whitespace-nowrap">{product.name}</p>
                              <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{product.agency?.name}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(product.pricePerUnit)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={available <= (product.inventory?.lowStockThreshold ?? 10) ? 'font-semibold text-destructive' : ''}>
                            {available}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/owner/products/${product.id}/edit`}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => toggleActive(product)}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <ToggleLeft className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteProduct(product)}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                              title="Remove product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground sm:hidden">Swipe left/right to view all product data and actions.</p>
          <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
        </>
      )}
    </OwnerShell>
  );
}

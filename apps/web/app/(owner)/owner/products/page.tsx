'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Package, Edit2, ToggleLeft, Trash2 } from 'lucide-react';
import { useProducts } from '../../../../hooks/use-api';
import { api } from '../../../../lib/api-client';
import { PageHeader, PageLoader, EmptyState, Pagination, StatusBadge } from '../../../../components/shared';
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
          <Link href="/owner/products/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        }
      />

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search" placeholder="Search by name or SKU…"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-md rounded-lg border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {isLoading ? <PageLoader /> : !data?.data?.length ? (
        <EmptyState title="No products yet" description="Add your first product to get started."
          action={<Link href="/owner/products/new" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">Add Product</Link>} />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Agency</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">Stock</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.data.map((product: Product) => {
                  const available = (product.inventory?.totalStock ?? 0) - (product.inventory?.reservedStock ?? 0);
                  return (
                    <tr key={product.id} className="bg-card hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                            {product.imageUrls?.[0]
                              ? <img src={product.imageUrls[0]} alt={product.name} className="h-full w-full object-cover" />
                              : <div className="flex h-full items-center justify-center"><Package className="h-4 w-4 text-muted-foreground/40" /></div>}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{product.agency?.name}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(product.pricePerUnit)}</td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className={available <= (product.inventory?.lowStockThreshold ?? 10) ? 'text-destructive font-semibold' : ''}>
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
                          <Link href={`/owner/products/${product.id}/edit`}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button onClick={() => toggleActive(product)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <ToggleLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
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
          <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
        </>
      )}
    </OwnerShell>
  );
}

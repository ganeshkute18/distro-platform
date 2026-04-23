'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, ShoppingCart, Package } from 'lucide-react';
import { useProducts, useCategories, useAgencies } from '../../../hooks/use-api';
import { PageLoader, EmptyState, Pagination } from '../../../components/shared';
import { formatCurrency, type Product } from '../../../types';
import { useCartStore } from '../../../store/cart.store';
import CustomerShell from '../../../components/layout/CustomerShell';
import toast from 'react-hot-toast';

export default function CatalogPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useProducts({
    search: search || undefined,
    categoryId: categoryId || undefined,
    agencyId: agencyId || undefined,
    page,
    limit: 24,
  });
  const { data: categories } = useCategories();
  const { data: agencies } = useAgencies();
  const { addItem } = useCartStore();

  function handleAddToCart(product: Product) {
    addItem(product, product.minOrderQty || 1);
    toast.success(`${product.name} added to cart`);
  }

  return (
    <CustomerShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Product Catalog</h1>
        <p className="text-sm text-muted-foreground">Browse and order products from our suppliers</p>
      </div>

      {/* Search + Filter Bar */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search products, SKU…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-6 flex flex-wrap gap-4 rounded-xl border bg-muted/30 p-4">
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All categories</option>
              {(Array.isArray(categories) ? categories : []).map((cat: { id: string; name: string }) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Agency / Brand</label>
            <select
              value={agencyId}
              onChange={(e) => { setAgencyId(e.target.value); setPage(1); }}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All agencies</option>
              {((agencies as { data?: { id: string; name: string }[] })?.data ?? []).map((a: { id: string; name: string }) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { setCategoryId(''); setAgencyId(''); setSearch(''); setPage(1); }}
            className="self-end rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Results count */}
      {data && (
        <p className="mb-4 text-sm text-muted-foreground">
          {data.meta.total} product{data.meta.total !== 1 ? 's' : ''} found
        </p>
      )}

      {isLoading ? (
        <PageLoader />
      ) : !data?.data?.length ? (
        <EmptyState
          title="No products found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.data.map((product: Product) => {
              const available = (product.inventory?.totalStock ?? 0) - (product.inventory?.reservedStock ?? 0);
              const inStock = available > 0;

              return (
                <div key={product.id} className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
                  <Link href={`/catalog/${product.id}`}>
                    <div className="aspect-square bg-muted overflow-hidden">
                      {product.imageUrls?.[0] ? (
                        <img
                          src={product.imageUrls[0]}
                          alt={product.name}
                          className="h-full w-full object-cover hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-3">
                    <p className="text-xs text-muted-foreground">{product.agency?.name}</p>
                    <Link href={`/catalog/${product.id}`}>
                      <h3 className="mt-0.5 text-sm font-medium leading-snug hover:text-primary line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">SKU: {product.sku}</p>

                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-base">{formatCurrency(product.pricePerUnit)}</p>
                        <p className="text-xs text-muted-foreground">per {product.unitType.toLowerCase()}</p>
                      </div>
                      <span className={`text-xs font-medium ${inStock ? 'text-green-600' : 'text-destructive'}`}>
                        {inStock ? `${available} avail.` : 'Out of stock'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!inStock}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
        </>
      )}
    </CustomerShell>
  );
}

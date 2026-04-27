// Example Integration: Owner Products Page with Phase 2 Components
// This demonstrates best practices for using the new UI/UX components
// File would be: apps/web/app/(owner)/products/page.tsx

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Phase 2 Components
import { SkeletonGrid } from '@/components/shared/SkeletonLoader';
import { NoProducts } from '@/components/shared/EmptyState';
import { SectionHeading } from '@/components/shared/DashboardComponents';
import { EnhancedProductCard } from '@/components/shared/EnhancedProductCard';
import { showToast } from '@/components/shared/ToastProvider';

// API & Types
import { api } from '@/lib/api-client';
import { Product } from '@shared-types';

export default function OwnerProductsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch products with React Query
  const { data: products, isLoading, refetch } = useQuery(
    ['products', searchQuery],
    () => api.products.list({ search: searchQuery }),
    {
      staleTime: 60 * 1000,
      retry: 1,
    }
  );

  // Filter products based on search
  const filteredProducts = products?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateProduct = () => {
    router.push('/products/new');
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/products/${productId}/edit`);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const deletePromise = api.products.delete(productId);
      showToast.promise(deletePromise, {
        loading: 'Deleting product...',
        success: 'Product deleted successfully!',
        error: 'Failed to delete product',
      });

      await deletePromise;
      refetch();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Render: Loading State with Skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeading
          title="Products"
          action={{
            label: 'Create Product',
            onClick: handleCreateProduct,
          }}
        />
        <SkeletonGrid count={6} />
      </div>
    );
  }

  // Render: Empty State
  if (!filteredProducts || filteredProducts.length === 0) {
    if (searchQuery) {
      return (
        <div className="space-y-6">
          <SectionHeading
            title="Products"
            action={{
              label: 'Create Product',
              onClick: handleCreateProduct,
            }}
          />
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-background"
            />
          </div>
          <NoProducts />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <SectionHeading
          title="Products"
          action={{
            label: 'Create Product',
            onClick: handleCreateProduct,
          }}
        />
        <NoProducts />
      </div>
    );
  }

  // Render: Products Grid with Search
  return (
    <div className="space-y-6">
      <SectionHeading
        title="Products"
        subtitle={`${filteredProducts.length} products`}
        action={{
          label: 'Create Product',
          onClick: handleCreateProduct,
        }}
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <input
          type="text"
          placeholder="Search products by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="relative group">
            <EnhancedProductCard
              product={product}
              onAddToCart={() => {
                // This is for display only on owner page
                // In real implementation, owner would edit product
              }}
            />

            {/* Owner Action Buttons - Overlay */}
            <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => handleEditProduct(product.id)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteProduct(product.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// INTEGRATION NOTES:
// ============================================================================
// 1. SkeletonGrid shows while data loads
// 2. NoProducts empty state when no products exist
// 3. EnhancedProductCard displays product info
// 4. showToast.promise handles async delete operation
// 5. SectionHeading provides title + action button
// 6. Search integrated with existing filter
//
// Best Practices Applied:
// ✓ Loading state handled
// ✓ Empty state handled
// ✓ Error handling with toast
// ✓ Responsive grid layout
// ✓ Click handlers with proper error catching
// ============================================================================

// Example Integration: Customer Shopping Page
// File would be: apps/web/app/(customer)/browse/page.tsx

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';

// Phase 2 Components
import { SkeletonGrid } from '@/components/shared/SkeletonLoader';
import { NoSearchResults, NoProducts } from '@/components/shared/EmptyState';
import { EnhancedProductCard } from '@/components/shared/EnhancedProductCard';
import { StickyCartButton } from '@/components/shared/StickyCartButton';
import { showToast } from '@/components/shared/ToastProvider';

// Store & API
import { useCart } from '@/store/cart.store';
import { api } from '@/lib/api-client';
import { Product } from '@shared-types';

export default function CustomerBrowsePage() {
  const router = useRouter();
  const { items, total, addItem } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch products
  const { data: products, isLoading } = useQuery(
    ['products', searchQuery, selectedCategory],
    () =>
      api.products.list({
        search: searchQuery,
        category: selectedCategory || undefined,
      }),
    {
      staleTime: 60 * 1000,
      retry: 1,
    }
  );

  // Fetch categories
  const { data: categories } = useQuery(
    ['categories'],
    () => api.categories.list(),
    {
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  );

  // Filter products
  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const handleAddToCart = (productId: string, quantity: number) => {
    addItem({ productId, quantity });
    showToast.success(`Added ${quantity} item(s) to cart`);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      showToast.info('Your cart is empty');
      return;
    }
    router.push('/checkout');
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Render: Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="sticky top-0 bg-background/95 backdrop-blur z-10 pb-4">
          <h1 className="text-3xl font-bold mb-4">Shop</h1>
          <div className="space-y-3">
            <div className="h-10 bg-muted rounded-lg animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <SkeletonGrid count={6} />
      </div>
    );
  }

  // Render: No products at all
  if (!products || products.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Shop</h1>
        <NoProducts />
      </div>
    );
  }

  // Render: Browse with filters and search
  return (
    <div className="space-y-6 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 space-y-4 pt-4 pb-4">
        <h1 className="text-3xl font-bold">Shop</h1>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filters Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Categories Filter - Mobile */}
        {(showFilters || window.innerWidth >= 768) && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Categories</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-accent'
                }`}
              >
                All Products
              </button>
              {categories?.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-accent'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <NoSearchResults />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <EnhancedProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onWishlist={(productId) => {
                showToast.success('Added to wishlist');
              }}
              isInWishlist={false} // Could integrate with wishlist store
            />
          ))}
        </div>
      )}

      {/* Sticky Cart Button - Mobile Only */}
      <StickyCartButton
        itemCount={items.length}
        totalPrice={total}
        onCheckout={handleCheckout}
      />
    </div>
  );
}

// ============================================================================
// INTEGRATION NOTES:
// ============================================================================
// 1. SkeletonGrid shows while products load
// 2. EnhancedProductCard for each product with quantity selector
// 3. StickyCartButton visible on mobile (bottom navigation)
// 4. Search and filter integrated
// 5. Toast notifications for user actions
// 6. NoSearchResults when no matches found
// 7. NoProducts when catalog is empty
// 8. Sticky header with search stays visible during scroll
//
// Best Practices Applied:
// ✓ Loading states with skeleton
// ✓ Empty states for no results
// ✓ Product cards with quantity control
// ✓ Mobile-optimized UI (sticky cart)
// ✓ Toast notifications for feedback
// ✓ Search and category filtering
// ✓ Responsive design
// ✓ Smooth transitions and animations
// ============================================================================

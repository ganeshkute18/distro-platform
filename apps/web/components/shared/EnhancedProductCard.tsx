// Enhanced product card component with better UX
'use client';

import { useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { type Product } from '../../types';

interface EnhancedProductCardProps {
  product: Product;
  onAddToCart?: (productId: string, quantity: number) => void;
  onWishlist?: (productId: string) => void;
  isInWishlist?: boolean;
  isLoading?: boolean;
}

export function EnhancedProductCard({
  product,
  onAddToCart,
  onWishlist,
  isInWishlist = false,
  isLoading = false,
}: EnhancedProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToCart?.(product.id, quantity);
    setQuantity(1); // Reset quantity
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    onWishlist?.(product.id);
  };

  const inStock = product.inventory?.availableStock && product.inventory.availableStock > 0;
  const discount = 0; // No discount field on Product type
  const originalPrice = product.pricePerUnit;
  const finalPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;

  return (
    <div className="group relative bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative overflow-hidden bg-muted aspect-square">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        {product.imageUrls && product.imageUrls.length > 0 ? (
          <img
            src={product.imageUrls[0]}
            alt={product.name}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-sm">No image</span>
          </div>
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            -{discount}%
          </div>
        )}

        {/* Stock Status */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 left-3 bg-white/90 hover:bg-white p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          disabled={isLoading}
        >
          <Heart
            className={`w-5 h-5 ${
              isInWishlist
                ? 'fill-red-600 text-red-600'
                : 'text-gray-600'
            }`}
          />
        </button>
      </div>

      {/* Content Container */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        {/* Product Info */}
        <div>
          <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {product.description}
            </p>
          )}

          {/* Pricing */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-lg font-bold text-foreground">
              ₹{finalPrice.toFixed(2)}
            </span>
            {discount > 0 && (
              <span className="text-sm line-through text-muted-foreground">
                ₹{originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Action Section */}
        <div className="space-y-2">
          {inStock && (
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex-1 py-1 hover:bg-background rounded transition-colors text-sm font-medium"
              >
                −
              </button>
              <span className="flex-1 text-center text-sm font-medium">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity(Math.min(product.stock || 99, quantity + 1))
                }
                className="flex-1 py-1 hover:bg-background rounded transition-colors text-sm font-medium"
              >
                +
              </button>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={!inStock || isLoading}
            className={`w-full py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              inStock
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}

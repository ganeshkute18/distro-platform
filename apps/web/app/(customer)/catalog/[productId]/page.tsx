'use client';
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Package, Plus, Minus } from 'lucide-react';
import { useProduct } from '../../../../hooks/use-api';
import { PageLoader, Card } from '../../../../components/shared';
import { formatCurrency } from '../../../../types';
import CustomerShell from '../../../../components/layout/CustomerShell';
import { useCartStore } from '../../../../store/cart.store';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const { data: product, isLoading } = useProduct(productId);
  const { addItem } = useCartStore();
  const [qty, setQty] = useState(1);

  if (isLoading) return <CustomerShell><PageLoader /></CustomerShell>;
  if (!product) return <CustomerShell><p className="py-12 text-center text-muted-foreground">Product not found.</p></CustomerShell>;

  const available = (product.inventory?.totalStock ?? 0) - (product.inventory?.reservedStock ?? 0);
  const inStock = available > 0;
  const taxAmount = Math.round(product.pricePerUnit * qty * (Number(product.taxPercent) / 100));

  return (
    <CustomerShell>
      <Link href="/catalog" className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to Catalog</Link>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
          {product.imageUrls?.[0] ? <img src={product.imageUrls[0]} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Package className="h-20 w-20 text-muted-foreground/20" /></div>}
        </div>
        <div>
          <p className="text-sm font-medium text-primary">{product.agency?.name}</p>
          <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">SKU: {product.sku}</p>
          {product.description && <p className="mt-4 text-muted-foreground">{product.description}</p>}
          <div className="mt-6">
            <p className="text-4xl font-bold">{formatCurrency(product.pricePerUnit)}</p>
            <p className="text-sm text-muted-foreground">per {product.unitType.toLowerCase()} + {Number(product.taxPercent)}% GST</p>
          </div>
          <div className={`mt-3 text-sm font-medium ${inStock ? 'text-green-600' : 'text-destructive'}`}>
            {inStock ? `${available} units available` : 'Out of stock'}
          </div>
          {inStock && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Quantity:</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQty(Math.max(product.minOrderQty || 1, qty - 1))} className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted"><Minus className="h-4 w-4" /></button>
                  <input type="number" value={qty} onChange={(e) => setQty(Math.max(product.minOrderQty || 1, parseInt(e.target.value) || 1))} min={product.minOrderQty || 1} className="w-20 rounded-md border bg-background px-2 py-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-primary" />
                  <button onClick={() => setQty(qty + 1)} className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted"><Plus className="h-4 w-4" /></button>
                </div>
              </div>
              <Card className="bg-muted/30">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(product.pricePerUnit * qty)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">GST</span><span>{formatCurrency(taxAmount)}</span></div>
                  <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>{formatCurrency(product.pricePerUnit * qty + taxAmount)}</span></div>
                </div>
              </Card>
              <button onClick={() => { addItem(product, qty); toast.success(`Added to cart`); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:opacity-90">
                <ShoppingCart className="h-5 w-5" /> Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </CustomerShell>
  );
}

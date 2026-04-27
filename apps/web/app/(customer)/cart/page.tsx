'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../../store/cart.store';
import { useAppSettings, useCreateOrder } from '../../../hooks/use-api';
import { formatCurrency, type CartItem } from '../../../types';
import CustomerShell from '../../../components/layout/CustomerShell';
import { DatePicker } from '../../../components/shared/DatePicker';
import Link from 'next/link';
import { api } from '../../../lib/api-client';
import toast from 'react-hot-toast';
import { compressImageToBase64 } from '../../../lib/image-utils';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clear } = useCartStore();
  const createOrder = useCreateOrder();
  const { data: settings } = useAppSettings();
  const [notes, setNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'QR'>('COD');
  const [receiptFile, setReceiptFile] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState('');
  const [imageProcessing, setImageProcessing] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.product.pricePerUnit * item.quantity, 0);
  const tax = items.reduce((sum, item) => {
    const itemTax = Math.round(item.product.pricePerUnit * item.quantity * (Number(item.product.taxPercent) / 100));
    return sum + itemTax;
  }, 0);
  const total = subtotal + tax;

  async function handlePlaceOrder() {
    if (paymentMethod === 'QR' && !receiptFile) {
      toast.error('Please upload receipt screenshot for QR payment');
      return;
    }

    const order = await createOrder.mutateAsync({
      items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      notes: notes || undefined,
      deliveryDate: deliveryDate || undefined,
      deliveryAddress: deliveryAddress || undefined,
      paymentMethod,
      paymentReceiptUrl: receiptFile || undefined,
      paymentReceiptNote: paymentNote || undefined,
    });
    clear();
    toast.success('Order placed successfully');
    router.push('/orders');
  }

  async function onReceiptSelect(file?: File) {
    if (!file) return;
    try {
      setImageProcessing(true);
      const compressed = await compressImageToBase64(file, 200);
      setReceiptFile(compressed);
      toast.success('Receipt attached');
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Failed to process receipt');
    } finally {
      setImageProcessing(false);
    }
  }

  if (!items.length) {
    return (
      <CustomerShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <h2 className="mb-2 text-xl font-semibold">Your cart is empty</h2>
          <p className="mb-6 text-sm text-muted-foreground">Add products from the catalog to get started.</p>
          <Link
            href="/catalog"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Browse Catalog
          </Link>
        </div>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell>
      <h1 className="mb-6 text-2xl font-bold">Your Cart</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item: CartItem) => (
            <div key={item.product.id} className="flex items-center gap-4 rounded-xl border bg-card p-4">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.product.imageUrls?.[0] ? (
                  <img src={item.product.imageUrls[0]} alt={item.product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">IMG</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">{item.product.agency?.name} · {item.product.sku}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(item.product.pricePerUnit)} / {item.product.unitType.toLowerCase()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  disabled={item.quantity <= (item.product.minOrderQty || 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md border hover:bg-muted disabled:opacity-40"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                  min={item.product.minOrderQty || 1}
                  max={item.product.maxOrderQty || 9999}
                  className="w-16 rounded-md border bg-background px-2 py-1 text-center text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md border hover:bg-muted"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              <div className="text-right min-w-[80px]">
                <p className="font-semibold text-sm">{formatCurrency(item.product.pricePerUnit * item.quantity)}</p>
              </div>

              <button
                onClick={() => removeItem(item.product.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 font-semibold">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold text-base">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Optional fields */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Delivery Date (optional)</label>
                <DatePicker
                  value={deliveryDate}
                  onChange={setDeliveryDate}
                  placeholder="Select delivery date"
                  minDate={new Date()}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Delivery Address (optional)</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Leave blank to use default"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Order Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Special instructions, requirements…"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'COD' | 'QR')}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="COD">Cash on Delivery</option>
                  <option value="QR">QR Payment (upload receipt)</option>
                </select>
              </div>

              {paymentMethod === 'QR' && (
                <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                  {settings?.paymentQrUrl ? (
                    <img src={settings.paymentQrUrl} alt="Payment QR" className="h-48 w-full rounded-lg object-contain bg-white p-2" />
                  ) : (
                    <p className="text-xs text-muted-foreground">Owner has not configured payment QR yet.</p>
                  )}
                  {settings?.upiId && <p className="text-xs text-muted-foreground">UPI: {settings.upiId}</p>}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onReceiptSelect(e.target.files?.[0])}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs"
                  />
                  {receiptFile ? <img src={receiptFile} alt="Receipt preview" className="h-28 w-full rounded-lg border object-contain bg-white p-1" /> : null}
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="UTR / reference number (optional)"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={createOrder.isPending || imageProcessing}
              className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {imageProcessing ? 'Processing receipt…' : createOrder.isPending ? 'Placing Order…' : 'Place Order'}
            </button>

            <p className="mt-2 text-center text-xs text-muted-foreground">
              Order will be sent for owner approval
            </p>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}

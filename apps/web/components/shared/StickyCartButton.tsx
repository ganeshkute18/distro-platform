// Sticky cart button for mobile bottom navigation
'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

interface StickyStickyCartProps {
  itemCount: number;
  totalPrice: number;
  onCheckout: () => void;
  isLoading?: boolean;
}

export function StickyCartButton({
  itemCount,
  totalPrice,
  onCheckout,
  isLoading = false,
}: StickyStickyCartProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 50);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (itemCount === 0) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 md:hidden bg-card border-t shadow-lg transition-transform duration-300 z-40 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-2xl mx-auto px-4 py-3">
        <button
          onClick={onCheckout}
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold flex items-center justify-between px-4 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span>{itemCount} items</span>
          </div>
          <span>₹{totalPrice.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
}

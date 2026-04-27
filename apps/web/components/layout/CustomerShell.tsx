'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, ShoppingCart, Package, User, LogOut, Menu } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';
import { useCartStore } from '../../store/cart.store';
import { api } from '../../lib/api-client';
import { ThemeToggle } from '../shared/ThemeToggle';
import { useAppSettings } from '../../hooks/use-api';
import { NotificationBell } from '../shared/NotificationBell';

const NAV_ITEMS = [
  { href: '/catalog', icon: ShoppingBag, label: 'Catalog' },
  { href: '/orders', icon: Package, label: 'My Orders' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function CustomerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear } = useAuthStore();
  const { items } = useCartStore();
  const { data: appSettings } = useAppSettings();

  async function handleLogout() {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clear();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/catalog" className="text-xl font-bold text-primary">
            {appSettings?.companyName || 'Nath Sales'}
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  pathname.startsWith(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell />
            {/* Cart */}
            <Link href="/cart" className="relative rounded-lg p-2 hover:bg-accent">
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                  {items.length}
                </span>
              )}
            </Link>

            {/* User menu */}
            <div className="flex items-center gap-2">
              <div className="hidden md:block text-right">
                <p className="text-xs font-medium">{user?.businessName || user?.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t bg-card">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center py-2 text-xs',
              pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <item.icon className="mb-1 h-5 w-5" />
            {item.label}
          </Link>
        ))}
        <Link
          href="/cart"
          className={cn(
            'flex flex-1 flex-col items-center justify-center py-2 text-xs relative',
            pathname === '/cart' ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <ShoppingCart className="mb-1 h-5 w-5" />
          Cart
          {items.length > 0 && (
            <span className="absolute right-4 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {items.length}
            </span>
          )}
        </Link>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-6 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  );
}

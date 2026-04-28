'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, ShoppingCart, Package, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';
import { useCartStore } from '../../store/cart.store';
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
  const { user } = useAuthStore();
  const { items } = useCartStore();
  const { data: appSettings } = useAppSettings();

  return (
    <div className="safe-x min-h-screen bg-background">
      <header className="safe-top sticky top-0 z-40 border-b bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link href="/catalog" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            {appSettings?.companyLogoUrl ? (
              <img src={appSettings.companyLogoUrl} alt="Company logo" className="h-8 w-8 object-contain sm:h-9 sm:w-9" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground sm:h-9 sm:w-9">
                {appSettings?.companyName?.charAt(0)?.toUpperCase() || 'N'}
              </div>
            )}
            <span className="max-w-[130px] truncate text-sm font-bold text-primary sm:max-w-[220px] sm:text-base lg:text-lg">{appSettings?.companyName || 'Nath Sales'}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all', pathname.startsWith(item.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent')}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <NotificationBell />
            <Link href="/cart" className="relative rounded-lg p-2 hover:bg-accent">
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
                  {items.length}
                </span>
              )}
            </Link>
            <div className="hidden text-right md:block">
              <p className="max-w-[180px] truncate text-xs font-medium">{user?.businessName || user?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 flex border-t bg-card md:hidden">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={cn('flex flex-1 flex-col items-center justify-center py-2 text-xs', pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground')}>
            <item.icon className="mb-1 h-5 w-5" />
            {item.label}
          </Link>
        ))}
        <Link href="/cart" className={cn('relative flex flex-1 flex-col items-center justify-center py-2 text-xs', pathname === '/cart' ? 'text-primary' : 'text-muted-foreground')}>
          <ShoppingCart className="mb-1 h-5 w-5" />
          Cart
          {items.length > 0 && (
            <span className="absolute right-4 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
              {items.length}
            </span>
          )}
        </Link>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-4 pb-24 sm:px-6 sm:py-6 md:pb-6">{children}</main>
    </div>
  );
}

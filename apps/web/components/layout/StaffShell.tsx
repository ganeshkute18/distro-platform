'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, PackageCheck, LogOut, Menu, X, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';
import { api } from '../../lib/api-client';
import { ThemeToggle } from '../shared/ThemeToggle';
import { useAppSettings } from '../../hooks/use-api';
import { NotificationBell } from '../shared/NotificationBell';

const NAV_ITEMS = [
  { href: '/staff/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/staff/inventory', icon: PackageCheck, label: 'Inventory' },
  { href: '/staff/profile', icon: User, label: 'Profile' },
];

export default function StaffShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear } = useAuthStore();
  const { data: appSettings } = useAppSettings();

  async function handleLogout() {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clear();
    router.push('/login');
  }

  return (
    <div className="safe-x flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-56 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          {appSettings?.companyLogoUrl ? (
            <img src={appSettings.companyLogoUrl} alt="Company logo" className="h-9 w-9 object-contain" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              {appSettings?.companyName?.charAt(0)?.toUpperCase() || 'N'}
            </div>
          )}
          <div className="min-w-0">
            <span className="block truncate text-sm font-bold text-primary">{appSettings?.companyName || 'Nath Sales'}</span>
            <span className="rounded bg-secondary px-1 py-0 text-xs font-medium">Staff</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all', pathname.startsWith(item.href) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent')}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="mb-1 flex items-center gap-3 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{user?.name?.charAt(0)?.toUpperCase()}</div>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">Staff</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-destructive">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="safe-top safe-bottom absolute left-0 top-0 h-full w-72 border-r bg-card shadow-xl">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <span className="font-semibold">Staff Menu</span>
              <button onClick={() => setMobileOpen(false)} className="rounded-md p-1 hover:bg-accent"><X className="h-5 w-5" /></button>
            </div>
            <nav className="space-y-1 p-3">
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium', pathname.startsWith(item.href) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent')}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="safe-top flex h-14 items-center border-b bg-card px-4 sm:h-16 sm:px-6">
          <button className="mr-4 rounded-md p-1 hover:bg-accent md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold">Staff Portal</span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-4 pb-24 sm:px-6 sm:py-6 md:pb-6">{children}</div>
        </main>
        <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 flex border-t bg-card md:hidden">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={cn('flex h-14 flex-1 flex-col items-center justify-center text-[11px]', pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground')}>
              <item.icon className="mb-0.5 h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-lg font-bold text-primary">{appSettings?.companyName || 'Nath Sales'}</span>
          <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-xs font-medium">Staff</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                pathname.startsWith(item.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">Staff</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center border-b bg-card px-6">
          <button className="md:hidden mr-4" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold">Staff Portal</span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-6 pb-24 md:pb-6">{children}</div>
        </main>
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-card md:hidden">
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

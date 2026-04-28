'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, PackageCheck, Package,
  Building2, Tag, Users, BarChart3, LogOut,
  ChevronLeft, ChevronRight, Menu, X, ClipboardList, Settings, User, Ellipsis,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';
import { api } from '../../lib/api-client';
import { ThemeToggle } from '../shared/ThemeToggle';
import { useAppSettings } from '../../hooks/use-api';
import { NotificationBell } from '../shared/NotificationBell';

const NAV_ITEMS = [
  { href: '/owner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/owner/orders', icon: ShoppingCart, label: 'All Orders' },
  { href: '/owner/products', icon: Package, label: 'Products' },
  { href: '/owner/users', icon: Users, label: 'Users' },
  { href: '/owner/approvals', icon: ClipboardList, label: 'Approvals' },
  { href: '/owner/agencies', icon: Building2, label: 'Agencies' },
  { href: '/owner/categories', icon: Tag, label: 'Categories' },
  { href: '/owner/inventory', icon: PackageCheck, label: 'Inventory' },
  { href: '/owner/reports', icon: BarChart3, label: 'Reports' },
  { href: '/owner/profile', icon: User, label: 'Profile' },
  { href: '/owner/settings', icon: Settings, label: 'Settings' },
];

const PRIMARY_MOBILE_ITEMS = NAV_ITEMS.slice(0, 4);
const SECONDARY_MOBILE_ITEMS = NAV_ITEMS.slice(4);

export default function OwnerShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear } = useAuthStore();
  const { data: appSettings } = useAppSettings();

  async function handleLogout() {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clear();
    router.push('/login');
  }

  const activeMainNav = useMemo(
    () => PRIMARY_MOBILE_ITEMS.find((item) => pathname.startsWith(item.href))?.href,
    [pathname],
  );

  const NavLink = ({ item }: { item: typeof NAV_ITEMS[0] }) => {
    const active = pathname.startsWith(item.href);
    return (
      <Link
        href={item.href}
        onClick={() => {
          setMobileOpen(false);
          setMoreOpen(false);
        }}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
          active
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={cn(
        'flex h-full flex-col border-r bg-card transition-all duration-200',
        mobile ? 'w-72' : collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-3">
        {(!collapsed || mobile) && (
          <div className="flex min-w-0 items-center gap-2">
            {appSettings?.companyLogoUrl ? (
              <img src={appSettings.companyLogoUrl} alt="Company logo" className="h-9 w-9 object-contain sm:h-10 sm:w-10" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground sm:h-10 sm:w-10">
                {appSettings?.companyName?.charAt(0)?.toUpperCase() || 'N'}
              </div>
            )}
            <span className="truncate text-sm font-bold text-primary">{appSettings?.companyName || 'Nath Sales'}</span>
          </div>
        )}
        {!mobile && (
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto rounded-md p-1 hover:bg-accent">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => <NavLink key={item.href} item={item} />)}
      </nav>

      <div className="border-t p-3">
        <div className={cn('flex items-center gap-3 rounded-lg px-3 py-2', (!collapsed || mobile) && 'mb-1')}>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          {(!collapsed || mobile) && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">Owner</p>
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-destructive">
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {(!collapsed || mobile) && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="safe-x flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex"><Sidebar /></div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative flex h-full w-72 flex-col bg-card shadow-xl">
            <button className="absolute right-3 top-3 rounded-md p-1 hover:bg-accent" onClick={() => setMobileOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div className="safe-bottom relative w-full rounded-t-2xl border bg-card p-4">
            <div className="mb-3 h-1.5 w-12 rounded-full bg-muted mx-auto" />
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">More</p>
            <div className="grid grid-cols-2 gap-2">
              {SECONDARY_MOBILE_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 text-sm', pathname.startsWith(item.href) ? 'border-primary bg-primary/5 text-primary' : 'text-muted-foreground')}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="safe-top flex h-14 items-center justify-between border-b bg-card px-4 sm:h-16 sm:px-6">
          <button className="md:hidden rounded-md p-1 hover:bg-accent" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-4 pb-28 sm:px-6 sm:py-6 md:pb-6">{children}</div>
        </main>

        <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 flex border-t bg-card md:hidden">
          {PRIMARY_MOBILE_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={cn('flex h-14 flex-1 flex-col items-center justify-center text-[11px]', activeMainNav === item.href ? 'text-primary' : 'text-muted-foreground')}>
              <item.icon className="mb-0.5 h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <button onClick={() => setMoreOpen(true)} className="flex h-14 flex-1 flex-col items-center justify-center text-[11px] text-muted-foreground">
            <Ellipsis className="mb-0.5 h-4 w-4" />
            More
          </button>
        </nav>
      </div>
    </div>
  );
}

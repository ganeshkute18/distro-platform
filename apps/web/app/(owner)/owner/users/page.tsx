'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Shield, UserCheck, Store, UserX, RotateCcw, MoreHorizontal, Phone, Mail, ShoppingBag, X } from 'lucide-react';
import { useOrders, useUsers } from '../../../../hooks/use-api';
import { PageHeader, PageLoader, EmptyState, Pagination, StatusBadge } from '../../../../components/shared';
import { formatCurrency, formatDate, type Order, type User, type Role, type OrderStatus } from '../../../../types';
import OwnerShell from '../../../../components/layout/OwnerShell';
import { api } from '../../../../lib/api-client';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../../lib/utils';

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  OWNER: <Shield className="h-4 w-4 text-purple-500" />,
  STAFF: <UserCheck className="h-4 w-4 text-blue-500" />,
  CUSTOMER: <Store className="h-4 w-4 text-green-500" />,
};

const ROLE_COLORS: Record<Role, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  STAFF: 'bg-blue-100 text-blue-700',
  CUSTOMER: 'bg-green-100 text-green-700',
};

export default function OwnerUsersPage() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<Role | ''>('');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const qc = useQueryClient();
  const { data, isLoading } = useUsers({ page, limit: 20, role: role || undefined, includeInactive: showInactive });

  const { data: customerOrdersData, isLoading: isOrdersLoading } = useOrders({
    customerId: selectedCustomer?.id,
    limit: 100,
  });

  const filtered = data?.data?.filter((u: User) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesActive = showInactive ? true : u.isActive;
    return matchesSearch && matchesActive;
  }) ?? [];

  const customerOrders = useMemo(
    () => (selectedCustomer?.role === 'CUSTOMER' ? ((customerOrdersData?.data as Order[]) ?? []) : []),
    [customerOrdersData?.data, selectedCustomer?.role],
  );

  const statusCounts = useMemo(() => {
    return customerOrders.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] ?? 0) + 1;
      return acc;
    }, {});
  }, [customerOrders]);

  const lastOrderDate = customerOrders[0]?.createdAt;
  const totalSpend = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  async function deactivateUser(user: User) {
    if (!confirm(`Deactivate ${user.name}? They will no longer be able to log in.`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      toast.success('User deactivated');
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  }

  async function reactivateUser(user: User) {
    try {
      await api.post(`/users/${user.id}/reactivate`);
      toast.success('User reactivated');
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  }

  return (
    <OwnerShell>
      <PageHeader
        title="Users"
        description="Manage staff and customer accounts"
        action={
          <Link
            href="/owner/users/new"
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 max-sm:w-full"
          >
            <Plus className="h-4 w-4" /> Add User
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="search" placeholder="Search name or email…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-lg border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex gap-1 rounded-lg border bg-muted p-1">
          {(['', 'STAFF', 'CUSTOMER'] as const).map((r) => (
            <button key={r} onClick={() => { setRole(r); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${role === r ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {r === '' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowInactive((s) => !s)}
          className={`h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${showInactive ? 'bg-card' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
        >
          {showInactive ? 'Showing inactive' : 'Hide inactive'}
        </button>
      </div>

      {isLoading ? <PageLoader /> : !filtered.length ? (
        <EmptyState title="No users found" />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <div className="touch-scroll overflow-x-auto">
              <table className="min-w-[920px] w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Business</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Joined</th>
                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((user: User) => (
                    <tr key={user.id} className="bg-card transition-colors hover:bg-muted/30">
                      <td className="sticky left-0 z-10 bg-card px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium whitespace-nowrap">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
                          {ROLE_ICONS[user.role]}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.businessName ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted"
                            onClick={() => setActionMenu((v) => (v === user.id ? null : user.id))}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {actionMenu === user.id && (
                            <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border bg-card p-1 shadow-lg">
                              <Link href={`/owner/users/${user.id}/edit`} className="block rounded-md px-3 py-2 text-left text-xs hover:bg-muted">Edit</Link>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenu(null);
                                  if (user.role === 'CUSTOMER') setSelectedCustomer(user);
                                }}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-muted"
                              >
                                <ShoppingBag className="h-3.5 w-3.5" />
                                View Orders
                              </button>
                              <a href={`mailto:${user.email}`} className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-muted">
                                <Mail className="h-3.5 w-3.5" />
                                Contact
                              </a>
                              {user.isActive ? (
                                <button type="button" onClick={() => deactivateUser(user)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-destructive hover:bg-muted">
                                  <UserX className="h-3.5 w-3.5" /> Remove
                                </button>
                              ) : (
                                <button type="button" onClick={() => reactivateUser(user)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-muted">
                                  <RotateCcw className="h-3.5 w-3.5" /> Restore
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground sm:hidden">Swipe left/right to view all user columns and actions.</p>
          <Pagination page={page} totalPages={data?.meta.totalPages ?? 1} onPageChange={setPage} />
        </>
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setSelectedCustomer(null)}>
          <div className="max-h-[90vh] w-full overflow-hidden rounded-t-2xl border bg-card shadow-xl sm:max-w-3xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b p-4 sm:p-5">
              <div>
                <h3 className="text-lg font-semibold">{selectedCustomer.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
              </div>
              <button className="rounded-md p-2 hover:bg-muted" onClick={() => setSelectedCustomer(null)}><X className="h-4 w-4" /></button>
            </div>

            <div className="touch-scroll max-h-[calc(90vh-72px)] space-y-4 overflow-y-auto p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricTile label="Total Orders" value={customerOrders.length} />
                <MetricTile label="Total Spend" value={formatCurrency(totalSpend)} />
                <MetricTile label="Last Order" value={formatDate(lastOrderDate)} />
                <MetricTile label="Phone" value={selectedCustomer.phone || '—'} />
              </div>

              <div className="rounded-xl border p-3">
                <p className="mb-2 text-sm font-semibold">Status Summary</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(statusCounts) as OrderStatus[]).length ? (Object.keys(statusCounts) as OrderStatus[]).map((status) => (
                    <span key={status} className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs">
                      <StatusBadge status={status} /> {statusCounts[status]}
                    </span>
                  )) : <p className="text-xs text-muted-foreground">No orders yet.</p>}
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <p className="mb-3 text-sm font-semibold">Ordered Products History</p>
                {isOrdersLoading ? <PageLoader /> : !customerOrders.length ? (
                  <p className="text-sm text-muted-foreground">No order history available.</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="rounded-lg border p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{order.orderNumber}</p>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="mb-2 text-xs text-muted-foreground">{formatDate(order.createdAt)} • {formatCurrency(order.totalAmount)}</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {order.items.slice(0, 4).map((item) => (
                            <p key={item.id}>{item.product.name} × {item.quantity}</p>
                          ))}
                          {order.items.length > 4 ? <p>+{order.items.length - 4} more items</p> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </OwnerShell>
  );
}

function MetricTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-sm font-semibold leading-tight break-words', typeof value === 'string' && value.length > 20 ? 'text-xs' : 'text-base')}>
        {value}
      </p>
    </div>
  );
}

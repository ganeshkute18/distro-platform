'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Shield, UserCheck, Store } from 'lucide-react';
import { useUsers } from '../../../../hooks/use-api';
import { PageHeader, PageLoader, EmptyState, Pagination } from '../../../../components/shared';
import { formatDate, type User, type Role } from '../../../../types';
import OwnerShell from '../../../../components/layout/OwnerShell';

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
  const { data, isLoading } = useUsers({ page, limit: 20, role: role || undefined });

  const filtered = data?.data?.filter((u: User) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <OwnerShell>
      <PageHeader
        title="Users"
        description="Manage staff and customer accounts"
        action={
          <Link href="/owner/users/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Add User
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="search" placeholder="Search name or email…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex gap-1 rounded-lg border bg-muted p-1">
          {(['', 'STAFF', 'CUSTOMER'] as const).map((r) => (
            <button key={r} onClick={() => { setRole(r); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${role === r ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {r === '' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <PageLoader /> : !filtered.length ? (
        <EmptyState title="No users found" />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Business</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Joined</th>
                  <th className="px-4 py-3 text-center font-medium">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((user: User) => (
                  <tr key={user.id} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
                        {ROLE_ICONS[user.role]}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{user.businessName ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/owner/users/${user.id}/edit`}
                        className="rounded-md px-3 py-1.5 text-xs font-medium border hover:bg-muted transition-colors">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={data?.meta.totalPages ?? 1} onPageChange={setPage} />
        </>
      )}
    </OwnerShell>
  );
}

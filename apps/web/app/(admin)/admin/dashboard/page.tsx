'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../../lib/api-client';
import { useAuthStore } from '../../../../store/auth.store';
import type { PaginatedResponse } from '../../../../types';

interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  isActive?: boolean;
  createdAt?: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [tenantCount, setTenantCount] = useState<number | null>(null);
  const [lastTenant, setLastTenant] = useState<TenantSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenants() {
      try {
        const response = await api.get<PaginatedResponse<TenantSummary>>('/tenants');
        const tenantsList = Array.isArray(response?.data) ? response.data : [];
        setTenantCount(tenantsList.length);
        if (tenantsList.length > 0) {
          setLastTenant(tenantsList[0]);
        }
      } catch (err) {
        setError('Unable to load tenant summary.');
      }
    }

    loadTenants();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Platform Admin Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">Welcome back, {user?.name || 'Admin'}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Manage platform tenants, monitor onboarding, and review access across the distribution network.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-dashed border-border bg-background p-5">
            <p className="text-sm text-muted-foreground">Tenants onboarded</p>
            <p className="mt-4 text-4xl font-semibold text-foreground">{tenantCount ?? '—'}</p>
          </article>
          <article className="rounded-3xl border border-dashed border-border bg-background p-5">
            <p className="text-sm text-muted-foreground">Primary admin</p>
            <p className="mt-4 text-2xl font-semibold text-foreground">{user?.email || 'unknown'}</p>
          </article>
          <article className="rounded-3xl border border-dashed border-border bg-background p-5">
            <p className="text-sm text-muted-foreground">Last tenant</p>
            <p className="mt-4 text-base font-semibold text-foreground">
              {lastTenant ? `${lastTenant.name} (${lastTenant.slug})` : 'No tenant data'}
            </p>
          </article>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Quick actions</h2>
          <div className="mt-5 space-y-4 text-sm text-muted-foreground">
            <p>
              • Use the tenant manager to onboard new tenants and review active accounts.
            </p>
            <p>• Monitor platform usage and verify access for OWNER / STAFF / CUSTOMER roles.</p>
            <p>• If tenant detail is missing, complete onboarding through the platform API.</p>
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Status</h2>
          {error ? (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>• API status is healthy if tenant count is visible.</p>
              <p>• Platform admin sessions are based on the stored session cookie.</p>
              <p>• If the API returns an error, verify that NEXT_PUBLIC_API_URL is set correctly.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

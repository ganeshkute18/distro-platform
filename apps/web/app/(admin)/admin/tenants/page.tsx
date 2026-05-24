'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../../lib/api-client';

interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  isActive?: boolean;
  createdAt?: string;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenants() {
      try {
        const response = await api.get<TenantSummary[]>('/tenants');
        setTenants(response);
      } catch (err) {
        setError('Failed to load tenants.');
      }
    }

    loadTenants();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Tenant management</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">Tenants</h1>
          </div>
          <div className="rounded-2xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            {tenants.length} tenant{tenants.length === 1 ? '' : 's'} loaded
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">{error}</div>
      ) : (
        <div className="grid gap-4">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="rounded-3xl border bg-background p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{tenant.slug}</p>
                  <h2 className="text-xl font-semibold text-foreground">{tenant.name}</h2>
                </div>
                <span className={tenant.isActive ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700' : 'rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700'}>
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Created {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'unknown'}.
              </p>
            </div>
          ))}
          {tenants.length === 0 && !error && (
            <div className="rounded-3xl border bg-background p-6 text-sm text-muted-foreground">No tenants found.</div>
          )}
        </div>
      )}
    </div>
  );
}

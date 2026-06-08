'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../../../../lib/api-client';
import { PageHeader } from '../../../../components/shared';
import type { PaginatedResponse } from '../../../../types';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  useEffect(() => {
    async function loadTenants() {
      try {
        const response = await api.get<PaginatedResponse<TenantSummary>>('/tenants');
        const tenantsList = Array.isArray(response?.data) ? response.data : [];
        setTenants(tenantsList);
      } catch (err) {
        setError('Failed to load tenants.');
      }
    }

    loadTenants();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Manage buyer organizations and view tenant status."
        action={
          <Link href="/admin/tenants/new" className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
            Add tenant
          </Link>
        }
      />

      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Tenant management</p>
            <h2 className="mt-2 text-3xl font-bold text-foreground">Tenant list</h2>
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
                  <h3 className="text-xl font-semibold text-foreground">{tenant.name}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className={tenant.isActive ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700' : 'rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700'}>
                    {tenant.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex gap-2">
                    <a href={`/admin/tenants/${tenant.id}/edit`} className="rounded-md border px-3 py-1 text-sm hover:bg-muted">Edit</a>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete tenant "${tenant.name}"? This cannot be undone.`)) return;
                        try {
                          await api.delete(`/tenants/${tenant.id}`);
                          setTenants((prev) => prev.filter((t) => t.id !== tenant.id));
                        } catch (e) {
                          alert('Failed to delete tenant. Ensure no associated products or orders exist.');
                        }
                      }}
                      className="rounded-md border border-destructive px-3 py-1 text-sm text-destructive hover:bg-destructive/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Created {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'unknown'}.
              </p>
            </div>
          ))}
          {tenants.length === 0 && !error && (
            <div className="rounded-3xl border bg-background p-6 text-sm text-muted-foreground">No tenants found. Use the Add tenant button above to create the first tenant.</div>
          )}
        </div>
      )}
    </div>
  );
}

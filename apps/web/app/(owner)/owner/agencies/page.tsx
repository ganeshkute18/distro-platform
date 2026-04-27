'use client';
import React from 'react';
import Link from 'next/link';
import { Plus, Building2, Edit2 } from 'lucide-react';
import { useAgencies } from '../../../../hooks/use-api';
import { PageHeader, PageLoader, EmptyState } from '../../../../components/shared';
import OwnerShell from '../../../../components/layout/OwnerShell';
import type { Agency } from '../../../../types';

export default function AgenciesPage() {
  const { data, isLoading } = useAgencies();
  const agencies = (data as { data?: Agency[] })?.data ?? [];
  return (
    <OwnerShell>
      <PageHeader title="Agencies / Brands" description="Manage your supplier agencies"
        action={<Link href="/owner/agencies/new" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4" />Add Agency</Link>} />
      {isLoading ? <PageLoader /> : !agencies.length ? <EmptyState title="No agencies yet" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agencies.map((agency) => (
            <div key={agency.id} className="rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-primary/10">
                  {agency.logoUrl ? (
                    <img src={agency.logoUrl} alt={agency.name} className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <Link href={`/owner/agencies/${agency.id}/edit`} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><Edit2 className="h-4 w-4" /></Link>
              </div>
              <h3 className="font-semibold">{agency.name}</h3>
              {agency.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{agency.description}</p>}
              {agency.contactName && <p className="mt-2 text-xs text-muted-foreground">Contact: {agency.contactName}</p>}
              <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${agency.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {agency.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      )}
    </OwnerShell>
  );
}

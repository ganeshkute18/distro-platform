'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../../../../lib/api-client';
import { PageHeader } from '../../../../../../../components/shared';

export default function AdminTenantEditPage() {
  const params = useParams() as { tenantId: string };
  const tenantId = params?.tenantId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [plan, setPlan] = useState<'STARTER'|'PROFESSIONAL'|'ENTERPRISE'>('STARTER');

  useEffect(() => {
    if (!tenantId) return;
    let mounted = true;
    async function load() {
      try {
        const data = await api.get<any>(`/tenants/${tenantId}`);
        if (!mounted) return;
        setName(data.name || '');
        setSlug(data.slug || '');
        setDomain(data.domain || '');
        setContactEmail(data.contactEmail || '');
        setContactPhone(data.contactPhone || '');
        setIsActive(Boolean(data.isActive));
        if (data.plan) setPlan(data.plan);
      } catch (e) {
        setError('Failed to load tenant.');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.patch(`/tenants/${tenantId}`, { name, slug, domain, contactEmail, contactPhone, isActive, plan });
      router.push('/admin/tenants');
    } catch (err) {
      setError('Failed to update tenant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit tenant"
        description="Update tenant details and settings."
        action={<Link href="/admin/tenants" className="inline-flex items-center justify-center rounded-full border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">Back to tenants</Link>}
      />

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm">
        {error && <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-border bg-background p-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Tenant name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Wholesale" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Slug *</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme-wholesale" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <p className="mt-1 text-xs text-muted-foreground">A short, URL-safe identifier for the tenant.</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Domain</label>
              <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="acme.example.com" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Contact email</label>
                <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" placeholder="owner@example.com" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Contact phone</label>
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-border bg-background p-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Plan</label>
              <select value={plan} onChange={(e) => setPlan(e.target.value as any)} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
                <option value="STARTER">STARTER</option>
                <option value="PROFESSIONAL">PROFESSIONAL</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <input id="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-input text-primary focus:ring-primary" />
              <label htmlFor="isActive" className="text-sm font-medium text-foreground">Activate tenant</label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={isSubmitting} className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save changes'}</button>
          <Link href="/admin/tenants" className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-input bg-background px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

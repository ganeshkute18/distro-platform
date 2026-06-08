'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../../../../lib/api-client';
import { PageHeader } from '../../../../../../components/shared';

type TenantPlan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

interface CreateTenantDto {
  name: string;
  slug: string;
  isActive: boolean;
  domain?: string;
  contactEmail?: string;
  contactPhone?: string;
  gstNumber?: string;
  panNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  plan?: TenantPlan;
}

interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

const PLAN_OPTIONS: TenantPlan[] = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

export default function AdminTenantCreatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [domain, setDomain] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [plan, setPlan] = useState<TenantPlan>('STARTER');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateSlug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError('Name and slug are required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const payload: CreateTenantDto = {
      name: name.trim(),
      slug: slug.trim(),
      isActive,
      domain: domain.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      gstNumber: gstNumber.trim() || undefined,
      panNumber: panNumber.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      pincode: pincode.trim() || undefined,
      plan,
    };

    try {
      await api.post<TenantSummary>('/tenants', payload);
      router.push('/admin/tenants');
    } catch (error) {
      setError('Unable to create tenant. Please verify the details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create tenant"
        description="Create a new tenant account and buyer organization for the platform."
        action={
          <Link href="/admin/tenants" className="inline-flex items-center justify-center rounded-full border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">
            Back to tenants
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm">
        {error && <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-border bg-background p-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Tenant name *</label>
              <input
                value={name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="Acme Wholesale"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Slug *</label>
              <input
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value);
                }}
                placeholder="acme-wholesale"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">A short, URL-safe identifier for the tenant.</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Domain</label>
              <input
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="acme.example.com"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Contact email</label>
                <input
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  type="email"
                  placeholder="owner@example.com"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Contact phone</label>
                <input
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-border bg-background p-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Plan</label>
              <select
                value={plan}
                onChange={(event) => setPlan(event.target.value as TenantPlan)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                {PLAN_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <input
                id="isActive"
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-foreground">
                Activate tenant immediately
              </label>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">GST number</label>
              <input
                value={gstNumber}
                onChange={(event) => setGstNumber(event.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">PAN number</label>
              <input
                value={panNumber}
                onChange={(event) => setPanNumber(event.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">Billing and location</p>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Address</label>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">City</label>
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">State</label>
              <input
                value={state}
                onChange={(event) => setState(event.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Pincode</label>
              <input
                value={pincode}
                onChange={(event) => setPincode(event.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">You can fill additional address fields later from the tenant settings page.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create tenant'}
          </button>
          <Link href="/admin/tenants" className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-input bg-background px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

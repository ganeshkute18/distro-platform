'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../../../lib/api-client';
import { PageHeader } from '../../../../../components/shared';

type TenantPlan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

interface OnboardTenantDto {
  name: string;
  slug: string;
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
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
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
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
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
    if (!name.trim() || !slug.trim() || !ownerName.trim() || !ownerEmail.trim() || ownerPassword.length < 8) {
      setError('Tenant name, slug, owner name, owner email, and an 8+ character password are required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const payload: OnboardTenantDto = {
      name: name.trim(),
      slug: slug.trim(),
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
      ownerName: ownerName.trim(),
      ownerEmail: ownerEmail.trim(),
      ownerPassword,
    };

    try {
      const result = await api.post<{ tenant: TenantSummary }>('/tenants/onboard', payload);
      router.push(`/admin/tenants/${result.tenant.id}/edit`);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Unable to onboard tenant. Please verify the details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboard tenant"
        description="Create the tenant and its initial owner account in one step."
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

        <div className="space-y-4 rounded-3xl border border-border bg-card p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Initial owner account</p>
            <p className="mt-1 text-xs text-muted-foreground">This user can sign in immediately and manage staff and customers for the tenant.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Full name *</label>
              <input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Email *</label>
              <input value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} type="email" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Password *</label>
              <input value={ownerPassword} onChange={(event) => setOwnerPassword(event.target.value)} type="password" minLength={8} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Onboarding...' : 'Onboard tenant'}
          </button>
          <Link href="/admin/tenants" className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-input bg-background px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

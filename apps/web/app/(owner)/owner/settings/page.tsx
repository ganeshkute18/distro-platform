'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import OwnerShell from '../../../../components/layout/OwnerShell';
import { Card, PageHeader } from '../../../../components/shared';
import { useAppSettings, useUpdateAppSettings } from '../../../../hooks/use-api';

type FormData = {
  companyName: string;
  companyLogoUrl?: string;
  paymentQrUrl?: string;
  upiId?: string;
  bankDetails?: string;
};

export default function OwnerSettingsPage() {
  const { data } = useAppSettings();
  const update = useUpdateAppSettings();
  const { register, handleSubmit } = useForm<FormData>({
    values: {
      companyName: data?.companyName || 'Nath Sales',
      companyLogoUrl: data?.companyLogoUrl || '',
      paymentQrUrl: data?.paymentQrUrl || '',
      upiId: data?.upiId || '',
      bankDetails: data?.bankDetails || '',
    },
  });

  async function onSubmit(payload: FormData) {
    await update.mutateAsync(payload);
  }

  return (
    <OwnerShell>
      <PageHeader title="Settings" description="Manage brand identity and payment setup" />
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h3 className="font-semibold">Branding</h3>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Company Name</label>
            <input
              {...register('companyName')}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Company Logo URL</label>
            <input
              {...register('companyLogoUrl')}
              placeholder="https://...logo.png"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="font-semibold">Payment</h3>
          <div>
            <label className="mb-1.5 block text-sm font-medium">QR Code Image URL</label>
            <input
              {...register('paymentQrUrl')}
              placeholder="https://...qr.png"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">UPI ID</label>
            <input
              {...register('upiId')}
              placeholder="name@bank"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Bank Details</label>
            <textarea
              {...register('bankDetails')}
              rows={3}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </Card>

        <button
          type="submit"
          disabled={update.isPending}
          className="lg:col-span-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Settings
        </button>
      </form>
    </OwnerShell>
  );
}


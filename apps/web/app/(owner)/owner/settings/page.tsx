'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import OwnerShell from '../../../../components/layout/OwnerShell';
import { Card, PageHeader } from '../../../../components/shared';
import { useAppSettings, useUpdateAppSettings } from '../../../../hooks/use-api';
import { compressImageToBase64 } from '../../../../lib/image-utils';
import toast from 'react-hot-toast';

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
  const [logoPreview, setLogoPreview] = React.useState<string>('');
  const [qrPreview, setQrPreview] = React.useState<string>('');
  const [imageProcessing, setImageProcessing] = React.useState(false);
  const { register, handleSubmit, setValue } = useForm<FormData>({
    values: {
      companyName: data?.companyName || 'Nath Sales',
      companyLogoUrl: data?.companyLogoUrl || '',
      paymentQrUrl: data?.paymentQrUrl || '',
      upiId: data?.upiId || '',
      bankDetails: data?.bankDetails || '',
    },
  });

  React.useEffect(() => {
    setLogoPreview(data?.companyLogoUrl || '');
    setQrPreview(data?.paymentQrUrl || '');
  }, [data?.companyLogoUrl, data?.paymentQrUrl]);

  async function onFileChange(field: 'companyLogoUrl' | 'paymentQrUrl', file?: File) {
    if (!file) return;
    try {
      setImageProcessing(true);
      const compressed = await compressImageToBase64(file, 200);
      setValue(field, compressed, { shouldDirty: true });
      if (field === 'companyLogoUrl') setLogoPreview(compressed);
      else setQrPreview(compressed);
      toast.success('Image compressed and attached');
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Failed to process image');
    } finally {
      setImageProcessing(false);
    }
  }

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
            <label className="mb-1.5 block text-sm font-medium">Company Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFileChange('companyLogoUrl', e.target.files?.[0])}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <input type="hidden" {...register('companyLogoUrl')} />
            {logoPreview ? (
              <img src={logoPreview} alt="Company logo preview" className="mt-2 h-20 w-20 rounded-lg border object-cover" />
            ) : null}
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="font-semibold">Payment</h3>
          <div>
            <label className="mb-1.5 block text-sm font-medium">QR Code Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFileChange('paymentQrUrl', e.target.files?.[0])}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <input type="hidden" {...register('paymentQrUrl')} />
            {qrPreview ? (
              <img src={qrPreview} alt="QR preview" className="mt-2 h-28 w-28 rounded-lg border object-contain bg-white p-1" />
            ) : null}
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
          {(update.isPending || imageProcessing) && <Loader2 className="h-4 w-4 animate-spin" />}
          {imageProcessing ? 'Processing image…' : 'Save Settings'}
        </button>
      </form>
    </OwnerShell>
  );
}


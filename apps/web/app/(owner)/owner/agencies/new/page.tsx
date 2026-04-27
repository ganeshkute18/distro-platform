'use client';
import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../../../../../lib/api-client';
import { Card, PageHeader } from '../../../../../components/shared';
import OwnerShell from '../../../../../components/layout/OwnerShell';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { compressImageToBase64 } from '../../../../../lib/image-utils';

export default function NewAgencyPage() {
  const params = useParams<{ agencyId?: string }>();
  const agencyId = params?.agencyId;
  const isEdit = Boolean(agencyId && agencyId !== 'new');
  const router = useRouter();
  const qc = useQueryClient();
  const [imageProcessing, setImageProcessing] = React.useState(false);
  const [logoPreview, setLogoPreview] = React.useState('');
  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<Record<string, string>>();

  const { data: existingAgency } = useQuery({
    queryKey: ['agency', agencyId],
    queryFn: () => api.get(`/agencies/${agencyId}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existingAgency) return;
    reset({
      name: (existingAgency as any).name ?? '',
      description: (existingAgency as any).description ?? '',
      logoUrl: (existingAgency as any).logoUrl ?? '',
      contactName: (existingAgency as any).contactName ?? '',
      contactEmail: (existingAgency as any).contactEmail ?? '',
      contactPhone: (existingAgency as any).contactPhone ?? '',
    });
    setLogoPreview((existingAgency as any).logoUrl ?? '');
  }, [existingAgency, reset]);

  async function onLogoSelect(file?: File) {
    if (!file) return;
    try {
      setImageProcessing(true);
      const compressed = await compressImageToBase64(file, 200);
      setValue('logoUrl', compressed, { shouldDirty: true });
      setLogoPreview(compressed);
      toast.success('Agency image ready to save');
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Failed to process image');
    } finally {
      setImageProcessing(false);
    }
  }

  async function onSubmit(data: Record<string, string>) {
    try {
      if (isEdit) {
        await api.patch(`/agencies/${agencyId}`, data);
        toast.success('Agency updated!');
      } else {
        await api.post('/agencies', data);
        toast.success('Agency created!');
      }
      qc.invalidateQueries({ queryKey: ['agencies'] });
      router.push('/owner/agencies');
    } catch { toast.error('Failed to create agency'); }
  }

  return (
    <OwnerShell>
      <Link href="/owner/agencies" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <PageHeader title={isEdit ? 'Edit Agency' : 'New Agency'} />
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg">
        <Card className="space-y-4">
          {(['name', 'description', 'contactName', 'contactEmail', 'contactPhone'] as const).map((field) => (
            <div key={field}>
              <label className="mb-1.5 block text-sm font-medium capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
              <input
                {...register(field)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Agency Image</label>
            <input type="file" accept="image/*" onChange={(e) => onLogoSelect(e.target.files?.[0])} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
            <input type="hidden" {...register('logoUrl')} />
            {logoPreview ? <img src={logoPreview} alt="Agency preview" className="mt-2 h-20 w-20 rounded-lg border object-cover" /> : null}
          </div>
          <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {(isSubmitting || imageProcessing) && <Loader2 className="h-4 w-4 animate-spin" />}{imageProcessing ? 'Processing image…' : isEdit ? 'Update Agency' : 'Create Agency'}
          </button>
        </Card>
      </form>
    </OwnerShell>
  );
}

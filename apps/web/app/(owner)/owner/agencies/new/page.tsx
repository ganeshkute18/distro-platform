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

export default function NewAgencyPage() {
  const params = useParams<{ agencyId?: string }>();
  const agencyId = params?.agencyId;
  const isEdit = Boolean(agencyId && agencyId !== 'new');
  const router = useRouter();
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Record<string, string>>();

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
  }, [existingAgency, reset]);

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
          {(['name', 'description', 'logoUrl', 'contactName', 'contactEmail', 'contactPhone'] as const).map((field) => (
            <div key={field}>
              <label className="mb-1.5 block text-sm font-medium capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
              <input
                {...register(field)}
                placeholder={field === 'logoUrl' ? 'https://...logo.png' : undefined}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
          <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}{isEdit ? 'Update Agency' : 'Create Agency'}
          </button>
        </Card>
      </form>
    </OwnerShell>
  );
}

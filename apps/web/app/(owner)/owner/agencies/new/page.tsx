'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../../../../../lib/api-client';
import { Card, PageHeader } from '../../../../../components/shared';
import OwnerShell from '../../../../../components/layout/OwnerShell';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function NewAgencyPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Record<string, string>>();

  async function onSubmit(data: Record<string, string>) {
    try {
      await api.post('/agencies', data);
      toast.success('Agency created!');
      qc.invalidateQueries({ queryKey: ['agencies'] });
      router.push('/owner/agencies');
    } catch { toast.error('Failed to create agency'); }
  }

  return (
    <OwnerShell>
      <Link href="/owner/agencies" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <PageHeader title="New Agency" />
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
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Create Agency
          </button>
        </Card>
      </form>
    </OwnerShell>
  );
}

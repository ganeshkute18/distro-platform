'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useMe } from '../../../../hooks/use-api';
import { api } from '../../../../lib/api-client';
import { PageHeader, Card, PageLoader } from '../../../../components/shared';
import OwnerShell from '../../../../components/layout/OwnerShell';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function OwnerProfilePage() {
  const { data: user, isLoading } = useMe();
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  async function onSubmit(data: Record<string, unknown>) {
    const cleaned = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== ''));
    try {
      await api.patch('/users/me', cleaned);
      qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update');
    }
  }

  if (isLoading) return <OwnerShell><PageLoader /></OwnerShell>;

  return (
    <OwnerShell>
      <PageHeader title="My Profile" />
      <div className="max-w-lg">
        <Card>
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary text-2xl font-bold">
              {(user as any)?.profileImageUrl ? (
                <img src={(user as any).profileImageUrl} alt={user?.name} className="h-full w-full object-cover" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase()
              )}
            </div>
            <div><p className="font-bold text-lg">{user?.name}</p><p className="text-sm text-muted-foreground">{user?.email}</p></div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[['name', 'Full Name', user?.name], ['businessName', 'Business Name', user?.businessName], ['phone', 'Phone', user?.phone], ['address', 'Address', user?.address], ['profileImageUrl', 'Profile Image URL', (user as any)?.profileImageUrl]].map(([f, l, d]) => (
              <div key={String(f)}><label className="mb-1.5 block text-sm font-medium">{l}</label><input {...register(String(f))} defaultValue={String(d ?? '')} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
            ))}
            <div><label className="mb-1.5 block text-sm font-medium">New Password</label><input {...register('password')} type="password" placeholder="Leave blank to keep current" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
            <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
            </button>
          </form>
        </Card>
      </div>
    </OwnerShell>
  );
}


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

export default function NewUserPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { role: 'CUSTOMER' } });

  async function onSubmit(data: Record<string, unknown>) {
    try { await api.post('/users', data); toast.success('User created!'); qc.invalidateQueries({ queryKey: ['users'] }); router.push('/owner/users'); }
    catch (e: unknown) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'); }
  }

  return (
    <OwnerShell>
      <Link href="/owner/users" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <PageHeader title="New User" />
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg">
        <Card className="space-y-4">
          <div><label className="mb-1.5 block text-sm font-medium">Full Name *</label><input {...register('name', { required: true })} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
          <div><label className="mb-1.5 block text-sm font-medium">Email *</label><input {...register('email', { required: true })} type="email" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
          <div><label className="mb-1.5 block text-sm font-medium">Password *</label><input {...register('password', { required: true })} type="password" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
          <div><label className="mb-1.5 block text-sm font-medium">Role</label>
            <select {...register('role')} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
              <option value="CUSTOMER">Customer</option><option value="STAFF">Staff</option>
            </select>
          </div>
          <div><label className="mb-1.5 block text-sm font-medium">Business Name</label><input {...register('businessName')} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
          <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Create User
          </button>
        </Card>
      </form>
    </OwnerShell>
  );
}

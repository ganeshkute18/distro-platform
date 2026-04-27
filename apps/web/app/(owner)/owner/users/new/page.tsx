'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../../../../../lib/api-client';
import { Card, PageHeader } from '../../../../../components/shared';
import OwnerShell from '../../../../../components/layout/OwnerShell';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

export default function NewUserPage() {
  const params = useParams<{ userId?: string }>();
  const userId = params?.userId;
  const isEdit = Boolean(userId && userId !== 'new');
  const router = useRouter();
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Record<string, unknown>>({ defaultValues: { role: 'CUSTOMER' } });

  const { data: existingUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.get(`/users/${userId}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existingUser) return;
    reset({
      name: (existingUser as any).name,
      email: (existingUser as any).email,
      role: (existingUser as any).role,
      businessName: (existingUser as any).businessName ?? '',
      phone: (existingUser as any).phone ?? '',
      address: (existingUser as any).address ?? '',
    });
  }, [existingUser, reset]);

  async function onSubmit(data: Record<string, unknown>) {
    try {
      if (isEdit) {
        const { email, password, ...rest } = data;
        await api.patch(`/users/${userId}`, rest);
        toast.success('User updated!');
      } else {
        await api.post('/users', data);
        toast.success('User created!');
      }
      qc.invalidateQueries({ queryKey: ['users'] });
      router.push('/owner/users');
    }
    catch (e: unknown) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'); }
  }

  return (
    <OwnerShell>
      <Link href="/owner/users" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <PageHeader title={isEdit ? 'Edit User' : 'New User'} />
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg">
        <Card className="space-y-4">
          <div><label className="mb-1.5 block text-sm font-medium">Full Name *</label><input {...register('name', { required: true })} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
          <div><label className="mb-1.5 block text-sm font-medium">Email *</label><input {...register('email', { required: !isEdit })} type="email" disabled={isEdit} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-70" /></div>
          {!isEdit && (
            <div><label className="mb-1.5 block text-sm font-medium">Password *</label><input {...register('password', { required: true })} type="password" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
          )}
          <div><label className="mb-1.5 block text-sm font-medium">Role</label>
            <select {...register('role')} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
              <option value="CUSTOMER">Customer</option><option value="STAFF">Staff</option>
            </select>
          </div>
          <div><label className="mb-1.5 block text-sm font-medium">Business Name</label><input {...register('businessName')} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
          <div><label className="mb-1.5 block text-sm font-medium">Phone</label><input {...register('phone')} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
          <div><label className="mb-1.5 block text-sm font-medium">Address</label><input {...register('address')} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
          <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}{isEdit ? 'Update User' : 'Create User'}
          </button>
        </Card>
      </form>
    </OwnerShell>
  );
}

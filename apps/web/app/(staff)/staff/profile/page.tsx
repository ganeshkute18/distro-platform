'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useMe } from '../../../../hooks/use-api';
import { api } from '../../../../lib/api-client';
import { PageHeader, Card, PageLoader } from '../../../../components/shared';
import StaffShell from '../../../../components/layout/StaffShell';
import toast from 'react-hot-toast';
import { Loader2, LogOut, Settings } from 'lucide-react';
import { compressImageToBase64 } from '../../../../lib/image-utils';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../store/auth.store';

export default function StaffProfilePage() {
  const { data: user, isLoading } = useMe();
  const qc = useQueryClient();
  const router = useRouter();
  const { clear } = useAuthStore();
  const [imageProcessing, setImageProcessing] = React.useState(false);
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm();

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

  async function onAvatarSelect(file?: File) {
    if (!file) return;
    try {
      setImageProcessing(true);
      const compressed = await compressImageToBase64(file, 200);
      setValue('profileImageUrl', compressed, { shouldDirty: true });
      toast.success('Profile image ready to save');
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Image processing failed');
    } finally {
      setImageProcessing(false);
    }
  }

  async function handleLogout() {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clear();
    router.push('/login');
  }

  if (isLoading) return <StaffShell><PageLoader /></StaffShell>;

  return (
    <StaffShell>
      <PageHeader title="My Profile" description="Manage your details and session settings." />
      <div className="grid max-w-3xl gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {(user as any)?.profileImageUrl ? (
                <img src={(user as any).profileImageUrl} alt={user?.name} className="h-full w-full object-cover" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase()
              )}
            </div>
            <div><p className="text-lg font-bold">{user?.name}</p><p className="text-sm text-muted-foreground">{user?.email}</p></div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[['name', 'Full Name', user?.name], ['phone', 'Phone', user?.phone], ['address', 'Address', user?.address]].map(([f, l, d]) => (
              <div key={String(f)}><label className="mb-1.5 block text-sm font-medium">{l}</label><input {...register(String(f))} defaultValue={String(d ?? '')} className="h-11 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
            ))}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Profile Photo</label>
              <input type="file" accept="image/*" onChange={(e) => onAvatarSelect(e.target.files?.[0])} className="h-11 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <input type="hidden" {...register('profileImageUrl')} />
            </div>
            <div><label className="mb-1.5 block text-sm font-medium">New Password</label><input {...register('password')} type="password" placeholder="Leave blank to keep current" className="h-11 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
            <button type="submit" disabled={isSubmitting} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {(isSubmitting || imageProcessing) && <Loader2 className="h-4 w-4 animate-spin" />} {imageProcessing ? 'Processing image…' : 'Save Changes'}
            </button>
          </form>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold">Settings</h3>
          <div className="space-y-2">
            <Link href="/staff/profile" className="flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-muted"><Settings className="h-4 w-4" /> Account Settings</Link>
            <button onClick={handleLogout} className="flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 text-left text-sm text-destructive hover:bg-muted">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </Card>
      </div>
    </StaffShell>
  );
}

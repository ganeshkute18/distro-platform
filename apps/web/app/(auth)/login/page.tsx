'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Package } from 'lucide-react';
import { api } from '../../../lib/api-client';
import { useAuthStore } from '../../../store/auth.store';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      const res = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; name: string; role: 'OWNER' | 'STAFF' | 'CUSTOMER'; businessName?: string };
      }>('/auth/login', data);

      localStorage.setItem('accessToken', res.accessToken);
      localStorage.setItem('refreshToken', res.refreshToken);
      setAuth(res.user, res.accessToken);

      const redirectMap = { OWNER: '/owner/dashboard', STAFF: '/staff/orders', CUSTOMER: '/catalog' };
      router.push(redirectMap[res.user.role]);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Invalid credentials');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Package className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">DistroPro</h1>
          <p className="text-sm text-muted-foreground">B2B Distribution Platform</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-all"
                placeholder="you@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-all"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Demo credentials:</p>
            <p>Owner: owner@distro.com / Password@123</p>
            <p>Staff: staff@distro.com / Password@123</p>
            <p>Customer: customer@distro.com / Password@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

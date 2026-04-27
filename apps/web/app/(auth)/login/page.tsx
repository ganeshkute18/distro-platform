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

const DEV_ACCOUNTS = [
  {
    role: 'Owner',
    emoji: '👑',
    email: 'owner@distro.com',
    password: 'Password@123',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    desc: 'Full access · Dashboard · User management',
  },
  {
    role: 'Staff',
    emoji: '🧑‍💼',
    email: 'staff@distro.com',
    password: 'Password@123',
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#67e8f9',
    desc: 'Orders · Inventory · Reports',
  },
  {
    role: 'Customer',
    emoji: '🛒',
    email: 'customer@distro.com',
    password: 'Password@123',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#6ee7b7',
    desc: 'Browse catalog · Place orders',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [filledEmail, setFilledEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function fillAccount(email: string, password: string) {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    setFilledEmail(email);
    setTimeout(() => setFilledEmail(null), 2000);
  }

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
      <div className="w-full max-w-md space-y-4">

        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Package className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Nath Sales</h1>
          <p className="text-sm text-muted-foreground">B2B Distribution Platform</p>
        </div>

        {/* ───── Dev Quick-Access Panel (hidden in production) ───── */}
        {process.env.NODE_ENV === 'development' && (
        <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-4">
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-amber-700">
            🔧 Dev Test Accounts · Click to auto-fill
          </p>
          <div className="space-y-2">
            {DEV_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                id={`dev-fill-${acc.role.toLowerCase()}`}
                onClick={() => fillAccount(acc.email, acc.password)}
                style={{
                  borderColor: filledEmail === acc.email ? acc.color : acc.border,
                  backgroundColor: filledEmail === acc.email ? acc.bg : 'white',
                }}
                className="flex w-full items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-all duration-150 hover:shadow-md active:scale-[0.99]"
              >
                <span className="text-2xl leading-none">{acc.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: acc.color }}>
                      {acc.role}
                    </span>
                    {filledEmail === acc.email && (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700">
                        ✓ Filled!
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{acc.email}</p>
                  <p className="truncate text-xs text-muted-foreground opacity-70">{acc.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-amber-600">
            All accounts use password:{' '}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono font-bold text-amber-800">
              Password@123
            </code>
          </p>
        </div>
        )}

        {/* ───── Login Form ───── */}
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
              id="login-submit-btn"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

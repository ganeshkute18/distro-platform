'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Package, UserPlus, LogIn } from 'lucide-react';
import { api } from '../../../lib/api-client';
import { useAuthStore } from '../../../store/auth.store';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password required'),
});
type FormData = z.infer<typeof schema>;

const signupSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Min 8 characters'),
  phone: z.string().min(8, 'Phone required'),
  address: z.string().min(5, 'Delivery address required'),
});
type SignupFormData = z.infer<typeof signupSchema>;

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
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const signupForm = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) });

  React.useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const sessionExpiresAt = Number(localStorage.getItem('sessionExpiresAt') || '0');
    const userJson = localStorage.getItem('sessionUser');
    if (!token || !userJson || !sessionExpiresAt || Date.now() > sessionExpiresAt) return;
    try {
      const user = JSON.parse(userJson) as { role: 'OWNER' | 'STAFF' | 'CUSTOMER' };
      const redirectMap = { OWNER: '/owner/dashboard', STAFF: '/staff/orders', CUSTOMER: '/catalog' };
      router.replace(redirectMap[user.role]);
    } catch {
      // ignore bad session payload
    }
  }, [router]);

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
      localStorage.setItem('sessionUser', JSON.stringify(res.user));
      localStorage.setItem('sessionExpiresAt', String(Date.now() + 48 * 60 * 60 * 1000));
      setAuth(res.user, res.accessToken);

      const redirectMap = { OWNER: '/owner/dashboard', STAFF: '/staff/orders', CUSTOMER: '/catalog' };
      router.push(redirectMap[res.user.role]);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Invalid credentials');
    }
  }

  async function onSignup(data: SignupFormData) {
    try {
      await api.post('/auth/signup/customer', {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        address: data.address,
      });
      toast.success('Signup successful. Please sign in.');
      setMode('signin');
      setValue('email', data.email);
      setValue('password', data.password);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Signup failed');
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

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          <button type="button" onClick={() => setMode('signin')} className={`flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${mode === 'signin' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}><LogIn className="h-4 w-4" /> Sign In</button>
          <button type="button" onClick={() => setMode('signup')} className={`flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${mode === 'signup' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}><UserPlus className="h-4 w-4" /> Sign Up</button>
        </div>

        {/* ───── Auth Form ───── */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">{mode === 'signin' ? 'Sign in to your account' : 'Create customer account'}</h2>

          {mode === 'signin' ? (
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
          ) : (
          <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
            <div><label className="mb-1.5 block text-sm font-medium">Full Name</label><input {...signupForm.register('name')} className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
            <div><label className="mb-1.5 block text-sm font-medium">Email</label><input type="email" {...signupForm.register('email')} className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
            <div><label className="mb-1.5 block text-sm font-medium">Password</label><input type="password" {...signupForm.register('password')} className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
            <div><label className="mb-1.5 block text-sm font-medium">Phone Number</label><input {...signupForm.register('phone')} className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
            <div><label className="mb-1.5 block text-sm font-medium">Delivery Address</label><textarea {...signupForm.register('address')} rows={3} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" /></div>
            <button type="submit" disabled={signupForm.formState.isSubmitting} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60">
              {signupForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {signupForm.formState.isSubmitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          )}
        </div>

      </div>
    </div>
  );
}

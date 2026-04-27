'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Package, UserPlus, LogIn, Mail, Phone, HelpCircle } from 'lucide-react';
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
  const [showContactDeveloper, setShowContactDeveloper] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* DISTROPRO HEADER - ALWAYS VISIBLE */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <Package className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">DistroPro</h1>
          <p className="mt-1 text-sm text-muted-foreground">Smart Distribution & Agency Management</p>
        </div>

        {/* Contact Developer Button */}
        <div className="mb-6 flex justify-center">
          <button
            type="button"
            onClick={() => setShowContactDeveloper(!showContactDeveloper)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Contact Developer
          </button>
        </div>

        {/* Contact Developer Card - Expandable */}
        {showContactDeveloper && (
          <div className="mb-6 rounded-xl border bg-card/50 backdrop-blur-sm p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-sm">DistroPro — Built by</h3>
              <div className="flex items-center justify-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  GK
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Ganesh Kute</p>
                  <p className="text-xs text-muted-foreground">Developer</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t pt-3">
              <a
                href="tel:+918830065088"
                className="flex items-center gap-2 rounded-lg p-2.5 hover:bg-accent transition-colors group"
              >
                <Phone className="h-4 w-4 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="text-sm font-medium">8830065088</span>
              </a>
              <a
                href="mailto:ganeshyuvraj18@gmail.com"
                className="flex items-center gap-2 rounded-lg p-2.5 hover:bg-accent transition-colors group"
              >
                <Mail className="h-4 w-4 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="text-sm font-medium">ganeshyuvraj18@gmail.com</span>
              </a>
            </div>

            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                DistroPro is a smart distribution and agency management platform. If you run a product agency — dairy, water, tea, FMCG, or any distribution business — we can set up DistroPro for your team.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowContactDeveloper(false)}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Close
            </button>
          </div>
        )}

        {/* ───── Dev Quick-Access Panel (development only) ───── */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950 p-4">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
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
                    backgroundColor: filledEmail === acc.email ? acc.bg : 'transparent',
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-all duration-150 hover:shadow-md active:scale-[0.99] dark:hover:bg-opacity-10"
                >
                  <span className="text-2xl leading-none">{acc.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: acc.color }}>
                        {acc.role}
                      </span>
                      {filledEmail === acc.email && (
                        <span className="rounded bg-green-100 dark:bg-green-900 px-1.5 py-0.5 text-xs font-semibold text-green-700 dark:text-green-300">
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
            <p className="mt-3 text-center text-xs text-amber-600 dark:text-amber-400">
              All accounts use password:{' '}
              <code className="rounded bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 font-mono font-bold text-amber-800 dark:text-amber-200">
                Password@123
              </code>
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* MODE TABS */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'signin' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'signup' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Sign Up
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* AUTH FORM */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border bg-card/95 backdrop-blur-sm p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-foreground">
            {mode === 'signin' ? 'Sign in to your account' : 'Create customer account'}
          </h2>

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
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
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
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Full Name</label>
                <input
                  {...signupForm.register('name')}
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  {...signupForm.register('email')}
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Password</label>
                <input
                  type="password"
                  {...signupForm.register('password')}
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Phone Number</label>
                <input
                  {...signupForm.register('phone')}
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Your phone number"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Delivery Address</label>
                <textarea
                  {...signupForm.register('address')}
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                  placeholder="Your delivery address"
                />
              </div>
              <button
                type="submit"
                disabled={signupForm.formState.isSubmitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-60"
              >
                {signupForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {signupForm.formState.isSubmitting ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © 2026 DistroPro. All rights reserved.
        </p>
      </div>
    </div>
  );
}

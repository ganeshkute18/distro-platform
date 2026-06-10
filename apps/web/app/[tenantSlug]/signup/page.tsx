'use client';

import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { api } from '../../../lib/api-client';
import toast from 'react-hot-toast';

interface SignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  businessName?: string;
}

export default function TenantCustomerSignupPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const router = useRouter();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<SignupData>();

  const onSubmit = async (data: SignupData) => {
    try {
      await api.post(`/auth/signup/customer/${encodeURIComponent(tenantSlug)}`, data);
      toast.success('Account created. You can sign in now.');
      router.push('/login');
    } catch (error: unknown) {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-lg space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-primary">{tenantSlug}</p>
          <h1 className="mt-1 text-2xl font-bold">Create customer account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your account will be registered directly with this tenant.</p>
        </div>
        <input {...register('name', { required: true })} placeholder="Full name" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
        <input {...register('email', { required: true })} type="email" placeholder="Email" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
        <input {...register('password', { required: true, minLength: 8 })} type="password" placeholder="Password (minimum 8 characters)" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
        <input {...register('businessName')} placeholder="Business name" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
        <input {...register('phone')} placeholder="Phone" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
        <textarea {...register('address')} placeholder="Delivery address" rows={3} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
        <button disabled={isSubmitting} className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </main>
  );
}

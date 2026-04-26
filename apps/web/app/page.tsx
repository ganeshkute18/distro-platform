'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

/**
 * Root page — redirects to the correct dashboard based on the logged-in role.
 * Uses client-side auth store (localStorage-backed) instead of server cookies.
 */
export default function RootPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    const redirectMap: Record<string, string> = {
      OWNER: '/owner/dashboard',
      STAFF: '/staff/orders',
      CUSTOMER: '/catalog',
    };
    router.replace(redirectMap[user.role] ?? '/login');
  }, [user, router]);

  // Show nothing while redirecting
  return null;
}

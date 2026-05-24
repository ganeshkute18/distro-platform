'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';
import type { Role } from '../types';

/**
 * Root page — redirects to the correct dashboard based on logged-in role.
 * Uses client-side auth store (localStorage-backed).
 */
export default function RootPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    const redirectMap: Record<Role, string> = {
      OWNER: '/owner/dashboard',
      STAFF: '/staff/orders',
      CUSTOMER: '/catalog',
      PLATFORM_ADMIN: '/admin/dashboard',
    };
    router.replace(redirectMap[user.role] ?? '/unauthorized');
  }, [user, router]);

  return null;
}

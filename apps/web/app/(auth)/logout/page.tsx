'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import { api } from '../../../lib/api-client';

export default function LogoutPage() {
  const router = useRouter();
  const { clear } = useAuthStore();

  useEffect(() => {
    async function doLogout() {
      try { await api.post('/auth/logout'); } catch { /* ignore */ }
      clear();
      router.replace('/login');
    }
    doLogout();
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing out…</p>
    </div>
  );
}

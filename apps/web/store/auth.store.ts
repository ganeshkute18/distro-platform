import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Role } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  businessName?: string;
  tenantId?: string;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  tenants: TenantInfo[];
  currentTenantId: string | null;
  // Actions
  setAuth: (user: AuthUser, accessToken: string, tenants?: TenantInfo[]) => void;
  clear: () => void;
  setTokens: (access: string, refresh: string) => void;
  switchTenant: (tenantId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      tenants: [],
      currentTenantId: null,

      setAuth: (user, accessToken, tenants = []) => {
        const currentTenantId = user.tenantId || tenants[0]?.id || null;

        // Write cookie for middleware route-protection
        if (typeof document !== 'undefined') {
          const cookieData = { ...user, tenantId: currentTenantId };
          document.cookie = `session=${btoa(JSON.stringify(cookieData))}; path=/; max-age=172800; SameSite=Lax`;
          localStorage.setItem('sessionUser', JSON.stringify(cookieData));
          localStorage.setItem('sessionExpiresAt', String(Date.now() + 48 * 60 * 60 * 1000));
        }
        set({ user, accessToken, tenants, currentTenantId });
      },

      clear: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('sessionUser');
          localStorage.removeItem('sessionExpiresAt');
          document.cookie = 'session=; path=/; max-age=0';
        }
        set({ user: null, accessToken: null, tenants: [], currentTenantId: null });
      },

      setTokens: (access, refresh) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', access);
          localStorage.setItem('refreshToken', refresh);
          localStorage.setItem('sessionExpiresAt', String(Date.now() + 48 * 60 * 60 * 1000));
        }
        set({ accessToken: access });
      },

      switchTenant: (tenantId) => {
        const { tenants, user } = get();
        const tenant = tenants.find((t) => t.id === tenantId);
        if (!tenant) return;

        // Update cookie with new tenant
        if (typeof document !== 'undefined' && user) {
          const cookieData = { ...user, tenantId };
          document.cookie = `session=${btoa(JSON.stringify(cookieData))}; path=/; max-age=172800; SameSite=Lax`;
          localStorage.setItem('sessionUser', JSON.stringify(cookieData));
        }
        set({ currentTenantId: tenantId });
      },
    }),
    {
      name: 'distro-auth',
      partialize: (state) => ({
        user: state.user,
        tenants: state.tenants,
        currentTenantId: state.currentTenantId,
      }),
    },
  ),
);

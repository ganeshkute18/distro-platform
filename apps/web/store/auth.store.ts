import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'STAFF' | 'CUSTOMER';
  businessName?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  // Actions
  setAuth: (user: AuthUser, accessToken: string) => void;
  clear: () => void;
  setTokens: (access: string, refresh: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      setAuth: (user, accessToken) => {
        // Write cookie for middleware route-protection
        if (typeof document !== 'undefined') {
          document.cookie = `session=${btoa(JSON.stringify(user))}; path=/; max-age=172800; SameSite=Lax`;
          localStorage.setItem('sessionUser', JSON.stringify(user));
          localStorage.setItem('sessionExpiresAt', String(Date.now() + 48 * 60 * 60 * 1000));
        }
        set({ user, accessToken });
      },

      clear: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('sessionUser');
          localStorage.removeItem('sessionExpiresAt');
          document.cookie = 'session=; path=/; max-age=0';
        }
        set({ user: null, accessToken: null });
      },

      setTokens: (access, refresh) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', access);
          localStorage.setItem('refreshToken', refresh);
          localStorage.setItem('sessionExpiresAt', String(Date.now() + 48 * 60 * 60 * 1000));
        }
        set({ accessToken: access });
      },
    }),
    {
      name: 'distro-auth',
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

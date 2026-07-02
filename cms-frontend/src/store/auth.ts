import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAuthToken } from '@/api/client';

export interface AdminPayload {
  id: number;
  email: string;
  name?: string | null;
}

interface AuthState {
  token: string | null;
  admin: AdminPayload | null;
  setSession: (token: string, admin: AdminPayload) => void;
  clear: () => void;
  hydrate: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      setSession: (token, admin) => {
        localStorage.setItem('cms_token', token);
        setAuthToken(token);
        set({ token, admin });
      },
      clear: () => {
        localStorage.removeItem('cms_token');
        setAuthToken(null);
        set({ token: null, admin: null });
      },
      hydrate: () => {
        const stored = localStorage.getItem('cms_token');
        if (stored) setAuthToken(stored);
      },
    }),
    {
      name: 'cms-auth',
    }
  )
);

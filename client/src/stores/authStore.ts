import { create } from 'zustand';
import { authClient } from '../lib/auth.client';
import type { User, Session } from '../lib/types';

interface AuthState {
  user: User | null;
  session: Session | null;
  isPending: boolean;
  setUser: (user: User, session: Session) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isPending: true,
  setUser: (user, session) => set({ user, session, isPending: false }),
  logout: async () => {
    await authClient.signOut();
    set({ user: null, session: null });
  },
  checkSession: async () => {
    try {
      const { data, error } = await authClient.getSession();
      if (data) {
        set({ user: data.user as User, session: data.session as Session, isPending: false });
      } else {
        set({ user: null, session: null, isPending: false });
      }
    } catch (e) {
      set({ user: null, session: null, isPending: false });
    }
  }
}));

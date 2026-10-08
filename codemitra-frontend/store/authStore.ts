import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isReady: boolean;
  isLoading: boolean;

  setUser: (user: AuthUser | null) => void;
  setReady: (ready: boolean) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;

  // Helpers
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isStudent: () => boolean;
  hasAccess: (requiredRole: string | string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isReady: false,
      isLoading: false,

      setUser: (user) => set({ user }),
      setReady: (ready) => set({ isReady: ready }),
      setLoading: (loading) => set({ isLoading: loading }),
      clear: () => set({ user: null }),

      isAdmin: () => {
        const role = get().user?.role;
        return role === 'super_admin' || role === 'institution_admin';
      },

      isSuperAdmin: () => get().user?.role === 'super_admin',

      isStudent: () => {
        const role = get().user?.role;
        return role === 'institution_student' || role === 'general_student';
      },

      hasAccess: (requiredRole: string | string[]) => {
        const userRole = get().user?.role;
        if (!userRole) return false;
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        return roles.includes(userRole);
      },
    }),
    {
      name: 'codeverse-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);

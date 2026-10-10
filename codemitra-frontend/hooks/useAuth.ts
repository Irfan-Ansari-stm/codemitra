import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi, setAccessToken } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function useLogin() {
  const router = useRouter();
  const qc = useQueryClient();
  const { setUser, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onMutate: () => setLoading(true),
    onSuccess: ({ data }) => {
      setAccessToken(data.data.accessToken);
      setUser(data.data.user);
      qc.clear();

      // Redirect based on role
      const role = data.data.user.role;
      if (role === 'super_admin') {
        router.push('/super-admin/dashboard');
      } else if (role === 'institution_admin') {
        router.push('/institution/dashboard');
      } else {
        router.push('/institution/dashboard');
      }
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
    onSettled: () => setLoading(false),
  });
}

export function useRegister() {
  const router = useRouter();
  const { setLoading } = useAuthStore();

  return useMutation({
    mutationFn: (vars: { email: string; password: string; name: string }) =>
      authApi.register(vars.email, vars.password, vars.name),
    onMutate: () => setLoading(true),
    onSuccess: () => {
      router.push('/login?registered=true');
    },
    onSettled: () => setLoading(false),
  });
}

export function useLogout() {
  const router = useRouter();
  const qc = useQueryClient();
  const { clear, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onMutate: () => setLoading(true),
    onSettled: () => {
      setAccessToken(null);
      clear();
      qc.clear();
      router.push('/login');
      setLoading(false);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (vars: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(vars.currentPassword, vars.newPassword),
    onSuccess: () => {
      useAuthStore.getState().clear();
      setAccessToken(null);
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
  });
}

export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}

export function useIsAdmin() {
  return useAuthStore((state) => state.isAdmin());
}

export function useIsSuperAdmin() {
  return useAuthStore((state) => state.isSuperAdmin());
}

export function useIsStudent() {
  return useAuthStore((state) => state.isStudent());
}

export function useHasAccess(requiredRole: string | string[]) {
  return useAuthStore((state) => state.hasAccess(requiredRole));
}

export function useProfile() {
  const user = useCurrentUser();

  return useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile().then((r) => r.data.data),
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => authApi.updateProfile(data),
    onSuccess: (response) => {
      useAuthStore.getState().setUser(response.data.data);
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useCheckAuth() {
  const { setUser, setReady, setLoading, user } = useAuthStore();

  return useQuery({
    queryKey: ['auth-check'],
    queryFn: async () => {
      try {
        setLoading(true);
        const response = await authApi.getProfile();
        setUser(response.data.data);
        return response.data.data;
      } catch (error) {
        setUser(null);
        throw error;
      } finally {
        setReady(true);
        setLoading(false);
      }
    },
    enabled: !user, // Only check if user not already in store
    retry: false,
  });
}

import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function useCurrentTenant() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['tenant', 'current', user?.tenantId],
    queryFn: () => tenantApi.current().then((response) => response.data.data),
    enabled: !!user?.tenantId && user.role !== 'super_admin',
    staleTime: 5 * 60 * 1000,
  });
}

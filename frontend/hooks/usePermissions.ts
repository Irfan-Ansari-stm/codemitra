import { useQuery } from '@tanstack/react-query';
import { permissionApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function usePermissions() {
  const user = useAuthStore((state) => state.user);

  const query = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      const res = await permissionApi.me();
      return res.data.data;
    },
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
  });

  const isSuper = user?.role === 'super_admin';
  const roleSlug = query.data?.role?.slug || user?.role || '';
  const permissionSlugs: string[] = query.data?.permissionSlugs || [];

  const hasPermission = (slug: string): boolean => {
    if (isSuper) return true;
    return permissionSlugs.includes(slug);
  };

  const hasAnyPermission = (...slugs: string[]): boolean => {
    if (isSuper) return true;
    return slugs.some((s) => permissionSlugs.includes(s));
  };

  const hasAllPermissions = (...slugs: string[]): boolean => {
    if (isSuper) return true;
    return slugs.every((s) => permissionSlugs.includes(s));
  };

  const canAccessModule = (moduleName: string): boolean => {
    if (isSuper) return true;
    return permissionSlugs.some((s) => s.startsWith(`${moduleName}.`));
  };

  return {
    role: query.data?.role || null,
    roleSlug,
    permissions: query.data?.permissions || [],
    permissionSlugs,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule,
    isSuperAdmin: isSuper,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

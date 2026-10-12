'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuthStore } from '@/store/authStore';
import { useCurrentTenant } from '@/hooks/useTenant';
import { institutionHref, isInstitutionRouteSegment } from '@/lib/workspace';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const tenantQuery = useCurrentTenant();
  const tenantSlug = tenantQuery.data?.slug;

  useEffect(() => {
    if (isReady && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (!isReady || !user) return;
    if (user.role === 'super_admin' && pathname.startsWith('/institution')) router.replace('/super-admin/dashboard');
    if (user.role !== 'super_admin' && pathname.startsWith('/super-admin')) router.replace('/institution/dashboard');
    if (isReady && user?.role === 'super_admin' && pathname.startsWith('/dashboard')) {
      router.replace(pathname === '/dashboard' ? '/super-admin/dashboard' : `/super-admin${pathname.slice('/dashboard'.length)}`);
    }
    if (isReady && user?.role === 'general_student' && pathname.startsWith('/institution/problems')) {
      router.replace(`/dashboard${pathname.slice('/institution'.length)}`);
    }
    if (isReady && user && user.role !== 'general_student' && user.role !== 'super_admin' && pathname.startsWith('/dashboard')) {
      const institutionRoute = pathname === '/dashboard' ? '/institution/dashboard' : `/institution${pathname.slice('/dashboard'.length)}`;
      if (tenantSlug) router.replace(institutionHref(institutionRoute, tenantSlug));
      else if (user.role === 'institution_admin' || user.role === 'institution_student') return;
      else router.replace(institutionRoute);
    }
    if (isReady && user?.role === 'general_student' && pathname.startsWith('/institution/dashboard')) {
      router.replace(`/dashboard${pathname.slice('/institution'.length)}`);
    }
    if (tenantSlug && (user.role === 'institution_admin' || user.role === 'institution_student')) {
      if (pathname.startsWith('/institution/')) {
        router.replace(institutionHref(pathname, tenantSlug));
      } else {
        const [prefix, route] = pathname.split('/').filter(Boolean);
        if (isInstitutionRouteSegment(route) && prefix !== tenantSlug) {
          router.replace(`/${tenantSlug}${pathname.slice(prefix.length + 1)}`);
        }
      }
    }
  }, [isReady, pathname, router, tenantSlug, user]);

  const wrongWorkspace = user && ((pathname.startsWith('/super-admin') && user.role !== 'super_admin') || (pathname.startsWith('/institution') && user.role === 'super_admin'));
  if (!isReady || !user || wrongWorkspace || ((user.role === 'institution_admin' || user.role === 'institution_student') && tenantQuery.isLoading)) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950">Loading your workspace…</div>;
  }
  if ((user.role === 'institution_admin' || user.role === 'institution_student') && tenantQuery.isError) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 p-6 dark:bg-slate-950"><div role="alert" className="max-w-md text-center text-sm text-rose-700 dark:text-rose-300">Could not load your institution workspace. <button type="button" onClick={() => tenantQuery.refetch()} className="ml-1 font-semibold underline">Retry</button></div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />
      <TopBar />
      <main id="main-content" className="min-h-screen pt-16 lg:pl-64">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

export default AppShell;

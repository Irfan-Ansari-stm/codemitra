'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuthStore } from '@/store/authStore';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isReady && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (isReady && user?.role === 'super_admin' && pathname.startsWith('/institution')) router.replace('/super-admin/dashboard');
    if (isReady && user && user.role !== 'super_admin' && pathname.startsWith('/super-admin')) router.replace('/institution/dashboard');
  }, [isReady, pathname, router, user]);

  const wrongWorkspace = user && ((pathname.startsWith('/super-admin') && user.role !== 'super_admin') || (pathname.startsWith('/institution') && user.role === 'super_admin'));
  if (!isReady || !user || wrongWorkspace) return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950">Loading your workspace…</div>;

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

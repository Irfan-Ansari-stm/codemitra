'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Moon, Sun } from 'lucide-react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useCurrentTenant } from '@/hooks/useTenant';
import { institutionHref } from '@/lib/workspace';

const pageNames: Record<string, string> = {
  dashboard: 'Overview', institutions: 'Institutions', users: 'Users', analytics: 'Analytics',
  problems: 'Problems', courses: 'Courses', assignments: 'Assignments', quizzes: 'Quizzes',
  students: 'Students', notifications: 'Notifications', announcements: 'Announcements', settings: 'Settings',
};

export default function TopBar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const tenantQuery = useCurrentTenant();
  const tenantSlug = tenantQuery.data?.slug;
  const { theme, toggleTheme } = useTheme();
  const title = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || 'dashboard';
    if (last === 'dashboard') return 'Overview';
    return pageNames[last] || 'Workspace';
  }, [pathname]);
  const notifications = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApi.list({ unreadOnly: true, limit: 100 }).then((response) => response.data.data ?? []),
    enabled: !!user,
    staleTime: 30_000,
  });
  const unreadCount = Array.isArray(notifications.data) ? notifications.data.length : 0;
  const isDark = theme === 'dark';

  return <header className="fixed right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 pl-16 pr-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6 sm:pl-16 lg:left-64 lg:pl-8">
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
      <p className="hidden text-[11px] text-slate-500 sm:block">CodeVerse workspace</p>
    </div>
    <div className="flex items-center gap-1 sm:gap-2">
      <button type="button" onClick={toggleTheme} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} suppressHydrationWarning className="relative inline-flex h-[18px] w-[18px] rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
        <Sun size={18} className="absolute inset-0 m-auto rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 dark:opacity-0" />
        <Moon size={18} className="absolute inset-0 m-auto rotate-90 scale-0 opacity-0 transition-all duration-300 dark:rotate-0 dark:scale-100 dark:opacity-100" />
      </button>
      <Link href={institutionHref('/institution/notifications', tenantSlug)} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
        <Bell size={18} />{unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </Link>
      {user?.role === 'institution_admin' && <Link href={institutionHref('/institution/settings', tenantSlug)} aria-label="Workspace settings" className="hidden rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white sm:block">Settings</Link>}
    </div>
  </header>;
}

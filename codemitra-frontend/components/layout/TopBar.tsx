'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Moon, Sun } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const pageNames: Record<string, string> = {
  dashboard: 'Overview', institutions: 'Institutions', users: 'Users', analytics: 'Analytics',
  problems: 'Problems', courses: 'Courses', assignments: 'Assignments', quizzes: 'Quizzes',
  students: 'Students', notifications: 'Notifications', announcements: 'Announcements', settings: 'Settings',
};

export default function TopBar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [dark, setDark] = useState(false);
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

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const shouldUseDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', shouldUseDark);
    setDark(shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDark(next);
  };

  return <header className="fixed right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 pl-16 pr-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6 sm:pl-16 lg:left-64 lg:pl-8">
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
      <p className="hidden text-[11px] text-slate-500 sm:block">CodeVerse workspace</p>
    </div>
    <div className="flex items-center gap-1 sm:gap-2">
      <button type="button" onClick={toggleTheme} aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
      <Link href="/institution/notifications" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
        <Bell size={18} />{unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </Link>
      {user?.role === 'institution_admin' && <Link href="/institution/settings" aria-label="Workspace settings" className="hidden rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white sm:block">Settings</Link>}
    </div>
  </header>;
}

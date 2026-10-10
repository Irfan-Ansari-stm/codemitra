'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3, BookOpen, Code2, Home, LayoutDashboard, LogOut, Menu, Settings,
  Users, X, ClipboardList, Bell, FileText,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';

type NavLink = { label: string; href: string; icon: typeof Home };
type NavGroup = { label: string; links: NavLink[] };

function groupsForRole(role: string): NavGroup[] {
  if (role === 'super_admin') return [
    { label: 'Workspace', links: [
      { label: 'Overview', href: '/super-admin/dashboard', icon: LayoutDashboard },
      { label: 'Institutions', href: '/super-admin/institutions', icon: Home },
      { label: 'Users', href: '/super-admin/users', icon: Users },
    ] },
    { label: 'Platform', links: [
      { label: 'Problems', href: '/super-admin/problems', icon: Code2 },
      { label: 'Analytics', href: '/super-admin/analytics', icon: BarChart3 },
    ] },
  ];

  const links: NavLink[] = [{ label: 'Overview', href: '/institution/dashboard', icon: LayoutDashboard }];
  if (role === 'institution_admin') links.push(
    { label: 'Courses', href: '/institution/courses', icon: BookOpen },
    { label: 'Problems', href: '/institution/problems', icon: Code2 },
    { label: 'Assignments', href: '/institution/assignments', icon: ClipboardList },
    { label: 'Quizzes', href: '/institution/quizzes', icon: FileText },
    { label: 'Students', href: '/institution/students', icon: Users },
    { label: 'Analytics', href: '/institution/analytics', icon: BarChart3 },
  );
  if (role === 'institution_student' || role === 'general_student') links.push(
    { label: 'Courses', href: '/institution/courses', icon: BookOpen },
    { label: 'Problems', href: '/problems', icon: Code2 },
    { label: 'Assignments', href: '/institution/assignments', icon: ClipboardList },
  );
  links.push({ label: 'Notifications', href: '/institution/notifications', icon: Bell });
  if (role === 'institution_admin') links.push(
    { label: 'Announcements', href: '/institution/announcements', icon: FileText },
    { label: 'Settings', href: '/institution/settings', icon: Settings },
  );
  return [{ label: 'Workspace', links }];
}

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  if (!user) return null;

  return <>
    <button type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)} className="fixed left-3 top-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 lg:hidden">{open ? <X size={18} /> : <Menu size={18} />}</button>
    {open && <button type="button" aria-label="Close navigation overlay" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <Link href="/" className="flex h-16 items-center gap-3 border-b border-slate-200 px-5 dark:border-slate-800" onClick={() => setOpen(false)}>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white"><Code2 size={19} /></span>
        <span className="text-sm font-semibold tracking-tight">CodeVerse</span>
        <span className="ml-auto rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">{user.role === 'super_admin' ? 'Platform' : 'Workspace'}</span>
      </Link>
      <nav aria-label="Workspace navigation" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {groupsForRole(user.role).map((group) => <section key={group.label}>
          <h2 className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{group.label}</h2>
          <div className="space-y-1">{group.links.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== '/problems' && href !== '/institution/dashboard' && pathname.startsWith(`${href}/`));
            return <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${active ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'}`}>
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} /><span>{label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
            </Link>;
          })}</div>
        </section>)}
      </nav>
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-white">{user.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'U'}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{user.name}</p><p className="truncate text-[11px] text-slate-500">{user.email}</p></div>
          <button type="button" title="Sign out" disabled={logout.isPending} onClick={() => logout.mutate()} className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:hover:bg-rose-500/10" aria-label="Sign out"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  </>;
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Activity, AlertOctagon, BarChart3, Bell, BookOpen, Building2, ChevronDown, ChevronUp,
  ClipboardCheck, ClipboardList, Code2, Cpu, CreditCard, Database, FileText, Flag,
  Globe, Headset, HelpCircle, Home, LayoutDashboard, LogOut, Menu, MessageSquare,
  ScrollText, Settings, ShieldCheck, UserCheck, Users, X, Terminal,
  GraduationCap, Trophy, Award, Receipt, Briefcase, Megaphone, MessagesSquare, Server, FileCode,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { useCurrentTenant } from '@/hooks/useTenant';
import { institutionHref } from '@/lib/workspace';

type NavLink = {
  label: string;
  href: string;
  icon: typeof Home;
  badge?: number | string;
  badgeTone?: 'red' | 'blue' | 'amber';
};

type NavGroup = {
  label: string;
  collapsible?: boolean;
  links: NavLink[];
};

function groupsForRole(role: string, tenantSlug?: string): NavGroup[] {
  if (role === 'super_admin') {
    return [
      {
        label: 'Platform Administration',
        collapsible: true,
        links: [
          { label: 'Institutes', href: '/super-admin/institutions', icon: Building2 },
          { label: 'All Users & Roles', href: '/super-admin/users', icon: Users },
          { label: 'Institute Students', href: '/super-admin/students', icon: UserCheck },
          { label: 'General Users', href: '/super-admin/general-users', icon: Users },
          { label: 'Batches & Cohorts', href: '/super-admin/batches', icon: GraduationCap },
          { label: 'Courses & LMS', href: '/super-admin/courses', icon: BookOpen },
          { label: 'Problems Bank', href: '/super-admin/problems', icon: Code2 },
          { label: 'Online IDE', href: '/dashboard/ide', icon: Terminal },
          { label: 'Contests & Exams', href: '/super-admin/contests', icon: Trophy },
          { label: 'Global Submissions', href: '/super-admin/submissions', icon: FileCode },
          { label: 'Certificates & Badges', href: '/super-admin/certificates', icon: Award },
        ],
      },
      {
        label: 'Operations & Workflow',
        collapsible: true,
        links: [
          { label: 'Approvals Hub', href: '/super-admin/approvals', icon: ClipboardCheck },
          { label: 'Global Analytics', href: '/super-admin/analytics', icon: BarChart3 },
          { label: 'Billing & Plans', href: '/super-admin/billing', icon: CreditCard },
          { label: 'Invoices & Ledger', href: '/super-admin/invoices', icon: Receipt },
          { label: 'Campus Placements', href: '/super-admin/placements', icon: Briefcase },
          { label: 'Support Tickets', href: '/super-admin/support', icon: Headset },
          { label: 'Announcements', href: '/super-admin/announcements', icon: Megaphone },
          { label: 'Notifications', href: '/super-admin/notifications', icon: Bell },
          { label: 'Feedback & Reviews', href: '/super-admin/feedback', icon: MessageSquare },
        ],
      },
      {
        label: 'Content & Marketing',
        collapsible: true,
        links: [
          { label: 'Content Management', href: '/super-admin/content', icon: FileText },
          { label: 'SEO & Metadata', href: '/super-admin/seo', icon: Globe },
          { label: 'Help Center', href: '/super-admin/help-center', icon: HelpCircle },
          { label: 'Community Forums', href: '/super-admin/community', icon: MessagesSquare },
          { label: 'Blog & Articles', href: '/blog', icon: BookOpen },
        ],
      },
      {
        label: 'System & Security',
        collapsible: true,
        links: [
          { label: 'Monitoring & Health', href: '/super-admin/monitoring', icon: Activity },
          { label: 'Execution & WASM', href: '/super-admin/execution', icon: Server },
          { label: 'Security & Compliance', href: '/super-admin/security', icon: ShieldCheck },
          { label: 'Audit & App Logs', href: '/super-admin/logs', icon: ScrollText },
          { label: 'Integrations & APIs', href: '/super-admin/integrations', icon: Cpu },
          { label: 'Backups & Recovery', href: '/super-admin/backup', icon: Database },
          { label: 'Incidents', href: '/super-admin/incidents', icon: AlertOctagon },
          { label: 'Feature Flags & Releases', href: '/super-admin/releases', icon: Flag },
          { label: 'Platform Settings', href: '/super-admin/configuration', icon: Settings },
        ],
      },
    ];
  }

  const isGeneralStudent = role === 'general_student';
  const links: NavLink[] = [
    {
      label: 'Overview',
      href: isGeneralStudent ? '/dashboard' : '/institution/dashboard',
      icon: LayoutDashboard,
    },
  ];

  if (role === 'institution_admin') {
    links.push(
      { label: 'Courses', href: '/institution/courses', icon: BookOpen },
      { label: 'Problems', href: '/institution/problems', icon: Code2 },
      { label: 'Online IDE', href: '/dashboard/ide', icon: Terminal },
      { label: 'Assignments', href: '/institution/assignments', icon: ClipboardList },
      { label: 'Quizzes', href: '/institution/quizzes', icon: FileText },
      { label: 'Students', href: '/institution/students', icon: Users },
      { label: 'Analytics', href: '/institution/analytics', icon: BarChart3 },
    );
  }

  if (role === 'institution_student' || isGeneralStudent) {
    links.push(
      { label: 'Courses', href: '/institution/courses', icon: BookOpen },
      { label: 'Problems', href: isGeneralStudent ? '/dashboard/problems' : '/institution/problems', icon: Code2 },
      { label: 'Online IDE', href: '/dashboard/ide', icon: Terminal },
      { label: 'Assignments', href: '/institution/assignments', icon: ClipboardList },
    );
  }

  links.push({ label: 'Notifications', href: '/institution/notifications', icon: Bell });

  if (role === 'institution_admin') {
    links.push(
      { label: 'Announcements', href: '/institution/announcements', icon: FileText },
      { label: 'Settings', href: '/institution/settings', icon: Settings },
    );
  }

  return [
    {
      label: 'Workspace',
      links: links.map((link) => ({
        ...link,
        href: (userHasTenantWorkspace(role) && link.href !== '/dashboard/ide')
          ? institutionHref(link.href, tenantSlug)
          : link.href,
      })),
    },
  ];
}

function userHasTenantWorkspace(role: string): boolean {
  return role === 'institution_admin' || role === 'institution_student';
}

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const tenantQuery = useCurrentTenant();
  const tenantSlug = tenantQuery.data?.slug;
  const activePath = tenantSlug && pathname.startsWith('/institution/')
    ? institutionHref(pathname, tenantSlug)
    : pathname;
  const [open, setOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const logout = useLogout();

  if (!user) return null;

  const toggleGroup = (groupLabel: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }));
  };

  const isSuperAdmin = user.role === 'super_admin';
  const navGroups = groupsForRole(user.role, tenantSlug);

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="fixed left-3 top-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 lg:hidden"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200/90 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5 dark:border-slate-800">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <Code2 size={18} strokeWidth={2.5} />
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">CodeVerse</span>
          </Link>
          <span className="ml-auto rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {isSuperAdmin ? 'PLATFORM' : 'WORKSPACE'}
          </span>
        </div>

        {/* Navigation list */}
        <nav aria-label="Workspace navigation" className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {/* Top-level Overview Item for Super Admin */}
          {isSuperAdmin && (
            <div className="mb-2">
              {(() => {
                const isOverviewActive = activePath === '/super-admin/dashboard' || activePath === '/super-admin';
                return (
                  <Link
                    href="/super-admin/dashboard"
                    onClick={() => setOpen(false)}
                    aria-current={isOverviewActive ? 'page' : undefined}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isOverviewActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Home size={17} strokeWidth={isOverviewActive ? 2.4 : 1.9} />
                    <span>Overview</span>
                  </Link>
                );
              })()}
            </div>
          )}

          {navGroups.map((group) => {
            const isCollapsed = isSuperAdmin && group.collapsible && collapsedGroups[group.label];

            return (
              <section key={group.label} className="space-y-1">
                <div
                  onClick={() => group.collapsible && toggleGroup(group.label)}
                  className={`flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold tracking-wide text-slate-700 dark:text-slate-300 rounded-md transition-colors ${
                    group.collapsible ? 'cursor-pointer select-none hover:bg-slate-100/60 dark:hover:bg-slate-800/50' : ''
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                    {group.label}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                      ({group.links.length})
                    </span>
                  </span>
                  {group.collapsible && (
                    <span className="text-slate-400 transition-transform duration-150">
                      {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </span>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {group.links.map(({ label, href, icon: Icon, badge, badgeTone }) => {
                      const active = activePath === href || (label !== 'Overview' && activePath.startsWith(`${href}/`));
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? 'page' : undefined}
                          className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            active
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                          }`}
                        >
                          <Icon size={17} strokeWidth={active ? 2.2 : 1.8} className="shrink-0 text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-white" />
                          <span className="truncate">{label}</span>

                          {badge !== undefined && (
                            <span
                              className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                                badgeTone === 'red'
                                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </nav>

        {/* Footer User Profile Card */}
        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-white">
              {isSuperAdmin
                ? 'CS'
                : user.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                {isSuperAdmin ? 'CodeVerse Super Admin' : user.name}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {isSuperAdmin ? 'superadmin@codeverse.com' : user.email}
              </p>
            </div>
            <button
              type="button"
              title="Sign out"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
              className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  Code2,
  Compass,
  GraduationCap,
  HelpCircle,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Search,
  Terminal,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { useCurrentTenant } from '@/hooks/useTenant';
import { institutionHref } from '@/lib/workspace';
import { ThemeSwitcher } from './ThemeSwitcher';
import { cn } from '@/lib/utils';

interface MobileNavigationProps {
  onOpenSearch?: () => void;
}

export function MobileNavigation({ onOpenSearch }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const tenantQuery = useCurrentTenant();
  const tenantSlug = tenantQuery.data?.slug;
  const logout = useLogout();

  // Dynamic role-aware destination hrefs
  const problemsHref =
    user?.role === 'general_student'
      ? '/dashboard/problems'
      : user?.role === 'institution_student' || user?.role === 'institution_admin'
        ? institutionHref('/institution/problems', tenantSlug)
        : user?.role === 'super_admin'
          ? '/super-admin/problems'
          : '/problems';

  const coursesHref =
    user?.role === 'institution_student' || user?.role === 'institution_admin'
      ? institutionHref('/institution/courses', tenantSlug)
      : '/courses';

  const dashboardHref =
    user?.role === 'super_admin'
      ? '/super-admin/dashboard'
      : user?.role === 'general_student'
        ? '/dashboard'
        : institutionHref('/institution/dashboard', tenantSlug);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navLinks = [
    { label: 'Problems', href: problemsHref, icon: Code2 },
    { label: 'Courses', href: coursesHref, icon: GraduationCap },
    { label: 'Platform Architecture', href: '/platform', icon: Layers },
    { label: 'Online IDE', href: user ? '/dashboard/ide' : '/ide', icon: Terminal },
    { label: 'Resources Hub', href: '/resources', icon: Compass },
    { label: 'Blog & Articles', href: '/blog', icon: Newspaper },
    { label: 'FAQs', href: '/faqs', icon: HelpCircle },
    { label: 'About Us', href: '/about', icon: Compass },
    { label: 'Contact Support', href: '/contact', icon: HelpCircle },
  ];

  return (
    <div className="lg:hidden">
      {/* Hamburger Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white/80 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
      >
        {isOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          id="mobile-navigation"
          className="fixed inset-x-0 top-16 z-50 h-[calc(100vh-4rem)] overflow-y-auto border-b border-slate-200/80 bg-white/95 px-4 pb-12 pt-4 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-ink-950/95 animate-in slide-in-from-top-4 duration-200"
        >
          {/* Quick Search Bar */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSearch();
              }}
              className="mb-4 flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400"
            >
              <span className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5" />
                <span>Search courses, problems, or articles...</span>
              </span>
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] dark:border-white/10 dark:bg-white/10">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Navigation Links */}
          <div className="space-y-1">
            {navLinks.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition',
                    active
                      ? 'bg-brand-50 text-brand-900 font-semibold dark:bg-white/[0.08] dark:text-white'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.04]'
                  )}
                >
                  <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Theme & Controls Bar */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 py-3 dark:border-white/10">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Appearance</span>
            <ThemeSwitcher />
          </div>

          {/* Auth Action Buttons */}
          <div className="mt-2 space-y-2 border-t border-slate-100 pt-4 dark:border-white/10">
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 transition hover:bg-brand-700"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Open Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  disabled={logout.isPending}
                  onClick={() => {
                    setIsOpen(false);
                    logout.mutate();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-white/10 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{logout.isPending ? 'Signing out…' : 'Logout'}</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 transition hover:bg-brand-700"
                >
                  <span>Sign up</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileNavigation;

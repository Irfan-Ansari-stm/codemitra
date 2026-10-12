'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ChevronDown, Code2, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';
import { useCurrentTenant } from '@/hooks/useTenant';
import { institutionHref } from '@/lib/workspace';

const navLinks = [
  { label: 'Problems', href: '/problems' },
  { label: 'Courses', href: '/courses' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'About Us', href: '/about' },
];

export function PublicHeader() {
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const tenantQuery = useCurrentTenant();
  const tenantSlug = tenantQuery.data?.slug;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const logout = useLogout();

  const dashboardHref =
    user?.role === 'super_admin'
      ? '/super-admin/dashboard'
      : user?.role === 'general_student'
        ? '/dashboard'
        : institutionHref('/institution/dashboard', tenantSlug);
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
  const initials = user
    ? (
        user.name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join('') ||
        user.email[0] ||
        '?'
      ).toUpperCase()
    : '';

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.avatarUrl]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open && !accountMenuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setAccountMenuOpen(false);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, accountMenuOpen]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-all duration-300',
        scrolled
          ? 'border-slate-200 bg-white/85 backdrop-blur-xl dark:border-white/[0.06] dark:bg-ink-950/85'
          : 'border-transparent bg-white dark:bg-ink-950'
      )}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Link href="/" className="inline-flex shrink-0 items-center gap-2.5" aria-label="CodeVerse home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/30">
            <Code2 className="h-5 w-5 text-brand-400" aria-hidden />
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-slate-950 dark:text-white">
            CodeVerse
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const href = link.label === 'Problems'
              ? problemsHref
              : link.label === 'Courses'
                ? coursesHref
                : link.href;
            const active = pathname === href;
            return (
              <Link
                key={link.label}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'text-slate-950 dark:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          {user ? (
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                aria-label={`Account menu for ${user.name}`}
                aria-expanded={accountMenuOpen}
                aria-controls="account-menu"
                onClick={() => setAccountMenuOpen((value) => !value)}
                className="inline-flex items-center gap-1.5 rounded-full p-1 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:bg-white/[0.08]"
              >
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-600 text-xs font-semibold text-white ring-2 ring-brand-500/20">
                  {user.avatarUrl && !avatarFailed ? (
                    <Image
                      src={user.avatarUrl}
                      alt=""
                      width={36}
                      height={36}
                      unoptimized
                      onError={() => setAvatarFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </span>
                <ChevronDown className="hidden h-4 w-4 sm:block" aria-hidden />
              </button>
              {accountMenuOpen && (
                <div
                  id="account-menu"
                  className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-ink-900"
                >
                  <div className="border-b border-slate-100 px-3 py-2.5 dark:border-white/10">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href={dashboardHref}
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]"
                  >
                    <LayoutDashboard className="h-4 w-4" aria-hidden />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    disabled={logout.isPending}
                    onClick={() => logout.mutate()}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    {logout.isPending ? 'Signing out…' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2.5 sm:flex">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.05] dark:hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Create account
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white lg:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="animate-slideInDown border-t border-slate-200 bg-white/95 px-4 pb-4 pt-2 backdrop-blur-xl dark:border-white/[0.06] dark:bg-ink-950/95 lg:hidden"
        >
          <div className="space-y-1">
            {navLinks.map((link) => {
              const href = link.label === 'Problems'
                ? problemsHref
                : link.label === 'Courses'
                  ? coursesHref
                  : link.href;
              const active = pathname === href;
              return (
                <Link
                  key={link.label}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block rounded-lg px-3 py-2.5 text-sm font-medium transition',
                    active
                      ? 'bg-slate-100 text-slate-950 dark:bg-white/[0.06] dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-white/[0.06]">
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Dashboard
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
                <button
                  type="button"
                  disabled={logout.isPending}
                  onClick={() => logout.mutate()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  {logout.isPending ? 'Signing out…' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Create account
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

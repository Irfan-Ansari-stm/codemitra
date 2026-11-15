'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronDown,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Shield,
  Terminal,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { useCurrentTenant } from '@/hooks/useTenant';
import { institutionHref } from '@/lib/workspace';
import { cn } from '@/lib/utils';

export function UserProfileMenu({ className }: { className?: string }) {
  const user = useAuthStore((state) => state.user);
  const tenantQuery = useCurrentTenant();
  const tenantSlug = tenantQuery.data?.slug;
  const [isOpen, setIsOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const logout = useLogout();

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.avatarUrl]);

  // Handle outside click & escape key
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const dashboardHref =
    user.role === 'super_admin'
      ? '/super-admin/dashboard'
      : user.role === 'general_student'
        ? '/dashboard'
        : institutionHref('/institution/dashboard', tenantSlug);

  const initials = (
    user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('') ||
    user.email[0] ||
    '?'
  ).toUpperCase();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' };
      case 'institution_admin':
        return { label: 'Campus Admin', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' };
      case 'institution_student':
        return { label: 'Student', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' };
      default:
        return { label: 'Learner', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' };
    }
  };

  const badge = getRoleBadge(user.role);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Account Menu Trigger Button */}
      <button
        type="button"
        aria-label={`Account menu for ${user.name}`}
        aria-expanded={isOpen}
        aria-controls="account-menu"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 p-1 pr-2.5 text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white"
      >
        <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 text-xs font-bold text-white shadow-xs">
          {user.avatarUrl && !avatarFailed ? (
            <Image
              src={user.avatarUrl}
              alt=""
              width={32}
              height={32}
              unoptimized
              onError={() => setAvatarFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[100px] truncate text-xs font-semibold leading-tight text-slate-900 dark:text-white">
            {user.name}
          </span>
          <span className="block text-[10px] font-medium leading-none text-slate-400 dark:text-slate-500">
            {badge.label}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-slate-400 transition-transform duration-200 dark:text-slate-500',
            isOpen && 'rotate-180'
          )}
          aria-hidden
        />
      </button>

      {/* Account Dropdown Menu */}
      {isOpen && (
        <div
          id="account-menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-ink-950/95 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Identity Header */}
          <div className="border-b border-slate-100 px-3 py-2.5 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-[11px] font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                  {user.name}
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-medium', badge.color)}>
                {badge.label}
              </span>
              {tenantSlug && (
                <span className="truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-400">
                  {tenantSlug}
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="py-1">
            <Link
              href={dashboardHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]"
            >
              <LayoutDashboard className="h-4 w-4 text-brand-500" aria-hidden />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/dashboard/ide"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]"
            >
              <Terminal className="h-4 w-4 text-slate-400" aria-hidden />
              <span>Online IDE</span>
            </Link>

            <Link
              href="/my-learning"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]"
            >
              <GraduationCap className="h-4 w-4 text-slate-400" aria-hidden />
              <span>My Learning Tracks</span>
            </Link>

            {user.role === 'super_admin' ? (
              <Link
                href="/super-admin/configuration"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]"
              >
                <Shield className="h-4 w-4 text-slate-400" aria-hidden />
                <span>Platform Settings</span>
              </Link>
            ) : (
              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]"
              >
                <HelpCircle className="h-4 w-4 text-slate-400" aria-hidden />
                <span>Help & Support</span>
              </Link>
            )}
          </div>

          {/* Logout Section */}
          <div className="border-t border-slate-100 pt-1 dark:border-white/10">
            <button
              type="button"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span>{logout.isPending ? 'Signing out…' : 'Logout'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfileMenu;

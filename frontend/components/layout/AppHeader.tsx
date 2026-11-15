'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { BrandLogo } from './BrandLogo';
import { DesktopNavigation } from './DesktopNavigation';
import { GlobalSearch } from './GlobalSearch';
import { NotificationCenter } from './NotificationCenter';
import { UserProfileMenu } from './UserProfileMenu';
import { ThemeSwitcher } from './ThemeSwitcher';
import { MobileNavigation } from './MobileNavigation';
import { cn } from '@/lib/utils';

export function AppHeader({ className }: { className?: string }) {
  const user = useAuthStore((state) => state.user);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-200',
        scrolled
          ? 'border-b border-slate-200/80 bg-white/85 shadow-xs backdrop-blur-xl dark:border-white/[0.08] dark:bg-ink-950/85'
          : 'border-b border-transparent bg-white/95 dark:bg-ink-950/95',
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: Brand Logo & Desktop Nav */}
        <div className="flex items-center gap-6">
          <BrandLogo />
          <DesktopNavigation />
        </div>

        {/* Right: Search, Notifications, Theme, User / Auth */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <GlobalSearch />

          <ThemeSwitcher className="hidden sm:inline-flex" />

          {user ? (
            <>
              <NotificationCenter />
              <UserProfileMenu />
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand-500/25 transition hover:bg-brand-700"
              >
                <span>Create account</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Mobile hamburger menu */}
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}

export default AppHeader;

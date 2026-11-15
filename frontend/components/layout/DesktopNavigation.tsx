'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  Code2,
  Compass,
  GraduationCap,
  HelpCircle,
  Layers,
  Newspaper,
  Terminal,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCurrentTenant } from '@/hooks/useTenant';
import { institutionHref } from '@/lib/workspace';
import { cn } from '@/lib/utils';

export function DesktopNavigation({ className }: { className?: string }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const tenantQuery = useCurrentTenant();
  const tenantSlug = tenantQuery.data?.slug;
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Handle outside click & escape key
  useEffect(() => {
    if (!activeDropdown) return;

    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [activeDropdown]);

  // Close dropdown on route change
  useEffect(() => {
    setActiveDropdown(null);
  }, [pathname]);

  const toggleDropdown = (key: string) => {
    setActiveDropdown((prev) => (prev === key ? null : key));
  };

  const isProblemsActive = pathname.includes('/problems');
  const isCoursesActive = pathname.includes('/courses');
  const isBlogActive = pathname.startsWith('/blog');
  const isAboutActive = pathname === '/about';
  const isContactActive = pathname === '/contact';

  return (
    <nav
      ref={containerRef}
      aria-label="Main navigation"
      className={cn('relative hidden items-center gap-1 lg:flex', className)}
    >
      {/* 1. Problems direct link */}
      <Link
        href={problemsHref}
        aria-current={isProblemsActive ? 'page' : undefined}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150',
          isProblemsActive
            ? 'bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white'
            : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
        )}
      >
        <Code2 className="h-3.5 w-3.5 text-brand-500" aria-hidden />
        Problems
      </Link>

      {/* 2. Courses direct link */}
      <Link
        href={coursesHref}
        aria-current={isCoursesActive ? 'page' : undefined}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150',
          isCoursesActive
            ? 'bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white'
            : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
        )}
      >
        <GraduationCap className="h-3.5 w-3.5 text-indigo-500" aria-hidden />
        Courses
      </Link>

      {/* 3. Platform dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleDropdown('platform')}
          aria-expanded={activeDropdown === 'platform'}
          className={cn(
            'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150',
            activeDropdown === 'platform'
              ? 'bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
          )}
        >
          <span>Platform</span>
          <ChevronDown
            className={cn(
              'h-3 w-3 transition-transform duration-150',
              activeDropdown === 'platform' && 'rotate-180'
            )}
            aria-hidden
          />
        </button>

        {activeDropdown === 'platform' && (
          <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-ink-950/95 animate-in fade-in zoom-in-95 duration-150">
            <Link
              href="/platform"
              onClick={() => setActiveDropdown(null)}
              className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-slate-100/70 dark:hover:bg-white/[0.06]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Architecture & Engine</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  16+ languages, microVM sandbox & specs
                </p>
              </div>
            </Link>

            <Link
              href={user ? "/dashboard/ide" : "/ide"}
              onClick={() => setActiveDropdown(null)}
              className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-slate-100/70 dark:hover:bg-white/[0.06]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300">
                <Terminal className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Online IDE</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Instant multi-language compiler with WASM
                </p>
              </div>
            </Link>

            <Link
              href={problemsHref}
              onClick={() => setActiveDropdown(null)}
              className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-slate-100/70 dark:hover:bg-white/[0.06]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Code2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Challenges & Tests</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Practice problems with automated grading
                </p>
              </div>
            </Link>

            <Link
              href="/apply-institution"
              onClick={() => setActiveDropdown(null)}
              className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-slate-100/70 dark:hover:bg-white/[0.06]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Campus Portals</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  White-label infrastructure for colleges
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* 4. Resources dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleDropdown('resources')}
          aria-expanded={activeDropdown === 'resources'}
          className={cn(
            'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150',
            activeDropdown === 'resources' || isBlogActive || pathname === '/resources' || pathname === '/faqs' || pathname === '/status'
              ? 'bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
          )}
        >
          <span>Resources</span>
          <ChevronDown
            className={cn(
              'h-3 w-3 transition-transform duration-150',
              activeDropdown === 'resources' && 'rotate-180'
            )}
            aria-hidden
          />
        </button>

        {activeDropdown === 'resources' && (
          <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-ink-950/95 animate-in fade-in zoom-in-95 duration-150">
            <Link
              href="/resources"
              onClick={() => setActiveDropdown(null)}
              className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-slate-100/70 dark:hover:bg-white/[0.06]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Resources Hub</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Directory of learning guides and tools
                </p>
              </div>
            </Link>

            <Link
              href="/blog"
              onClick={() => setActiveDropdown(null)}
              className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-slate-100/70 dark:hover:bg-white/[0.06]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
                <Newspaper className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Blog & Articles</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Engineering insights, tutorials, and updates
                </p>
              </div>
            </Link>

            <Link
              href="/faqs"
              onClick={() => setActiveDropdown(null)}
              className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-slate-100/70 dark:hover:bg-white/[0.06]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Frequently Asked Questions</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Searchable FAQ knowledge base
                </p>
              </div>
            </Link>

            <Link
              href="/contact"
              onClick={() => setActiveDropdown(null)}
              className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-slate-100/70 dark:hover:bg-white/[0.06]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Help & Support</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Submit a query or request assistance
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* 5. Company direct links */}
      <Link
        href="/about"
        aria-current={isAboutActive ? 'page' : undefined}
        className={cn(
          'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150',
          isAboutActive
            ? 'bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white'
            : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
        )}
      >
        About
      </Link>

      <Link
        href="/contact"
        aria-current={isContactActive ? 'page' : undefined}
        className={cn(
          'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150',
          isContactActive
            ? 'bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white'
            : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
        )}
      >
        Contact
      </Link>
    </nav>
  );
}

export default DesktopNavigation;

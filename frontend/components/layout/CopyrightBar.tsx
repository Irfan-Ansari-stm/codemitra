'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export function CopyrightBar({ className }: { className?: string }) {
  const currentYear = new Date().getFullYear();

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-8 dark:border-white/[0.08] sm:flex-row',
        className
      )}
    >
      {/* Left: Copyright */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 sm:justify-start">
        <span>&copy; {currentYear} CodeVerse Inc. All rights reserved.</span>
        <span className="hidden sm:inline">&bull;</span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          Built for modern developer education & multi-tenant campuses.
        </span>
      </div>

      {/* Right: Live System Status & Legal Links */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <Link
          href="/super-admin/monitoring"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50/50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-100/50 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-400"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>All systems operational</span>
        </Link>

        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/about"
            className="transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            Privacy
          </Link>
          <Link
            href="/about"
            className="transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            Terms
          </Link>
          <Link
            href="/about"
            className="transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            Cookies
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CopyrightBar;

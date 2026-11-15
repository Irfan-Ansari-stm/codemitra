'use client';

import Link from 'next/link';
import { Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  href?: string;
}

export function BrandLogo({ className, showText = true, href = '/' }: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-0.5',
        className
      )}
      aria-label="CodeVerse home"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm shadow-brand-500/25 ring-1 ring-white/20 transition-all duration-200 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-brand-500/35">
        <Code2 className="h-5 w-5 text-white" aria-hidden />
        <span className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 opacity-0 blur-sm transition-opacity group-hover:opacity-40" />
      </span>
      {showText && (
        <span className="flex items-center gap-1.5">
          <span className="text-[17px] font-bold tracking-tight text-slate-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
            CodeVerse
          </span>
          <span className="rounded-full border border-slate-200/80 bg-slate-100/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-400">
            v2.0
          </span>
        </span>
      )}
    </Link>
  );
}

export default BrandLogo;

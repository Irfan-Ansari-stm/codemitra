'use client';

import Link from 'next/link';
import { ArrowRight, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 ring-1 ring-brand-500/20">
        <SearchX className="h-8 w-8 text-brand-600 dark:text-brand-400" aria-hidden />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-400">
        The page you are looking for does not exist or has been moved.
        It may have been unpublished or the link may be incorrect.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Back to home
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/[0.08]"
        >
          Visit the blog
        </Link>
      </div>
    </div>
  );
}

'use client';

import { AlertTriangle, SearchX, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlogErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function BlogErrorState({
  message = 'We could not load the articles. Check your connection and try again.',
  onRetry,
  className,
}: BlogErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.04] px-6 py-14 text-center',
        className
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
        <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
        Something went wrong
      </h2>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
        >
          Try again
        </button>
      )}
    </div>
  );
}

interface BlogEmptyStateProps {
  title?: string;
  message?: string;
  hasFilters?: boolean;
  onReset?: () => void;
  className?: string;
}

export function BlogEmptyState({
  title = 'No articles found',
  message,
  hasFilters = false,
  onReset,
  className,
}: BlogEmptyStateProps) {
  const Icon = hasFilters ? SearchX : FileText;
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-6 py-14 text-center dark:border-white/[0.08] dark:bg-ink-900/50',
        className
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 ring-1 ring-brand-500/20">
        <Icon className="h-6 w-6 text-brand-600 dark:text-brand-400" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
        {title}
      </h2>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {message ??
          (hasFilters
            ? 'No articles match your current search or filters. Try adjusting them.'
            : 'Articles will appear here once they are published.')}
      </p>
      {hasFilters && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

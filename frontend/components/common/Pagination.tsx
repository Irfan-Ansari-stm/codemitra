'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function pageWindow(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('ellipsis');
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < total - 1) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);
  const buttonBase =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50';
  const neutral =
    'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/10';
  const active =
    'border-brand-500 bg-brand-500 text-white hover:border-brand-500 hover:bg-brand-600';

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center gap-1.5', className)}>
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Go to previous page"
        className={cn(buttonBase, neutral)}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>

      {pages.map((entry, index) =>
        entry === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden
            className="inline-flex h-9 min-w-9 items-center justify-center px-1 text-sm text-slate-400"
          >
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onPageChange(entry)}
            aria-label={`Go to page ${entry}`}
            aria-current={entry === page ? 'page' : undefined}
            className={cn(buttonBase, entry === page ? active : neutral)}
          >
            {entry}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Go to next page"
        className={cn(buttonBase, neutral)}
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}

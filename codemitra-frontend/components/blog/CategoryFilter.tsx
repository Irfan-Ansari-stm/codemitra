'use client';

import { cn } from '@/lib/utils';
import type { BlogCategory } from '@/types';

interface CategoryFilterProps {
  categories: BlogCategory[];
  activeCategory: string;
  onSelect: (slug: string) => void;
  totalCount?: number;
  className?: string;
}

export function CategoryFilter({
  categories,
  activeCategory,
  onSelect,
  totalCount,
  className,
}: CategoryFilterProps) {
  const allCount =
    totalCount ??
    categories.reduce((sum, category) => sum + (category.postCount ?? 0), 0);

  const chips = [
    { slug: 'all', name: 'All articles', count: allCount },
    ...categories.map((category) => ({
      slug: category.slug,
      name: category.name,
      count: category.postCount ?? 0,
    })),
  ];

  return (
    <div
      role="group"
      aria-label="Filter by category"
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      {chips.map((chip) => {
        const active = activeCategory === chip.slug;
        return (
          <button
            key={chip.slug}
            type="button"
            onClick={() => onSelect(chip.slug)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              active
                ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-500/40 hover:text-brand-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-brand-500/40 dark:hover:text-brand-300'
            )}
          >
            {chip.name}
            {chip.count > 0 && (
              <span
                aria-hidden
                className={cn(
                  'rounded-full px-1.5 text-[11px] tabular-nums',
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                )}
              >
                {chip.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

'use client';

import { ArrowUpDown } from 'lucide-react';
import { SORT_OPTIONS } from './constants';
import type { BlogSort } from '@/types';

interface SortSelectProps {
  value: BlogSort;
  onChange: (sort: BlogSort) => void;
  className?: string;
}

export function SortSelect({ value, onChange, className }: SortSelectProps) {
  return (
    <div className={className}>
      <label
        htmlFor="blog-sort"
        className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400"
      >
        Sort by
      </label>
      <div className="relative">
        <ArrowUpDown
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        />
        <select
          id="blog-sort"
          value={value}
          onChange={(event) => onChange(event.target.value as BlogSort)}
          className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  );
}

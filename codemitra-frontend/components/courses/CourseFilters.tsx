'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PAGE_SIZE_OPTIONS,
  SORT_OPTIONS,
  STATUS_FILTERS,
} from './constants';
import type { ContentStatus } from '@/types';

interface CourseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: 'all' | ContentStatus;
  onStatusChange: (value: 'all' | ContentStatus) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  limit: number;
  onLimitChange: (value: number) => void;
  languageOptions: string[];
  language: string;
  onLanguageChange: (value: string) => void;
  activeFilterCount: number;
  onClearAll: () => void;
  isFetching: boolean;
  isLoading: boolean;
  total: number;
  firstItem: number;
  lastItem: number;
}

export function CourseFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sortValue,
  onSortChange,
  limit,
  onLimitChange,
  languageOptions,
  language,
  onLanguageChange,
  activeFilterCount,
  onClearAll,
  isFetching,
  isLoading,
  total,
  firstItem,
  lastItem,
}: CourseFiltersProps) {
  const filterButtonClass = (selected: boolean) =>
    cn(
      'inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50',
      selected
        ? 'border-brand-500/40 bg-brand-500/10 text-brand-700 dark:text-brand-300'
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-slate-200'
    );

  return (
    <section
      aria-label="Search and filter courses"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0e1728] sm:p-5"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <label className="relative block w-full xl:max-w-xl">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            aria-label="Search courses by title, description, or topic"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by course title, topic, or language…"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </label>

        <div role="group" aria-label="Filter courses by status" className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-2 pr-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> Status
          </span>
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={status === filter.value}
              onClick={() => onStatusChange(filter.value)}
              className={filterButtonClass(status === filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {languageOptions.length > 0 && (
        <div
          role="group"
          aria-label="Filter courses by language"
          className="flex max-w-full flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/5"
        >
          <span className="mr-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Language
          </span>
          <button
            type="button"
            aria-pressed={language === ''}
            onClick={() => onLanguageChange('')}
            className={filterButtonClass(language === '')}
          >
            All
          </button>
          {languageOptions.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={language === option}
              onClick={() => onLanguageChange(option)}
              className={filterButtonClass(language === option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 dark:border-white/5">
        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          Sort by
          <select
            aria-label="Sort courses"
            value={sortValue}
            onChange={(event) => onSortChange(event.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          Per page
          <select
            aria-label="Courses per page"
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span aria-live="polite">
            {isLoading
              ? 'Loading courses…'
              : `Showing ${firstItem}–${lastItem} of ${total.toLocaleString()}`}
          </span>
          {isFetching && !isLoading && (
            <span className="animate-pulse" aria-label="Updating results">
              Updating…
            </span>
          )}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Clear all ({activeFilterCount})
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

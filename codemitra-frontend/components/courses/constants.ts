import type { CourseSort, ContentStatus } from '@/types';

export const DEFAULT_PAGE_SIZE = 9;
export const PAGE_SIZE_OPTIONS = [9, 18, 36];
export const FEATURED_LIMIT = 3;
export const SEARCH_DEBOUNCE_MS = 300;

export interface SortOption {
  value: string;
  label: string;
  sort: CourseSort;
  order: 'asc' | 'desc';
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest', sort: 'newest', order: 'desc' },
  { value: 'popular', label: 'Most enrolled', sort: 'popular', order: 'desc' },
  { value: 'title', label: 'Title A–Z', sort: 'title', order: 'asc' },
  { value: 'oldest', label: 'Oldest', sort: 'oldest', order: 'asc' },
];

export interface StatusFilter {
  value: 'all' | ContentStatus;
  label: string;
}

export const STATUS_FILTERS: StatusFilter[] = [
  { value: 'all', label: 'All courses' },
  { value: 'published', label: 'Published' },
];

export const STATUS_BADGE_STYLES: Record<
  ContentStatus,
  string
> = {
  published:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
  draft:
    'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400',
  archived:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300',
};

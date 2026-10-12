import type { BlogSort } from '@/types';

export interface BlogSortOption {
  value: BlogSort;
  label: string;
}

export const SORT_OPTIONS: BlogSortOption[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'popular', label: 'Most viewed' },
  { value: 'title', label: 'Title A–Z' },
];

export const PAGE_SIZE_OPTIONS = [6, 9, 12, 24];

export const DEFAULT_PAGE_SIZE = 9;

export const SEARCH_DEBOUNCE_MS = 300;

export const RELATED_POSTS_LIMIT = 3;

import type { ProblemSortOrder, ProblemSortField } from '@/types';

export interface SortOption {
  value: string;
  label: string;
  sort: ProblemSortField;
  order: ProblemSortOrder;
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'recent', label: 'Recently added', sort: 'created_at', order: 'desc' },
  { value: 'title', label: 'Title A–Z', sort: 'title', order: 'asc' },
  { value: 'difficulty', label: 'Difficulty (easy first)', sort: 'difficulty', order: 'asc' },
  { value: 'acceptance', label: 'Acceptance rate', sort: 'acceptance_rate', order: 'desc' },
  { value: 'attempted', label: 'Most attempted', sort: 'total_submissions', order: 'desc' },
];

export const DIFFICULTY_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const;

export const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'solved', label: 'Solved' },
  { value: 'unsolved', label: 'Unsolved' },
] as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export const DEFAULT_PAGE_SIZE = 20;
